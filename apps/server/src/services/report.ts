import { registry } from '@app/content';
import { dayKey, previousDay, type ChildReport, type MistakeDto } from '@app/core';
import { and, desc, eq, gt, gte } from 'drizzle-orm';
import type { Db } from '../db/client';
import { attempts, children, practiceSessions } from '../db/schema';
import { toChildDto } from './family';
import { dailyState } from './motivation';
import { childMasteries } from './practice';

type ChildRow = typeof children.$inferSelect;

/** Période du bilan et des questions à revoir. */
export const REPORT_DAYS = 30;
/** Questions d'une séance « Revoir mes erreurs ». */
export const REVIEW_LENGTH = 10;
const DAY_MS = 86_400_000;

function recentAttempts(db: Db, childId: number, now: Date) {
  return db
    .select({
      pluginId: attempts.pluginId,
      pluginVersion: attempts.pluginVersion,
      level: attempts.level,
      seed: attempts.seed,
      answers: attempts.answers,
      firstTryCorrect: attempts.firstTryCorrect,
      solved: attempts.solved,
      durationMs: attempts.durationMs,
      createdAt: attempts.createdAt,
    })
    .from(attempts)
    .where(
      and(
        eq(attempts.childId, childId),
        gte(attempts.createdAt, new Date(now.getTime() - REPORT_DAYS * DAY_MS)),
      ),
    )
    .orderBy(attempts.createdAt, attempts.id)
    .all();
}
type AttemptRow = ReturnType<typeof recentAttempts>[number];

const toMistake = (a: AttemptRow): MistakeDto => ({
  pluginId: a.pluginId,
  pluginVersion: a.pluginVersion,
  level: a.level,
  seed: a.seed,
  answers: a.answers,
  solved: a.solved,
  createdAt: a.createdAt.getTime(),
});

/** La question se repose-t-elle encore à l'identique (exercice inchangé depuis) ? */
function replayable(a: AttemptRow): boolean {
  const plugin = registry.plugin(a.pluginId);
  return !!plugin && plugin.version === a.pluginVersion && a.level <= plugin.levels.length;
}

/**
 * Questions ratées à revoir, de la plus récente à la plus ancienne. Une question est réparée
 * quand l'enfant la réussit ensuite du premier coup (en la revoyant).
 */
function pendingMistakes(rows: readonly AttemptRow[]): MistakeDto[] {
  const pending = new Map<string, AttemptRow>();
  for (const a of rows) {
    const key = `${a.pluginId}|${a.level}|${a.seed}`;
    if (a.firstTryCorrect) pending.delete(key);
    else if (replayable(a)) pending.set(key, a);
  }
  return [...pending.values()].reverse().map(toMistake);
}

export function reviewQueue(db: Db, childId: number, now = new Date()): MistakeDto[] {
  return pendingMistakes(recentAttempts(db, childId, now));
}

export function childReport(db: Db, child: ChildRow, now = new Date()): ChildReport {
  const rows = recentAttempts(db, child.id, now);

  // Activité jour par jour, en comptant les jours sans rien.
  const byDay = new Map<string, { questions: number; firstTry: number; ms: number }>();
  for (const a of rows) {
    const day = dayKey(a.createdAt);
    const d = byDay.get(day) ?? { questions: 0, firstTry: 0, ms: 0 };
    d.questions++;
    if (a.firstTryCorrect) d.firstTry++;
    d.ms += a.durationMs;
    byDay.set(day, d);
  }
  const days: ChildReport['days'] = [];
  for (let i = 0, day = dayKey(now); i < REPORT_DAYS; i++, day = previousDay(day)) {
    const d = byDay.get(day);
    days.unshift({
      day,
      questions: d?.questions ?? 0,
      firstTry: d?.firstTry ?? 0,
      minutes: Math.round((d?.ms ?? 0) / 60_000),
    });
  }

  // Exercices les plus ratés.
  const byPlugin = new Map<string, { attempts: number; errors: AttemptRow[] }>();
  for (const a of rows) {
    const p = byPlugin.get(a.pluginId) ?? { attempts: 0, errors: [] };
    p.attempts++;
    if (!a.firstTryCorrect) p.errors.push(a);
    byPlugin.set(a.pluginId, p);
  }
  const mistakes = [...byPlugin.entries()]
    .filter(([id, p]) => p.errors.length > 0 && registry.plugin(id))
    .map(([pluginId, p]) => ({
      pluginId,
      attempts: p.attempts,
      errors: p.errors.length,
      recent: p.errors.filter(replayable).slice(-3).reverse().map(toMistake),
    }))
    .sort((a, b) => b.errors - a.errors || b.errors / b.attempts - a.errors / a.attempts)
    .slice(0, 8);

  const sessions = db
    .select()
    .from(practiceSessions)
    .where(and(eq(practiceSessions.childId, child.id), gt(practiceSessions.nQuestions, 0)))
    .orderBy(desc(practiceSessions.startedAt))
    .limit(15)
    .all()
    .map((s) => ({
      id: s.id,
      mode: s.mode,
      pluginId: typeof s.selection.pluginId === 'string' ? s.selection.pluginId : null,
      notions: Array.isArray(s.selection.notions) ? s.selection.notions.length : 0,
      startedAt: s.startedAt.getTime(),
      durationMs: (s.endedAt ?? s.startedAt).getTime() - s.startedAt.getTime(),
      nQuestions: s.nQuestions,
      nFirstTry: s.nFirstTry,
    }));

  return {
    child: toChildDto(child),
    notions: childMasteries(db, child.id),
    daily: dailyState(db, child.id, now),
    days,
    sessions,
    mistakes,
    toReview: pendingMistakes(rows).length,
  };
}
