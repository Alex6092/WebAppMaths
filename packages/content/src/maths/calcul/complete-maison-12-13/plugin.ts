import { defineLevels, definePlugin } from '@app/core';
import { BIG_HOUSES, houseTip, pickPair, type House } from '../../lib/maisons';

// Les sommes égales à 12 et 13 : « 5 + {?} = 12 », « {?} + 7 = 13 », « 13 = 8 + {?} ».

interface Params {
  houses: House[];
  /** Aussi « 13 = 8 + {?} », le résultat écrit en premier. */
  reversed: boolean;
}

interface Data {
  /** L'addition complète, dans l'ordre de l'énoncé. */
  a: number;
  b: number;
  house: House;
  expected: number;
}

export default definePlugin<'number-input', Params, Data>('number-input', {
  id: 'maths.calcul.complete-maison-12-13',
  version: 1,
  title: 'La maison du 12 et du 13',
  description: 'Trouve le nombre qui manque pour faire 12 ou 13.',
  icon: '🏡',
  notions: ['maths.calcul.sommes-12-13'],
  expectedLevel: 3,
  levels: defineLevels<Params>([
    { label: 'La maison du 12', grade: 'CE1', params: { houses: [12], reversed: false } },
    { label: 'La maison du 13', grade: 'CE1', params: { houses: [13], reversed: false } },
    { label: '12 ou 13', grade: 'CE1', params: { houses: [...BIG_HOUSES], reversed: true } },
  ]),

  generate({ rng, params }) {
    const house = rng.pick(params.houses);
    const [a, b] = pickPair(rng, house);
    const missingFirst = rng.chance(0.5);
    const sum = missingFirst ? `{?} + ${b}` : `${a} + {?}`;
    const prompt = params.reversed && rng.chance(0.4) ? `${house} = ${sum}` : `${sum} = ${house}`;
    return {
      widget: 'number-input',
      instruction: `COMPLÈTE pour faire ${house}.`,
      prompt,
      maxLength: 2,
      data: { a, b, house, expected: missingFirst ? a : b },
    };
  },

  solve: (q) => ({ value: String(q.data.expected) }),

  explain: (q) => `${q.data.a} + ${q.data.b} = ${q.data.house}. ${houseTip(q.data.a, q.data.b)}`,

  invariants: (q) =>
    q.data.a + q.data.b === q.data.house && q.data.expected >= 0 ? undefined : 'addition fausse',

  signature: (q) => q.prompt,
});
