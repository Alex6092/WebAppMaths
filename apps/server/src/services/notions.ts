import { registry } from '@app/content';
import { isGrade, type GradeId } from '@app/core';
import { eq } from 'drizzle-orm';
import type { Db } from '../db/client';
import { children, classNotionSettings, classrooms, notionSettings } from '../db/schema';
import { forbidden, notFound } from '../errors';

type ChildRow = typeof children.$inferSelect;
type ClassRow = typeof classrooms.$inferSelect;
/** db ou une transaction en cours. */
type Tx = Pick<Db, 'select'>;

const notionsOfGrade = (grade: GradeId) => registry.notionsInScope('all', grade).map((n) => n.id);

/** Les notions de la classe de l'enfant. */
export function gradeNotions(child: ChildRow): string[] {
  return notionsOfGrade(isGrade(child.grade) ? child.grade : 'CP');
}

function inactiveOfClass(db: Tx, classId: number): Set<string> {
  return new Set(
    db
      .select({ notionId: classNotionSettings.notionId, active: classNotionSettings.active })
      .from(classNotionSettings)
      .where(eq(classNotionSettings.classId, classId))
      .all()
      .filter((s) => !s.active)
      .map((s) => s.notionId),
  );
}

/**
 * Notions vues en classe : celles de son niveau, sauf celles que l'enseignant (enfant inscrit
 * dans une classe) ou le parent a décochées.
 */
export function activeNotions(db: Tx, child: ChildRow): string[] {
  const inactive =
    child.classId !== null
      ? inactiveOfClass(db, child.classId)
      : new Set(
          db
            .select({ notionId: notionSettings.notionId, active: notionSettings.active })
            .from(notionSettings)
            .where(eq(notionSettings.childId, child.id))
            .all()
            .filter((s) => !s.active)
            .map((s) => s.notionId),
        );
  return gradeNotions(child).filter((id) => !inactive.has(id));
}

export function setNotionActive(
  db: Db,
  child: ChildRow,
  notionId: string,
  active: boolean,
): string[] {
  if (child.classId !== null)
    throw forbidden('notions_set_by_school', 'L’enseignant règle les notions vues en classe.');
  if (!registry.notion(notionId)) throw notFound('unknown_notion', 'Notion inconnue.');
  const now = new Date();
  db.insert(notionSettings)
    .values({ childId: child.id, notionId, active, updatedAt: now })
    .onConflictDoUpdate({
      target: [notionSettings.childId, notionSettings.notionId],
      set: { active, updatedAt: now },
    })
    .run();
  return activeNotions(db, child);
}

/** Les notions des niveaux d'une classe, dans l'ordre du catalogue. */
export function classNotions(row: ClassRow): string[] {
  const ids = new Set(row.grades.flatMap(notionsOfGrade));
  return registry.notions.filter((n) => ids.has(n.id)).map((n) => n.id);
}

/** Notions vues dans la classe (tous ses niveaux). */
export function classActiveNotions(db: Tx, row: ClassRow): string[] {
  const inactive = inactiveOfClass(db, row.id);
  return classNotions(row).filter((id) => !inactive.has(id));
}

/** L'enseignant coche ou décoche des notions pour toute la classe. */
export function setClassNotions(
  db: Db,
  row: ClassRow,
  notionIds: string[],
  active: boolean,
): string[] {
  if (notionIds.some((id) => !registry.notion(id)))
    throw notFound('unknown_notion', 'Notion inconnue.');
  const now = new Date();
  db.transaction((tx) => {
    for (const notionId of new Set(notionIds))
      tx.insert(classNotionSettings)
        .values({ classId: row.id, notionId, active, updatedAt: now })
        .onConflictDoUpdate({
          target: [classNotionSettings.classId, classNotionSettings.notionId],
          set: { active, updatedAt: now },
        })
        .run();
  });
  return classActiveNotions(db, row);
}

/** Notions de la leçon en cours dans la classe de l'enfant. */
export function focusNotions(db: Tx, child: ChildRow): string[] {
  if (child.classId === null) return [];
  const row = db
    .select({ focusNotions: classrooms.focusNotions })
    .from(classrooms)
    .where(eq(classrooms.id, child.classId))
    .get();
  return (row?.focusNotions ?? []).filter((id) => registry.notion(id));
}
