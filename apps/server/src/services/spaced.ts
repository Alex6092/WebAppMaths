import { afterReview, firstReview, isDue, type NotionMastery, type NotionReview } from '@app/core';
import { and, eq, inArray } from 'drizzle-orm';
import type { Db } from '../db/client';
import { notionReviews } from '../db/schema';

/** Révision espacée des notions de l'enfant (toutes, ou celles demandées). */
export function childReviews(
  db: Db,
  childId: number,
  notionIds?: readonly string[],
): Record<string, NotionReview> {
  const rows = db
    .select()
    .from(notionReviews)
    .where(
      notionIds
        ? and(eq(notionReviews.childId, childId), inArray(notionReviews.notionId, [...notionIds]))
        : eq(notionReviews.childId, childId),
    )
    .all();
  return Object.fromEntries(
    rows.map((r) => [r.notionId, { box: r.box, dueAt: r.dueAt.getTime() }]),
  );
}

/**
 * Après une réponse sur les notions d'un exercice : une notion qui vient d'être acquise
 * entre en révision ; une notion à réviser avance (juste du premier coup) ou repart au début.
 */
export function updateReviews(
  db: Db,
  childId: number,
  masteries: Record<string, NotionMastery>,
  firstTryCorrect: boolean,
  now: Date,
): Record<string, NotionReview> {
  const reviews = childReviews(db, childId, Object.keys(masteries));
  for (const [notionId, mastery] of Object.entries(masteries)) {
    const review = reviews[notionId];
    let next: NotionReview | null = null;
    if (!review && mastery.status === 'A') next = firstReview(now.getTime());
    else if (review && isDue(review, now.getTime()))
      next = afterReview(review, firstTryCorrect, now.getTime());
    if (!next) continue;
    reviews[notionId] = next;
    const values = { box: next.box, dueAt: new Date(next.dueAt), reviewedAt: review ? now : null };
    db.insert(notionReviews)
      .values({ childId, notionId, ...values })
      .onConflictDoUpdate({ target: [notionReviews.childId, notionReviews.notionId], set: values })
      .run();
  }
  return reviews;
}
