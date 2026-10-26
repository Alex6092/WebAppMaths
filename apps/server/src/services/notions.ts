import { registry } from '@app/content';
import { isGrade } from '@app/core';
import { eq } from 'drizzle-orm';
import type { Db } from '../db/client';
import { children, notionSettings } from '../db/schema';
import { notFound } from '../errors';

type ChildRow = typeof children.$inferSelect;

/** Les notions de la classe de l'enfant. */
export function gradeNotions(child: ChildRow): string[] {
  const grade = isGrade(child.grade) ? child.grade : 'CP';
  return registry.notionsInScope('all', grade).map((n) => n.id);
}

/** Notions vues en classe : celles de sa classe, sauf celles que le parent a décochées. */
export function activeNotions(db: Db, child: ChildRow): string[] {
  const inactive = new Set(
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
