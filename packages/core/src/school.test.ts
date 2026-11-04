import { expect, it } from 'vitest';
import { schoolYearEnd, schoolYearOf } from './school';

it('année scolaire : du 1er août au 31 août suivant', () => {
  expect(schoolYearOf(new Date(2026, 10, 4))).toBe('2026-2027');
  expect(schoolYearOf(new Date(2027, 5, 30))).toBe('2026-2027');
  expect(schoolYearOf(new Date(2027, 7, 1))).toBe('2027-2028');
  expect(schoolYearEnd('2026-2027')).toEqual(new Date(2027, 7, 31, 23, 59, 59));
});
