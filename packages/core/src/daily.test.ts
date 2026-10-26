import { describe, expect, it } from 'vitest';
import { newBadges } from './badges';
import { dayKey, previousDay, streakOf } from './daily';

describe('jours et série', () => {
  it('compte les jours à l’heure de Paris', () => {
    // 23 h 30 à Paris l'hiver, c'est encore le même jour ; 00 h 30, c'est le lendemain.
    expect(dayKey(new Date('2026-12-01T22:30:00Z'))).toBe('2026-12-01');
    expect(dayKey(new Date('2026-12-01T23:30:00Z'))).toBe('2026-12-02');
    expect(previousDay('2026-03-01')).toBe('2026-02-28');
  });

  it('garde la série tant que le défi d’aujourd’hui reste à faire', () => {
    const days = ['2026-10-20', '2026-10-24', '2026-10-25', '2026-10-26'];
    expect(streakOf(days, '2026-10-26')).toEqual({ current: 3, best: 3, doneToday: true });
    expect(streakOf(days, '2026-10-27')).toEqual({ current: 3, best: 3, doneToday: false });
    expect(streakOf(days, '2026-10-28')).toEqual({ current: 0, best: 3, doneToday: false });
    expect(streakOf([], '2026-10-28')).toEqual({ current: 0, best: 0, doneToday: false });
  });
});

describe('badges', () => {
  it('donne seulement les badges mérités et pas encore gagnés', () => {
    const progress = {
      acquiredNotions: ['maths.calcul.tables'],
      completedCollections: [],
      dailyDone: 10,
      bestStreak: 3,
      questions: 120,
    };
    expect(newBadges(progress, new Set(['daily-1']))).toEqual([
      'notion:maths.calcul.tables',
      'daily-10',
      'streak-3',
      'questions-100',
    ]);
  });
});
