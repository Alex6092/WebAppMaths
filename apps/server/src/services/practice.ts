import { registry } from '@app/content';
import {
  applyResult,
  coinsFor,
  DAILY_BONUS,
  DAILY_LENGTH,
  dayKey,
  gradeAttempt,
  initialLevel,
  isGrade,
  masteryByNotion,
  newLevelState,
  type AttemptRequest,
  type AttemptResponse,
  type GradedAttempt,
  type LevelChange,
  type LevelState,
  type NotionMastery,
  type ReviewItem,
  type RewardResponse,
  type SessionSummary,
  type StartSessionRequest,
  type StartSessionResponse,
} from '@app/core';
import { findReward } from '@app/themes';
import { and, desc, eq, sql } from 'drizzle-orm';
import type { Db } from '../db/client';
import { attempts, children, exerciseStates, practiceSessions, rewardsOwned } from '../db/schema';
import { badRequest, conflict, notFound } from '../errors';
import { awardBadges, dailyState, todaysDailySession } from './motivation';
import { REVIEW_LENGTH, reviewQueue } from './report';

type ChildRow = typeof children.$inferSelect;

export function getLevelState(db: Db, child: ChildRow, pluginId: string): LevelState {
  const row = db
    .select()
    .from(exerciseStates)
    .where(and(eq(exerciseStates.childId, child.id), eq(exerciseStates.pluginId, pluginId)))
    .get();
  if (row)
    return { level: row.level, recent: row.recent, consecutiveErrors: row.consecutiveErrors };
  const plugin = registry.plugin(pluginId);
  return newLevelState(
    plugin ? initialLevel(plugin, isGrade(child.grade) ? child.grade : 'CP') : 1,
  );
}

/** Tentatives prises en compte pour l'acquisition (les plus récentes). */
const MASTERY_HISTORY = 5000;

/** Acquisition des notions demandées (toutes par défaut), d'après les tentatives de l'enfant. */
export function childMasteries(
  db: Db,
  childId: number,
  notionIds: readonly string[] = registry.notions.map((n) => n.id),
): Record<string, NotionMastery> {
  const records = db
    .select({
      pluginId: attempts.pluginId,
      level: attempts.level,
      firstTryCorrect: attempts.firstTryCorrect,
      solved: attempts.solved,
    })
    .from(attempts)
    .where(eq(attempts.childId, childId))
    .orderBy(desc(attempts.createdAt), desc(attempts.id))
    .limit(MASTERY_HISTORY)
    .all()
    .reverse();
  return masteryByNotion(records, registry.plugins, notionIds);
}

const MAX_MIX_NOTIONS = 200;

export function startSession(
  db: Db,
  child: ChildRow,
  input: StartSessionRequest,
): StartSessionResponse {
  let selection: Record<string, unknown>;
  if (input.mode === 'review') {
    const items: ReviewItem[] = reviewQueue(db, child.id)
      .slice(0, REVIEW_LENGTH)
      .map(({ pluginId, level, seed }) => ({ pluginId, level, seed }));
    if (items.length === 0)
      throw badRequest('nothing_to_review', 'Bravo, tu n’as pas d’erreur à revoir !');
    const row = db
      .insert(practiceSessions)
      .values({ childId: child.id, mode: 'review', selection: { items }, startedAt: new Date() })
      .returning({ id: practiceSessions.id })
      .get();
    return { id: row.id, answered: 0, items };
  }
  if (input.mode === 'daily') {
    // Le défi du jour reprend là où il s'était arrêté ; une fois réussi, il revient demain.
    const day = dayKey(new Date());
    const today = todaysDailySession(db, child.id, day);
    if (today && today.nQuestions >= DAILY_LENGTH)
      throw conflict('daily_done', 'Tu as déjà réussi le défi du jour : reviens demain !');
    if (today) {
      db.update(practiceSessions)
        .set({ endedAt: null })
        .where(eq(practiceSessions.id, today.id))
        .run();
      return { id: today.id, answered: today.nQuestions };
    }
    const grade = isGrade(child.grade) ? child.grade : 'CP';
    selection = { day, notions: registry.notionsInScope('all', grade).map((n) => n.id) };
  } else if (input.mode === 'training') {
    const { pluginId } = input.selection;
    if (typeof pluginId !== 'string' || !registry.plugin(pluginId))
      throw notFound('unknown_plugin', 'Exercice inconnu.');
    selection = { pluginId };
  } else {
    const notions = [...new Set(input.selection.notions ?? [])];
    if (
      notions.length === 0 ||
      notions.length > MAX_MIX_NOTIONS ||
      notions.some((id) => !registry.notion(id)) ||
      registry.pluginsOfNotions(notions).length === 0
    )
      throw badRequest('invalid_selection', 'Choisis au moins une notion avec des exercices.');
    selection = { notions };
  }
  const row = db
    .insert(practiceSessions)
    .values({ childId: child.id, mode: input.mode, selection, startedAt: new Date() })
    .returning({ id: practiceSessions.id })
    .get();
  return { id: row.id, answered: 0 };
}

/**
 * La question fait-elle partie de la séance : le bon exercice, une notion du mélange, ou
 * l'une des questions à revoir (même exercice, même niveau, même graine) ?
 */
function belongsToSession(
  session: { mode: string; selection: Record<string, unknown> },
  { pluginId, level, seed }: ReviewItem,
  pluginNotions: readonly string[],
): boolean {
  if (session.mode === 'review') {
    const items = session.selection.items;
    return (
      Array.isArray(items) &&
      (items as ReviewItem[]).some(
        (i) => i.pluginId === pluginId && i.level === level && i.seed === seed,
      )
    );
  }
  if (session.mode === 'mix' || session.mode === 'daily') {
    const notions = session.selection.notions;
    return Array.isArray(notions) && pluginNotions.some((n) => notions.includes(n));
  }
  return session.selection.pluginId === pluginId;
}

export function endSession(db: Db, child: ChildRow, sessionId: number): SessionSummary {
  const session = db
    .select()
    .from(practiceSessions)
    .where(and(eq(practiceSessions.id, sessionId), eq(practiceSessions.childId, child.id)))
    .get();
  if (!session) throw notFound('session_not_found', 'Séance introuvable.');
  const endedAt = session.endedAt ?? new Date();
  if (!session.endedAt) {
    db.update(practiceSessions).set({ endedAt }).where(eq(practiceSessions.id, sessionId)).run();
  }
  return {
    id: session.id,
    nQuestions: session.nQuestions,
    nFirstTry: session.nFirstTry,
    coinsEarned: session.coinsEarned,
    durationMs: endedAt.getTime() - session.startedAt.getTime(),
  };
}

/**
 * Enregistre une tentative : le serveur régénère la question depuis la graine, recorrige
 * chaque essai, puis met à jour le niveau, les pièces et la séance.
 */
export function recordAttempt(db: Db, child: ChildRow, input: AttemptRequest): AttemptResponse {
  const plugin = registry.plugin(input.pluginId);
  if (!plugin) throw notFound('unknown_plugin', 'Exercice inconnu.');
  if (plugin.version !== input.pluginVersion) {
    throw conflict('outdated_plugin', 'L’exercice a été mis à jour : recharge la page.');
  }
  if (input.level < 1 || input.level > plugin.levels.length)
    throw badRequest('invalid_level', 'Niveau invalide.');

  const session = db
    .select()
    .from(practiceSessions)
    .where(and(eq(practiceSessions.id, input.sessionId), eq(practiceSessions.childId, child.id)))
    .get();
  if (!session || session.endedAt)
    throw notFound('session_not_found', 'Séance introuvable ou terminée.');
  if (!belongsToSession(session, input, plugin.notions))
    throw badRequest('wrong_session', 'Cet exercice ne fait pas partie de la séance.');
  const isDaily = session.mode === 'daily';
  if (isDaily && session.nQuestions >= DAILY_LENGTH)
    throw conflict('daily_done', 'Le défi du jour est déjà terminé.');

  let graded: GradedAttempt;
  try {
    graded = gradeAttempt(plugin, input.level, input.seed, input.answers);
  } catch {
    throw badRequest('invalid_answer', 'Réponse invalide.');
  }

  const current = getLevelState(db, child, plugin.id);
  let next = current;
  let levelChange: LevelChange = null;
  // Le niveau n'évolue que pour une question du niveau courant (pas pour un niveau rejoué).
  if (input.level === current.level) {
    ({ state: next, change: levelChange } = applyResult(
      current,
      graded.firstTryCorrect,
      plugin.levels.length,
      plugin.progression,
    ));
  }
  const coinsEarned = coinsFor(
    plugin,
    Math.min(input.level, current.level),
    graded.firstTryCorrect,
    graded.solved,
  );
  // La dernière question du défi du jour apporte le bonus.
  const dailyBonus = isDaily && session.nQuestions === DAILY_LENGTH - 1 ? DAILY_BONUS : 0;
  const now = new Date();

  const coins = db.transaction((tx) => {
    try {
      tx.insert(attempts)
        .values({
          sessionId: session.id,
          childId: child.id,
          pluginId: plugin.id,
          pluginVersion: plugin.version,
          level: input.level,
          seed: input.seed,
          answers: input.answers.slice(0, graded.tries),
          firstTryCorrect: graded.firstTryCorrect,
          solved: graded.solved,
          tries: graded.tries,
          score: graded.score,
          durationMs: Math.max(0, Math.min(input.durationMs, 3_600_000)),
          coins: coinsEarned,
          createdAt: now,
        })
        .run();
    } catch (error) {
      if (String(error).includes('UNIQUE'))
        throw conflict('duplicate_attempt', 'Question déjà enregistrée.');
      throw error;
    }
    tx.insert(exerciseStates)
      .values({ childId: child.id, pluginId: plugin.id, ...next, updatedAt: now })
      .onConflictDoUpdate({
        target: [exerciseStates.childId, exerciseStates.pluginId],
        set: {
          level: next.level,
          recent: next.recent,
          consecutiveErrors: next.consecutiveErrors,
          updatedAt: now,
        },
      })
      .run();
    tx.update(practiceSessions)
      .set({
        nQuestions: sql`${practiceSessions.nQuestions} + 1`,
        nFirstTry: sql`${practiceSessions.nFirstTry} + ${graded.firstTryCorrect ? 1 : 0}`,
        coinsEarned: sql`${practiceSessions.coinsEarned} + ${coinsEarned + dailyBonus}`,
      })
      .where(eq(practiceSessions.id, session.id))
      .run();
    return tx
      .update(children)
      .set({ coins: sql`${children.coins} + ${coinsEarned + dailyBonus}` })
      .where(eq(children.id, child.id))
      .returning({ coins: children.coins })
      .get().coins;
  });

  const notions = childMasteries(db, child.id, plugin.notions);
  return {
    firstTryCorrect: graded.firstTryCorrect,
    solved: graded.solved,
    tries: graded.tries,
    score: graded.score,
    coinsEarned,
    coins,
    level: next.level,
    levelChange,
    results: graded.results,
    notions,
    badges: awardBadges(db, child.id, notions, now),
    daily: isDaily ? dailyState(db, child.id, now) : null,
    dailyBonus,
  };
}

export function buyReward(
  db: Db,
  child: ChildRow,
  themeId: string,
  rewardId: string,
): RewardResponse {
  const reward = findReward(themeId, rewardId);
  if (!reward) throw notFound('unknown_reward', 'Récompense inconnue.');
  const coins = db.transaction((tx) => {
    const owned = tx
      .select()
      .from(rewardsOwned)
      .where(
        and(
          eq(rewardsOwned.childId, child.id),
          eq(rewardsOwned.themeId, themeId),
          eq(rewardsOwned.rewardId, rewardId),
        ),
      )
      .get();
    if (owned) throw conflict('already_owned', 'Tu l’as déjà !');
    const fresh = tx
      .select({ coins: children.coins })
      .from(children)
      .where(eq(children.id, child.id))
      .get();
    if (!fresh || fresh.coins < reward.cost)
      throw badRequest('not_enough_coins', 'Pas encore assez de pièces.');
    tx.insert(rewardsOwned)
      .values({ childId: child.id, themeId, rewardId, acquiredAt: new Date() })
      .run();
    return tx
      .update(children)
      .set({ coins: fresh.coins - reward.cost })
      .where(eq(children.id, child.id))
      .returning({ coins: children.coins })
      .get().coins;
  });
  // Une collection complète vaut un badge.
  return { coins, badges: awardBadges(db, child.id, {}) };
}
