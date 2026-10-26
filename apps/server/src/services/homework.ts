import { registry } from '@app/content';
import { dayKey, type AssignmentDto, type NewAssignment } from '@app/core';
import { and, desc, eq, gte, isNull, or, sql } from 'drizzle-orm';
import type { Db } from '../db/client';
import { assignments, children, practiceSessions } from '../db/schema';
import { badRequest, notFound } from '../errors';

type ChildRow = typeof children.$inferSelect;
type AssignmentRow = typeof assignments.$inferSelect;
/** db ou une transaction en cours. */
type Tx = Pick<Db, 'select' | 'insert' | 'update'>;

/** Devoirs finis restés visibles par l'enfant (pour la fierté du ✅). */
const DONE_VISIBLE_DAYS = 3;
const DAY_MS = 86_400_000;

/** Questions faites pour un devoir, toutes séances confondues. */
function answeredFor(db: Tx, assignmentId: number): number {
  return (
    db
      .select({ n: sql<number>`coalesce(sum(${practiceSessions.nQuestions}), 0)` })
      .from(practiceSessions)
      .where(
        and(
          eq(practiceSessions.mode, 'homework'),
          eq(sql`json_extract(${practiceSessions.selection}, '$.assignmentId')`, assignmentId),
        ),
      )
      .get()?.n ?? 0
  );
}

export function assignmentDto(db: Tx, row: AssignmentRow): AssignmentDto {
  return {
    id: row.id,
    title: row.title,
    notions: row.notions,
    questions: row.questions,
    answered: Math.min(answeredFor(db, row.id), row.questions),
    dueOn: row.dueOn,
    createdAt: row.createdAt.getTime(),
    completedAt: row.completedAt?.getTime() ?? null,
  };
}

export function getAssignment(db: Tx, child: ChildRow, id: number): AssignmentRow {
  const row = db
    .select()
    .from(assignments)
    .where(and(eq(assignments.id, id), eq(assignments.childId, child.id)))
    .get();
  if (!row) throw notFound('assignment_not_found', 'Devoir introuvable.');
  return row;
}

/** Pour le parent : les derniers devoirs, faits ou non. */
export function listAssignments(db: Db, child: ChildRow): AssignmentDto[] {
  return db
    .select()
    .from(assignments)
    .where(eq(assignments.childId, child.id))
    .orderBy(desc(assignments.createdAt))
    .limit(30)
    .all()
    .map((row) => assignmentDto(db, row));
}

/** Pour l'enfant : les devoirs à faire, et ceux finis il y a peu. */
export function childAssignments(db: Db, child: ChildRow, now = new Date()): AssignmentDto[] {
  return db
    .select()
    .from(assignments)
    .where(
      and(
        eq(assignments.childId, child.id),
        or(
          isNull(assignments.completedAt),
          gte(assignments.completedAt, new Date(now.getTime() - DONE_VISIBLE_DAYS * DAY_MS)),
        ),
      ),
    )
    .orderBy(assignments.dueOn, assignments.id)
    .all()
    .map((row) => assignmentDto(db, row));
}

export function createAssignment(db: Db, child: ChildRow, input: NewAssignment): AssignmentDto {
  const notions = [...new Set(input.notions)];
  if (
    notions.length === 0 ||
    notions.some((id) => !registry.notion(id)) ||
    registry.pluginsOfNotions(notions).length === 0
  )
    throw badRequest('invalid_notions', 'Choisis au moins une notion avec des exercices.');
  if (input.dueOn < dayKey(new Date())) throw badRequest('invalid_due', 'La date est déjà passée.');
  const row = db
    .insert(assignments)
    .values({
      childId: child.id,
      title: input.title.trim(),
      notions,
      questions: input.questions,
      dueOn: input.dueOn,
      createdAt: new Date(),
    })
    .returning()
    .get();
  return assignmentDto(db, row);
}

export function deleteAssignment(db: Db, child: ChildRow, id: number): void {
  const row = getAssignment(db, child, id);
  db.delete(assignments).where(eq(assignments.id, row.id)).run();
}

/** Après une question de devoir : le devoir à jour, et s'il vient d'être fini. */
export function progressAssignment(
  tx: Tx,
  child: ChildRow,
  id: number,
  now: Date,
): { assignment: AssignmentDto; justCompleted: boolean } {
  const row = getAssignment(tx, child, id);
  const done = !row.completedAt && answeredFor(tx, id) >= row.questions;
  if (done) tx.update(assignments).set({ completedAt: now }).where(eq(assignments.id, id)).run();
  return {
    assignment: assignmentDto(tx, done ? { ...row, completedAt: now } : row),
    justCompleted: done,
  };
}
