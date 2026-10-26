import { describe, expect, it } from 'vitest';
import { afterReview, firstReview, isDue, isMastered } from './spaced';

const DAY = 86_400_000;

describe('révision espacée', () => {
  it('revient à J+1, J+3, J+7, J+14 puis tous les 30 jours', () => {
    let review = firstReview(0);
    expect(review).toEqual({ box: 0, dueAt: DAY });
    const gaps = [];
    for (let i = 0; i < 6; i++) {
      const now = review.dueAt;
      review = afterReview(review, true, now);
      gaps.push((review.dueAt - now) / DAY);
    }
    expect(gaps).toEqual([3, 7, 14, 30, 30, 30]);
  });

  it('repart au début après une erreur', () => {
    expect(afterReview({ box: 3, dueAt: 0 }, false, 10 * DAY)).toEqual({ box: 0, dueAt: 11 * DAY });
  });

  it('dit si la notion est à réviser, ou maîtrisée', () => {
    expect(isDue({ box: 0, dueAt: DAY }, DAY - 1)).toBe(false);
    expect(isDue({ box: 0, dueAt: DAY }, DAY)).toBe(true);
    expect(isDue(undefined, DAY)).toBe(false);
    expect(isMastered({ box: 1, dueAt: 0 }, true)).toBe(true);
    expect(isMastered({ box: 1, dueAt: 0 }, false)).toBe(false);
    expect(isMastered({ box: 0, dueAt: 0 }, true)).toBe(false);
  });
});
