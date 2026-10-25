import { registry } from '@app/content';
import {
  applyResult,
  coinsFor,
  gradeAttempt,
  initialLevel,
  isGrade,
  newLevelState,
  type AttemptRequest,
  type AttemptResponse,
  type GradedAttempt,
  type LevelChange,
  type LevelState,
  type SessionSummary,
} from '@app/core';
import { findReward } from '@app/themes';
import { and, eq, sql } from 'drizzle-orm';
import type { Db } from '../db/client';
import { attempts, children, exerciseStates, practiceSessions, rewardsOwned } from '../db/schema';
import { badRequest, conflict, notFound } from '../errors';

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

export function startSession(db: Db, child: ChildRow, pluginId: string): number {
  if (!registry.plugin(pluginId)) throw notFound('unknown_plugin', 'Exercice inconnu.');
  const row = db
    .insert(practiceSessions)
    .values({ childId: child.id, mode: 'training', selection: { pluginId }, startedAt: new Date() })
    .returning({ id: practiceSessions.id })
    .get();
  return row.id;
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
        coinsEarned: sql`${practiceSessions.coinsEarned} + ${coinsEarned}`,
      })
      .where(eq(practiceSessions.id, session.id))
      .run();
    return tx
      .update(children)
      .set({ coins: sql`${children.coins} + ${coinsEarned}` })
      .where(eq(children.id, child.id))
      .returning({ coins: children.coins })
      .get().coins;
  });

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
  };
}

export function buyReward(db: Db, child: ChildRow, themeId: string, rewardId: string): number {
  const reward = findReward(themeId, rewardId);
  if (!reward) throw notFound('unknown_reward', 'Récompense inconnue.');
  return db.transaction((tx) => {
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
}
