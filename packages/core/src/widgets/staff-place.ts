import type { Mark, StaffPlaceAnswer } from '../question';
import type { WidgetDef } from './types';

export const staffPlaceWidget: WidgetDef<'staff-place'> = {
  id: 'staff-place',

  emptyAnswer: () => ({ positions: [] }),

  validate(q, answer): answer is StaffPlaceAnswer {
    if (typeof answer !== 'object' || answer === null) return false;
    const { positions } = answer as Partial<StaffPlaceAnswer>;
    return (
      Array.isArray(positions) &&
      positions.length <= q.count &&
      positions.every((p) => Number.isInteger(p) && p >= q.min && p <= q.max)
    );
  },

  isComplete: (q, answer) => answer.positions.length === q.count,

  compare(q, expected, given) {
    return comparePositions(q.count, given.positions, (p, i) => p === expected.positions[i]);
  },

  // Les notes justes restent ; les autres s'effacent, à partir de la première fausse.
  retryAnswer(_q, given, result) {
    const positions: number[] = [];
    for (const [i, p] of given.positions.entries()) {
      if (result.marks[i] !== 'ok') break;
      positions.push(p);
    }
    return { positions };
  },

  speech: (q) => q.prompt,
};

/** Corrige chaque note posée ; accept dit si la note i est juste (il peut y avoir deux sol). */
export function comparePositions(
  count: number,
  given: number[],
  accept: (position: number, index: number) => boolean,
) {
  const marks: Record<string, Mark> = {};
  let hits = 0;
  for (let i = 0; i < count; i++) {
    const p = given[i];
    marks[i] = p === undefined ? 'missing' : accept(p, i) ? 'ok' : 'wrong';
    if (marks[i] === 'ok') hits++;
  }
  const correct = hits === count;
  return { correct, score: correct ? 1 : 0, marks };
}
