import type { CheckResult, FillBlankAnswer, FillBlankQuestion, Mark } from '../question';
import { matchText, normalizeText } from '../text';
import type { WidgetDef } from './types';

export const ACCENT_HINT = 'Presque ! Attention aux accents. ✏️';

/** Découpe l'énoncé en morceaux de texte et en trous (numéro du trou). */
export function blankParts(prompt: string): (string | number)[] {
  return prompt
    .split(/\{(\d+)\}/)
    .map((part, i) => (i % 2 === 1 ? Number(part) : part))
    .filter((part) => part !== '');
}

/**
 * Corrige trou par trou ; `accepted[i]` liste les réponses admises pour le trou i
 * (plusieurs indicateurs de temps possibles, deux orthographes…).
 */
export function compareBlanks(
  q: FillBlankQuestion,
  accepted: readonly (readonly string[])[],
  given: FillBlankAnswer,
): CheckResult {
  const marks: Record<string, Mark> = {};
  let hits = 0;
  let accents = 0;
  q.blanks.forEach((_blank, i) => {
    const match = matchText(accepted[i] ?? [], given.values[i] ?? '', q.caseSensitive);
    if (match === 'ok') hits++;
    if (match === 'accent') accents++;
    marks[i] = match === 'accent' ? 'near' : match;
  });
  const correct = hits === q.blanks.length;
  return {
    correct,
    score: hits / Math.max(1, q.blanks.length),
    marks,
    feedback: !correct && accents > 0 ? ACCENT_HINT : undefined,
  };
}

export const fillBlankWidget: WidgetDef<'fill-blank'> = {
  id: 'fill-blank',

  emptyAnswer: (q) => ({ values: q.blanks.map(() => '') }),

  validate(q, answer): answer is FillBlankAnswer {
    if (typeof answer !== 'object' || answer === null) return false;
    const { values } = answer as Partial<FillBlankAnswer>;
    if (!Array.isArray(values) || values.length !== q.blanks.length) return false;
    return values.every((v, i) => {
      const blank = q.blanks[i]!;
      if (typeof v !== 'string' || v.length > 60) return false;
      return blank.kind === 'text' || v === '' || blank.options.includes(v);
    });
  },

  isComplete: (_q, answer) => answer.values.every((v) => normalizeText(v) !== ''),

  compare: (q, expected, given) =>
    compareBlanks(
      q,
      expected.values.map((v) => [v]),
      given,
    ),

  // On garde ce qui est juste, et les mots à un accent près (il suffit de corriger l'accent).
  retryAnswer: (_q, given, result) => ({
    values: given.values.map((v, i) =>
      result.marks[i] === 'ok' || result.marks[i] === 'near' ? v : '',
    ),
  }),

  speech(q) {
    const text = blankParts(q.prompt)
      .map((part) => (typeof part === 'number' ? ' … ' : part))
      .join('')
      .replace(/\s+/g, ' ')
      .trim();
    const choices = q.blanks
      .filter((b) => b.kind === 'choice')
      .map((b) => (b.kind === 'choice' ? b.options.join(', ') : ''));
    return choices.length === 1 ? `${text} Choisis : ${choices[0]}.` : text;
  },
};
