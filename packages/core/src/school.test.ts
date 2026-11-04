import { expect, it } from 'vitest';
import { schoolYearEnd, schoolYearOf } from './school';

it('année scolaire : du 1er août au 31 août suivant', () => {
  expect(schoolYearOf(new Date(2026, 10, 4))).toBe('2026-2027');
  expect(schoolYearOf(new Date(2027, 5, 30))).toBe('2026-2027');
  expect(schoolYearOf(new Date(2027, 7, 1))).toBe('2027-2028');
  expect(schoolYearEnd('2026-2027')).toEqual(new Date(2027, 7, 31, 23, 59, 59));
});

it('classe suivante : CE1 → CE2, CM2 → 6e, rien après la 3e', async () => {
  const { nextGrade } = await import('./grades');
  expect(nextGrade('CE1')).toBe('CE2');
  expect(nextGrade('CM2')).toBe('6e');
  expect(nextGrade('3e')).toBeNull();
});
