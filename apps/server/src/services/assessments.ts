import { registry } from '@app/content';
import { dayKey, REWORK_DAYS, type AssessmentDto } from '@app/core';
import { desc, eq } from 'drizzle-orm';
import type { Db } from '../db/client';
import { notionAssessments } from '../db/schema';

const DAY_MS = 86_400_000;

/** Le dernier avis de l'enseignant sur chaque notion évaluée. */
export function latestAssessments(db: Db, childId: number): Record<string, AssessmentDto> {
  const out: Record<string, AssessmentDto> = {};
  const rows = db
    .select()
    .from(notionAssessments)
    .where(eq(notionAssessments.childId, childId))
    .orderBy(desc(notionAssessments.assessedOn), desc(notionAssessments.id))
    .all();
  for (const r of rows)
    out[r.notionId] ??= { result: r.result, assessedOn: r.assessedOn, title: r.title };
  return out;
}

/** Notions à retravailler : le dernier avis est ECA ou NA, et date de moins de 6 semaines. */
export function notionsToRework(db: Db, childId: number, now = new Date()): string[] {
  const since = dayKey(new Date(now.getTime() - REWORK_DAYS * DAY_MS));
  return Object.entries(latestAssessments(db, childId))
    .filter(([id, a]) => a.result !== 'A' && a.assessedOn >= since && registry.notion(id))
    .map(([id]) => id);
}
