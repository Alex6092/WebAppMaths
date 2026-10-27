import { describe, expect, it } from 'vitest';
import { calendarWeeks, daysInMonth, weekdayOf } from './calendar';

describe('calendrier', () => {
  it('compte les jours du mois, années bissextiles comprises', () => {
    expect(daysInMonth(2026, 10)).toBe(31);
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2028, 2)).toBe(29);
  });

  it('commence la semaine le lundi', () => {
    expect(weekdayOf(2026, 10, 27)).toBe(1); // un mardi
    expect(weekdayOf(2026, 11, 1)).toBe(6); // un dimanche
  });

  it('range le mois en semaines complètes', () => {
    const weeks = calendarWeeks(2026, 10);
    // Le 1er octobre 2026 est un jeudi.
    expect(weeks[0]).toEqual([null, null, null, 1, 2, 3, 4]);
    expect(weeks.at(-1)).toEqual([26, 27, 28, 29, 30, 31, null]);
    expect(weeks.every((w) => w.length === 7)).toBe(true);
  });
});
