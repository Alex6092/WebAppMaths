import { compareBlanks, definePlugin } from '@app/core';
import { numberToWords, withoutHyphens, withoutPlural } from '../../../lib/lettres';
import { NUMBER_LEVELS, pickNumber, type NumberRange } from '../../lib/nombres';

interface Data {
  n: number;
}

export default definePlugin<'fill-blank', { range: NumberRange }, Data>('fill-blank', {
  id: 'maths.nombres.ecrire-lettres',
  version: 1,
  title: 'Écrire en lettres',
  description: 'Écris le nombre en lettres, sans oublier les traits d’union.',
  icon: '✍️',
  notions: ['maths.nombres.ecrire'],
  expectedLevel: 4,
  levels: NUMBER_LEVELS,

  generate({ rng, params }) {
    const n = pickNumber(rng, params.range);
    return {
      widget: 'fill-blank',
      instruction: 'ÉCRIS en lettres.',
      prompt: `${n} → {0}`,
      blanks: [{ kind: 'text', size: 24 }],
      speech: `Écris ${n} en lettres.`,
      data: { n },
    };
  },

  solve: (q) => ({ values: [numberToWords(q.data.n)] }),

  // Faux, mais avec un indice quand seuls les traits d'union ou le s de cent/vingt manquent :
  // l'enfant garde ce qu'il a écrit pour corriger.
  check(q, answer) {
    const expected = numberToWords(q.data.n);
    const result = compareBlanks(q, [[expected]], answer);
    if (result.marks[0] !== 'wrong') return result;
    const given = answer.values[0] ?? '';
    const near = (feedback: string) => ({ ...result, marks: { 0: 'near' as const }, feedback });
    if (withoutHyphens(given) === withoutHyphens(expected))
      return near('Presque ! Attention aux traits d’union.');
    if (withoutPlural(given) === withoutPlural(expected))
      return near('Presque ! Attention au s de cent ou de vingt.');
    return result;
  },

  explain: (q) => `${q.data.n} s’écrit « ${numberToWords(q.data.n)} ».`,

  signature: (q) => String(q.data.n),
});
