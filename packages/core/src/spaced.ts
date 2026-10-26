/**
 * Révision espacée (façon Leitner) des notions acquises : une notion revient à J+1, J+3, J+7,
 * J+14 puis tous les 30 jours. Réussie du premier coup, elle avance d'une case ; ratée, elle
 * repart au début. Une notion acquise et déjà réussie en révision est « maîtrisée ».
 */

export const REVIEW_INTERVALS_DAYS = [1, 3, 7, 14, 30] as const;
const DAY_MS = 86_400_000;

export interface NotionReview {
  /** Révisions réussies d'affilée. */
  box: number;
  /** Quand reposer la notion (ms). */
  dueAt: number;
}

/** Une notion qui vient d'être acquise : première révision le lendemain. */
export function firstReview(now: number): NotionReview {
  return { box: 0, dueAt: now + REVIEW_INTERVALS_DAYS[0] * DAY_MS };
}

/** Après une question sur une notion à réviser. */
export function afterReview(
  review: NotionReview,
  firstTryCorrect: boolean,
  now: number,
): NotionReview {
  const box = firstTryCorrect ? review.box + 1 : 0;
  const days = REVIEW_INTERVALS_DAYS[Math.min(box, REVIEW_INTERVALS_DAYS.length - 1)];
  return { box, dueAt: now + days * DAY_MS };
}

export const isDue = (review: NotionReview | undefined, now: number) =>
  review !== undefined && review.dueAt <= now;

/** Maîtrisée : acquise, et déjà réussie lors d'une révision espacée. */
export const isMastered = (review: NotionReview | undefined, acquired: boolean) =>
  acquired && (review?.box ?? 0) >= 1;
