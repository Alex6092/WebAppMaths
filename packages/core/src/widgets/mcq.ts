import type { Mark, McqAnswer } from '../question';
import { mathToSpeech } from '../speech';
import type { WidgetDef } from './types';

export const mcqWidget: WidgetDef<'mcq'> = {
  id: 'mcq',

  emptyAnswer: () => ({ selected: [] }),

  validate(q, answer): answer is McqAnswer {
    if (typeof answer !== 'object' || answer === null) return false;
    const { selected } = answer as Partial<McqAnswer>;
    if (!Array.isArray(selected) || new Set(selected).size !== selected.length) return false;
    if (!q.multiple && selected.length > 1) return false;
    return selected.every((id) => q.choices.some((c) => c.id === id));
  },

  isComplete: (_q, answer) => answer.selected.length > 0,

  compare(q, expected, given) {
    const want = new Set(expected.selected);
    const got = new Set(given.selected);
    const marks: Record<string, Mark> = {};
    let hits = 0;
    let errors = 0;
    for (const choice of q.choices) {
      if (got.has(choice.id) && want.has(choice.id)) {
        marks[choice.id] = 'ok';
        hits++;
      } else if (got.has(choice.id)) {
        marks[choice.id] = 'wrong';
        errors++;
      } else if (want.has(choice.id)) {
        marks[choice.id] = 'missing';
      }
    }
    const correct = errors === 0 && hits === want.size;
    const score = q.multiple
      ? Math.max(0, hits - errors) / Math.max(1, want.size)
      : correct
        ? 1
        : 0;
    return { correct, score, marks };
  },

  retryAnswer(q, given, result) {
    return { selected: q.multiple ? given.selected.filter((id) => result.marks[id] === 'ok') : [] };
  },

  speech(q) {
    const choices = q.choices.map((c) => c.label).join(', ');
    // La case « {?} » est lue comme un silence : le choix reste à faire.
    const prompt = q.prompt?.replace(/\{\?\}/g, '…');
    return mathToSpeech([prompt, choices].filter(Boolean).join('. '));
  },
};
