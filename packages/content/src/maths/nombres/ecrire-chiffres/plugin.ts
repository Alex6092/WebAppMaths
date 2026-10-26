import { definePlugin } from '@app/core';
import { numberToWords } from '../../../lib/lettres';
import { NUMBER_LEVELS, pickNumber, type NumberRange } from '../../lib/nombres';

interface Data {
  n: number;
}

export default definePlugin<'number-input', { range: NumberRange }, Data>('number-input', {
  id: 'maths.nombres.ecrire-chiffres',
  version: 1,
  title: 'Écrire en chiffres',
  description: 'Lis le nombre écrit en lettres et écris-le en chiffres.',
  icon: '🔢',
  notions: ['maths.nombres.ecrire'],
  expectedLevel: 4,
  levels: NUMBER_LEVELS,

  generate({ rng, params }) {
    const n = pickNumber(rng, params.range);
    const words = numberToWords(n);
    return {
      widget: 'number-input',
      instruction: 'ÉCRIS en chiffres.',
      prompt: `${words} → {?}`,
      maxLength: 4,
      speech: `Écris en chiffres : ${words}.`,
      data: { n },
    };
  },

  solve: (q) => ({ value: String(q.data.n) }),

  explain: (q) => `${numberToWords(q.data.n)} s’écrit ${q.data.n}.`,

  signature: (q) => String(q.data.n),
});
