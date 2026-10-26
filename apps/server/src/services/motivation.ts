import { registry } from '@app/content';
import {
  DAILY_LENGTH,
  dayKey,
  newBadges,
  streakOf,
  type DailyState,
  type EarnedBadge,
  type NotionMastery,
  type ThemeResponse,
} from '@app/core';
import { findTheme, FREE_THEME_IDS, THEMES } from '@app/themes';
import { and, count, desc, eq, gte, sql } from 'drizzle-orm';
import type { Db } from '../db/client';
import {
  attempts,
  badges,
  children,
  practiceSessions,
  rewardsOwned,
  themesOwned,
} from '../db/schema';
import { badRequest, notFound } from '../errors';

type ChildRow = typeof children.$inferSelect;
/** db ou une transaction en cours. */
type Tx = Pick<Db, 'select' | 'selectDistinct' | 'insert' | 'update'>;

/* ---------- Ambiances ---------- */

export function unlockedThemes(db: Tx, childId: number): string[] {
  const bought = db
    .select({ themeId: themesOwned.themeId })
    .from(themesOwned)
    .where(eq(themesOwned.childId, childId))
    .all()
    .map((r) => r.themeId);
  return [...new Set([...FREE_THEME_IDS, ...bought])];
}

/** Choisit une ambiance ; si elle n'est pas encore débloquée, on la paie avec ses pièces. */
export function chooseTheme(db: Db, child: ChildRow, themeId: string): ThemeResponse {
  const theme = findTheme(themeId);
  if (!theme) throw notFound('unknown_theme', 'Ambiance inconnue.');
  return db.transaction((tx) => {
    let coins = tx
      .select({ coins: children.coins })
      .from(children)
      .where(eq(children.id, child.id))
      .get()!.coins;
    if (!unlockedThemes(tx, child.id).includes(theme.id)) {
      if (coins < theme.unlockCost)
        throw badRequest('not_enough_coins', 'Pas encore assez de pièces.');
      coins -= theme.unlockCost;
      tx.insert(themesOwned)
        .values({ childId: child.id, themeId: theme.id, unlockedAt: new Date() })
        .run();
    }
    tx.update(children).set({ coins, themeId: theme.id }).where(eq(children.id, child.id)).run();
    return { coins, themeId: theme.id, themes: unlockedThemes(tx, child.id) };
  });
}

/* ---------- Défi du jour et série ---------- */

/** Le jour d'une séance du défi (gardé dans sa sélection). */
const sessionDay = sql<string>`json_extract(${practiceSessions.selection}, '$.day')`;

/** Les jours où le défi a été réussi. */
function dailyDays(db: Tx, childId: number): string[] {
  return db
    .selectDistinct({ day: sessionDay })
    .from(practiceSessions)
    .where(
      and(
        eq(practiceSessions.childId, childId),
        eq(practiceSessions.mode, 'daily'),
        gte(practiceSessions.nQuestions, DAILY_LENGTH),
      ),
    )
    .all()
    .map((r) => r.day);
}

/** La séance du défi d'aujourd'hui (la plus récente), réussie ou non. */
export function todaysDailySession(db: Tx, childId: number, day: string) {
  return db
    .select()
    .from(practiceSessions)
    .where(
      and(
        eq(practiceSessions.childId, childId),
        eq(practiceSessions.mode, 'daily'),
        eq(sessionDay, day),
      ),
    )
    .orderBy(desc(practiceSessions.nQuestions), desc(practiceSessions.id))
    .get();
}

export function dailyState(db: Tx, childId: number, now = new Date()): DailyState {
  const day = dayKey(now);
  const days = dailyDays(db, childId);
  const today = todaysDailySession(db, childId, day);
  return {
    day,
    answered: Math.min(today?.nQuestions ?? 0, DAILY_LENGTH),
    streak: streakOf(days, day),
    total: days.length,
  };
}

/* ---------- Badges ---------- */

export function earnedBadges(db: Tx, childId: number): EarnedBadge[] {
  return db
    .select({ id: badges.badgeId, earnedAt: badges.earnedAt })
    .from(badges)
    .where(eq(badges.childId, childId))
    .orderBy(badges.earnedAt)
    .all()
    .map((b) => ({ id: b.id, earnedAt: b.earnedAt.getTime() }));
}

/** Collections d'ambiance complètes (toutes les récompenses achetées). */
function completedCollections(db: Tx, childId: number): string[] {
  const owned = db
    .select({ themeId: rewardsOwned.themeId, n: count() })
    .from(rewardsOwned)
    .where(eq(rewardsOwned.childId, childId))
    .groupBy(rewardsOwned.themeId)
    .all();
  return THEMES.filter((t) => owned.some((o) => o.themeId === t.id && o.n >= t.rewards.length)).map(
    (t) => t.id,
  );
}

/**
 * Donne à l'enfant les badges qu'il mérite et qu'il n'a pas encore ; renvoie les nouveaux.
 * masteries : l'acquisition des notions à regarder (toutes, ou celles d'un exercice).
 */
export function awardBadges(
  db: Tx,
  childId: number,
  masteries: Record<string, NotionMastery>,
  now = new Date(),
): string[] {
  const earned = new Set(earnedBadges(db, childId).map((b) => b.id));
  const daily = dailyState(db, childId, now);
  const questions = db
    .select({ n: count() })
    .from(attempts)
    .where(eq(attempts.childId, childId))
    .get()!.n;
  const fresh = newBadges(
    {
      acquiredNotions: Object.entries(masteries)
        .filter(([id, m]) => m.status === 'A' && registry.notion(id))
        .map(([id]) => id),
      completedCollections: completedCollections(db, childId),
      dailyDone: daily.total,
      bestStreak: daily.streak.best,
      questions,
    },
    earned,
  );
  if (fresh.length)
    db.insert(badges)
      .values(fresh.map((badgeId) => ({ childId, badgeId, earnedAt: now })))
      .onConflictDoNothing()
      .run();
  return fresh;
}
