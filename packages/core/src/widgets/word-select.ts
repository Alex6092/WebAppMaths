import type { WordSelectAnswer, WordSelectQuestion } from '../question';
import { compareAssignments, isAssignment, keepCorrect } from './assign';
import type { WidgetDef } from './types';

export function isSelectable(q: WordSelectQuestion, index: number): boolean {
  return q.tokens[index]?.selectable !== false;
}

/** Texte de la phrase, espaces compris. */
export function tokensText(q: WordSelectQuestion): string {
  return q.tokens.map((t, i) => (i > 0 && !t.glue ? ' ' : '') + t.text).join('');
}

export const wordSelectWidget: WidgetDef<'word-select'> = {
  id: 'word-select',

  emptyAnswer: (q) => ({ picks: q.tokens.map(() => null) }),

  validate(q, answer): answer is WordSelectAnswer {
    if (typeof answer !== 'object' || answer === null) return false;
    const { picks } = answer as Partial<WordSelectAnswer>;
    const colors = new Set(q.colors.map((c) => c.id));
    return (
      isAssignment(picks, q.tokens.length, colors) &&
      picks.every((p, i) => p === null || isSelectable(q, i))
    );
  },

  isComplete: (_q, answer) => answer.picks.some((p) => p !== null),

  compare: (_q, expected, given) => compareAssignments(expected.picks, given.picks),

  retryAnswer: (_q, given, result) => ({ picks: keepCorrect(given.picks, result) }),

  speech(q) {
    if (q.layout === 'sentence') return tokensText(q);
    return q.tokens.map((t) => t.text).join(', ');
  },
};
