import { registry } from '@app/content';
import {
  createRng,
  evaluationCode,
  expectedLevelOf,
  generateQuestion,
  questionSignature,
  randomSeed,
  type EvaluationDto,
  type EvaluationItem,
  type EvaluationQuestion,
  type EvaluationReport,
  type NewEvaluation,
} from '@app/core';
import { and, desc, eq, gte, isNull, or, sql } from 'drizzle-orm';
import type { Db } from '../db/client';
import { attempts, children, evaluations, practiceSessions } from '../db/schema';
import { badRequest, notFound } from '../errors';
import { toChildDto } from './family';

type ChildRow = typeof children.$inferSelect;
type EvaluationRow = typeof evaluations.$inferSelect;
/** db ou une transaction en cours. */
type Tx = Pick<Db, 'select' | 'insert' | 'update'>;

/** Évaluations finies restées visibles par l'enfant. */
const DONE_VISIBLE_DAYS = 3;
const DAY_MS = 86_400_000;
const MAX_NOTIONS = 12;

const itemKey = (i: { pluginId: string; level: number; seed: number }) =>
  `${i.pluginId}|${i.level}|${i.seed}`;

/** Réponses de l'enfant aux questions de l'évaluation, toutes séances confondues. */
function answersFor(db: Tx, evaluationId: number) {
  return db
    .select({
      pluginId: attempts.pluginId,
      pluginVersion: attempts.pluginVersion,
      level: attempts.level,
      seed: attempts.seed,
      answers: attempts.answers,
      firstTryCorrect: attempts.firstTryCorrect,
      createdAt: attempts.createdAt,
    })
    .from(attempts)
    .innerJoin(practiceSessions, eq(practiceSessions.id, attempts.sessionId))
    .where(
      and(
        eq(practiceSessions.mode, 'evaluation'),
        eq(sql`json_extract(${practiceSessions.selection}, '$.evaluationId')`, evaluationId),
      ),
    )
    .orderBy(attempts.createdAt, attempts.id)
    .all();
}

/** Clés des questions déjà répondues. */
export function answeredKeys(db: Tx, evaluationId: number): Set<string> {
  return new Set(answersFor(db, evaluationId).map(itemKey));
}

export function evaluationDto(db: Tx, row: EvaluationRow): EvaluationDto {
  const done = answeredKeys(db, row.id);
  return {
    id: row.id,
    title: row.title,
    notions: row.notions,
    perNotion: row.perNotion,
    total: row.items.length,
    answered: row.items.filter((i) => done.has(itemKey(i))).length,
    createdAt: row.createdAt.getTime(),
    completedAt: row.completedAt?.getTime() ?? null,
  };
}

export function getEvaluation(db: Tx, child: ChildRow, id: number): EvaluationRow {
  const row = db
    .select()
    .from(evaluations)
    .where(and(eq(evaluations.id, id), eq(evaluations.childId, child.id)))
    .get();
  if (!row) throw notFound('evaluation_not_found', 'Évaluation introuvable.');
  return row;
}

/** Pour le parent : les dernières évaluations, faites ou non. */
export function listEvaluations(db: Db, child: ChildRow): EvaluationDto[] {
  return db
    .select()
    .from(evaluations)
    .where(eq(evaluations.childId, child.id))
    .orderBy(desc(evaluations.createdAt), desc(evaluations.id))
    .limit(30)
    .all()
    .map((row) => evaluationDto(db, row));
}

/** Pour l'enfant : les évaluations à faire, et celles finies il y a peu. */
export function childEvaluations(db: Db, child: ChildRow, now = new Date()): EvaluationDto[] {
  return db
    .select()
    .from(evaluations)
    .where(
      and(
        eq(evaluations.childId, child.id),
        or(
          isNull(evaluations.completedAt),
          gte(evaluations.completedAt, new Date(now.getTime() - DONE_VISIBLE_DAYS * DAY_MS)),
        ),
      ),
    )
    .orderBy(evaluations.createdAt, evaluations.id)
    .all()
    .map((row) => evaluationDto(db, row));
}

/**
 * Tire les questions : pour chaque notion, perNotion questions au niveau attendu, en
 * alternant les exercices de la notion et sans poser deux fois la même question.
 */
export function drawItems(notions: readonly string[], perNotion: number): EvaluationItem[] {
  const rng = createRng(randomSeed());
  const items: EvaluationItem[] = [];
  for (const notionId of notions) {
    const plugins = registry.pluginsOfNotions([notionId]);
    if (plugins.length === 0) continue;
    const offset = rng.int(0, plugins.length - 1);
    const seen = new Set<string>();
    for (let n = 0; n < perNotion; n++) {
      const plugin = plugins[(offset + n) % plugins.length]!;
      const level = expectedLevelOf(plugin);
      let seed = randomSeed();
      const signature = (s: number) =>
        `${plugin.id}:${questionSignature(plugin, generateQuestion(plugin, level, s))}`;
      for (let i = 0; i < 20 && seen.has(signature(seed)); i++) seed = randomSeed();
      seen.add(signature(seed));
      items.push({ notionId, pluginId: plugin.id, level, seed });
    }
  }
  return items;
}

export function createEvaluation(db: Db, child: ChildRow, input: NewEvaluation): EvaluationDto {
  // Les notions dans l'ordre du catalogue, comme les lignes d'une évaluation de l'école.
  const wanted = new Set(input.notions);
  const notions = registry.notions.filter((n) => wanted.has(n.id)).map((n) => n.id);
  if (
    notions.length === 0 ||
    notions.length !== wanted.size ||
    notions.length > MAX_NOTIONS ||
    notions.some((id) => registry.pluginsOfNotions([id]).length === 0)
  )
    throw badRequest('invalid_notions', 'Choisis des notions qui ont des exercices.');
  const row = db
    .insert(evaluations)
    .values({
      childId: child.id,
      title: input.title.trim(),
      notions,
      perNotion: input.perNotion,
      items: drawItems(notions, input.perNotion),
      createdAt: new Date(),
    })
    .returning()
    .get();
  return evaluationDto(db, row);
}

export function deleteEvaluation(db: Db, child: ChildRow, id: number): void {
  const row = getEvaluation(db, child, id);
  db.delete(evaluations).where(eq(evaluations.id, row.id)).run();
}

/** Questions qui restent à faire, dans l'ordre. */
export function remainingItems(db: Tx, row: EvaluationRow): EvaluationItem[] {
  const done = answeredKeys(db, row.id);
  return row.items.filter((i) => !done.has(itemKey(i)));
}

/** Après une réponse : l'évaluation à jour, finie quand toutes les questions sont répondues. */
export function progressEvaluation(tx: Tx, row: EvaluationRow, now: Date): EvaluationDto {
  if (!row.completedAt && remainingItems(tx, row).length === 0) {
    tx.update(evaluations).set({ completedAt: now }).where(eq(evaluations.id, row.id)).run();
    return evaluationDto(tx, { ...row, completedAt: now });
  }
  return evaluationDto(tx, row);
}

/** Le bilan : par notion, les points ( x / n ) et le code A / ECA / NA ; puis chaque question. */
export function evaluationReport(db: Db, child: ChildRow, row: EvaluationRow): EvaluationReport {
  const rows = answersFor(db, row.id);
  const byKey = new Map(rows.map((a) => [itemKey(a), a]));
  const questions: EvaluationQuestion[] = row.items.map((item) => {
    const a = byKey.get(itemKey(item));
    return {
      ...item,
      pluginVersion: a?.pluginVersion ?? registry.plugin(item.pluginId)?.version ?? 1,
      answers: a ? a.answers : null,
      correct: a ? a.firstTryCorrect : null,
      answeredAt: a ? a.createdAt.getTime() : null,
    };
  });
  const lines = row.notions.map((notionId) => {
    const mine = questions.filter((q) => q.notionId === notionId);
    const points = mine.filter((q) => q.correct).length;
    return { notionId, points, total: mine.length, code: evaluationCode(points, mine.length) };
  });
  const dto = toChildDto(child);
  return {
    ...evaluationDto(db, row),
    firstName: dto.firstName,
    grade: dto.grade,
    startedAt: rows[0]?.createdAt.getTime() ?? null,
    points: lines.reduce((sum, l) => sum + l.points, 0),
    lines,
    questions,
  };
}
