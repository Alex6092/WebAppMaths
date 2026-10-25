import type { ClassifyAnswer } from '../question';
import { compareAssignments, isAssignment, keepCorrect } from './assign';
import type { WidgetDef } from './types';

export const classifyWidget: WidgetDef<'classify'> = {
  id: 'classify',

  emptyAnswer: (q) => ({ placed: q.items.map(() => null) }),

  validate(q, answer): answer is ClassifyAnswer {
    if (typeof answer !== 'object' || answer === null) return false;
    const { placed } = answer as Partial<ClassifyAnswer>;
    return isAssignment(placed, q.items.length, new Set(q.categories.map((c) => c.id)));
  },

  // Toutes les étiquettes doivent être rangées.
  isComplete: (_q, answer) => answer.placed.every((p) => p !== null),

  compare: (_q, expected, given) => compareAssignments(expected.placed, given.placed),

  retryAnswer: (_q, given, result) => ({ placed: keepCorrect(given.placed, result) }),

  speech(q) {
    const items = q.items.map((i) => i.text).join(', ');
    const categories = q.categories.map((c) => c.label).join(', ');
    return `${items}. Range dans : ${categories}.`;
  },
};
