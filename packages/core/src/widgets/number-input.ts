import type { NumberInputAnswer } from '../question';
import { mathToSpeech } from '../speech';
import type { WidgetDef } from './types';

/**
 * Les espaces sont ignorés (\s couvre aussi les espaces insécables) :
 * « 0 12 » → « 12 », « 1 000 » → « 1000 », « 3,5 » → « 3.5 ».
 */
export function normalizeNumber(raw: string): string {
  const compact = raw.replace(/\s/g, '').replace(',', '.');
  return compact.replace(/^(-?)0+(?=\d)/, '$1');
}

export const numberInputWidget: WidgetDef<'number-input'> = {
  id: 'number-input',

  emptyAnswer: () => ({ value: '' }),

  validate: (_q, answer): answer is NumberInputAnswer =>
    typeof answer === 'object' &&
    answer !== null &&
    typeof (answer as NumberInputAnswer).value === 'string' &&
    (answer as NumberInputAnswer).value.length <= 32,

  isComplete: (_q, answer) => normalizeNumber(answer.value) !== '',

  compare(_q, expected, given) {
    const value = normalizeNumber(given.value);
    const correct = value !== '' && value === normalizeNumber(expected.value);
    return {
      correct,
      score: correct ? 1 : 0,
      marks: { value: value === '' ? 'missing' : correct ? 'ok' : 'wrong' },
    };
  },

  retryAnswer: () => ({ value: '' }),

  speech: (q) => mathToSpeech(q.prompt),
};
