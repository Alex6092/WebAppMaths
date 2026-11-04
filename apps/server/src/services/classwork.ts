import { registry } from '@app/content';
import {
  EVALUATION_CODES,
  type ClassAssessmentDto,
  type ClassAssignmentDto,
  type ClassOverview,
  type NewClassAssessment,
  type NewClassAssignment,
} from '@app/core';
import { randomUUID } from 'node:crypto';
import { and, desc, eq, gte, inArray, isNotNull } from 'drizzle-orm';
import type { AuthContext } from '../auth/session';
import type { Db } from '../db/client';
import { assignments, attempts, exerciseStates, notionAssessments } from '../db/schema';
import { badRequest, notFound } from '../errors';
import { classPupils, type ClassRow } from './access';
import { assignmentDto, checkAssignment } from './homework';
import { childMasteries } from './practice';
import { reviewQueue } from './report';

const DAY_MS = 86_400_000;

// --- Avis de l'enseignant (A / ECA / NA) -----------------------------------------------------

export function classAssessments(db: Db, row: ClassRow): ClassAssessmentDto[] {
  const byBatch = new Map<string, ClassAssessmentDto>();
  const rows = db
    .select()
    .from(notionAssessments)
    .where(eq(notionAssessments.classId, row.id))
    .orderBy(desc(notionAssessments.assessedOn), desc(notionAssessments.id))
    .all();
  for (const r of rows) {
    let a = byBatch.get(r.batch);
    if (!a) {
      a = {
        batch: r.batch,
        title: r.title,
        assessedOn: r.assessedOn,
        notions: [],
        createdAt: r.createdAt.getTime(),
        results: {},
      };
      byBatch.set(r.batch, a);
    }
    if (!a.notions.includes(r.notionId)) a.notions.push(r.notionId);
    (a.results[r.childId] ??= {})[r.notionId] = r.result;
  }
  // Notions dans l'ordre du catalogue, comme sur la fiche.
  const order = new Map(registry.notions.map((n, i) => [n.id, i]));
  for (const a of byBatch.values())
    a.notions.sort((x, y) => (order.get(x) ?? 0) - (order.get(y) ?? 0));
  return [...byBatch.values()];
}

/** Saisie des résultats d'une évaluation sur papier (remplace la saisie du même batch). */
export function saveClassAssessment(
  db: Db,
  auth: AuthContext,
  row: ClassRow,
  input: NewClassAssessment,
  batch: string = randomUUID(),
): ClassAssessmentDto {
  const notions = [...new Set(input.notions)];
  if (notions.length === 0 || notions.some((id) => !registry.notion(id)))
    throw badRequest('invalid_notions', 'Choisis au moins une notion.');
  const pupils = new Set(classPupils(db, row.id).map((p) => p.id));
  const now = new Date();
  db.transaction((tx) => {
    tx.delete(notionAssessments)
      .where(and(eq(notionAssessments.classId, row.id), eq(notionAssessments.batch, batch)))
      .run();
    for (const [pupilKey, results] of Object.entries(input.results)) {
      const childId = Number(pupilKey);
      if (!pupils.has(childId)) throw notFound('pupil_not_found', 'Élève introuvable.');
      for (const [notionId, result] of Object.entries(results)) {
        if (!notions.includes(notionId) || !EVALUATION_CODES.includes(result))
          throw badRequest('invalid_result', 'Résultat inconnu.');
        tx.insert(notionAssessments)
          .values({
            childId,
            notionId,
            result,
            assessedOn: input.assessedOn,
            title: input.title.trim(),
            batch,
            classId: row.id,
            createdBy: auth.user.id,
            createdAt: now,
          })
          .run();
      }
    }
  });
  return (
    classAssessments(db, row).find((a) => a.batch === batch) ?? {
      batch,
      title: input.title.trim(),
      assessedOn: input.assessedOn,
      notions,
      createdAt: now.getTime(),
      results: {},
    }
  );
}

export function deleteClassAssessment(db: Db, row: ClassRow, batch: string): void {
  const removed = db
    .delete(notionAssessments)
    .where(and(eq(notionAssessments.classId, row.id), eq(notionAssessments.batch, batch)))
    .returning({ id: notionAssessments.id })
    .all();
  if (removed.length === 0) throw notFound('assessment_not_found', 'Évaluation introuvable.');
}

// --- Devoirs de la classe --------------------------------------------------------------------

export function classAssignments(db: Db, row: ClassRow): ClassAssignmentDto[] {
  const byBatch = new Map<string, ClassAssignmentDto>();
  const rows = db
    .select()
    .from(assignments)
    .where(and(eq(assignments.classId, row.id), isNotNull(assignments.batch)))
    .orderBy(desc(assignments.createdAt), assignments.id)
    .limit(600)
    .all();
  for (const r of rows) {
    let a = byBatch.get(r.batch!);
    if (!a) {
      a = {
        batch: r.batch!,
        title: r.title,
        notions: r.notions,
        questions: r.questions,
        dueOn: r.dueOn,
        createdAt: r.createdAt.getTime(),
        pupils: [],
      };
      byBatch.set(r.batch!, a);
    }
    const dto = assignmentDto(db, r);
    a.pupils.push({ pupilId: r.childId, answered: dto.answered, completedAt: dto.completedAt });
  }
  return [...byBatch.values()].slice(0, 30);
}

/** Un devoir pour la classe : une ligne par élève, regroupées par batch. */
export function createClassAssignment(
  db: Db,
  auth: AuthContext,
  row: ClassRow,
  input: NewClassAssignment,
): ClassAssignmentDto {
  const notions = checkAssignment(input);
  const wanted = input.pupilIds ? new Set(input.pupilIds) : null;
  const pupils = classPupils(db, row.id).filter((p) => !wanted || wanted.has(p.id));
  if (pupils.length === 0) throw badRequest('no_pupils', 'Choisis au moins un élève.');
  const batch = randomUUID();
  const now = new Date();
  db.transaction((tx) => {
    for (const p of pupils)
      tx.insert(assignments)
        .values({
          childId: p.id,
          batch,
          classId: row.id,
          createdBy: auth.user.id,
          title: input.title.trim(),
          notions,
          questions: input.questions,
          dueOn: input.dueOn,
          createdAt: now,
        })
        .run();
  });
  return classAssignments(db, row).find((a) => a.batch === batch)!;
}

export function deleteClassAssignment(db: Db, row: ClassRow, batch: string): void {
  const removed = db
    .delete(assignments)
    .where(and(eq(assignments.classId, row.id), eq(assignments.batch, batch)))
    .returning({ id: assignments.id })
    .all();
  if (removed.length === 0) throw notFound('assignment_not_found', 'Devoir introuvable.');
}

// --- Suivi et fiches -------------------------------------------------------------------------

/** Le niveau de chaque élève dans chaque exercice déjà travaillé (fiches à leur niveau). */
export function classLevels(db: Db, row: ClassRow): Record<number, Record<string, number>> {
  const ids = classPupils(db, row.id).map((p) => p.id);
  const out: Record<number, Record<string, number>> = Object.fromEntries(ids.map((id) => [id, {}]));
  if (ids.length === 0) return out;
  for (const s of db
    .select({
      childId: exerciseStates.childId,
      pluginId: exerciseStates.pluginId,
      level: exerciseStates.level,
    })
    .from(exerciseStates)
    .where(inArray(exerciseStates.childId, ids))
    .all())
    out[s.childId]![s.pluginId] = s.level;
  return out;
}

export function classOverview(db: Db, row: ClassRow, now = new Date()): ClassOverview {
  const pupils = classPupils(db, row.id);
  const since = new Date(now.getTime() - 7 * DAY_MS);
  const focus = row.focusNotions.filter((id) => registry.notion(id));
  const homework = db
    .select({ childId: assignments.childId, completedAt: assignments.completedAt })
    .from(assignments)
    .where(and(eq(assignments.classId, row.id), isNotNull(assignments.batch)))
    .all();
  return {
    pupils: pupils.map((p) => {
      const recent = db
        .select({ createdAt: attempts.createdAt })
        .from(attempts)
        .where(and(eq(attempts.childId, p.id), gte(attempts.createdAt, since)))
        .all();
      const last = db
        .select({ createdAt: attempts.createdAt })
        .from(attempts)
        .where(eq(attempts.childId, p.id))
        .orderBy(desc(attempts.createdAt))
        .limit(1)
        .get();
      const mine = homework.filter((h) => h.childId === p.id);
      const masteries = focus.length > 0 ? childMasteries(db, p.id, focus) : {};
      return {
        pupilId: p.id,
        questions7d: recent.length,
        lastActiveAt: last?.createdAt.getTime() ?? null,
        homeworkDone: mine.filter((h) => h.completedAt !== null).length,
        homeworkTotal: mine.length,
        toReview: reviewQueue(db, p.id, now).length,
        focus: Object.fromEntries(
          focus.flatMap((id) => (masteries[id] ? [[id, masteries[id]]] : [])),
        ),
      };
    }),
  };
}
