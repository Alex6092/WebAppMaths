import { defineLevels, definePlugin } from '@app/core';
import { houseTip, pickPair, type House } from '../../lib/maisons';

// Les sommes égales à 10 et 11 : « 3 + {?} = 10 », « {?} + 5 = 11 », « 11 = 4 + {?} ».

interface Params {
  houses: House[];
  /** La boîte de 10 dessinée : les points rouges, et les bleus à compter. */
  dots: boolean;
  /** Aussi « 11 = 4 + {?} », le résultat écrit en premier. */
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
  id: 'maths.calcul.complete-maison',
  version: 1,
  title: 'La maison du 10 et du 11',
  description: 'Trouve le nombre qui manque pour faire 10 ou 11.',
  icon: '🏠',
  notions: ['maths.calcul.sommes-10-11'],
  expectedLevel: 4,
  levels: defineLevels<Params>([
    {
      label: 'La maison du 10, avec des points',
      grade: 'CP',
      params: { houses: [10], dots: true, reversed: false },
    },
    {
      label: 'La maison du 10',
      grade: 'CP',
      params: { houses: [10], dots: false, reversed: false },
    },
    {
      label: 'La maison du 11',
      grade: 'CE1',
      params: { houses: [11], dots: false, reversed: false },
    },
    { label: '10 ou 11', grade: 'CE1', params: { houses: [10, 11], dots: false, reversed: true } },
  ]),

  generate({ rng, params }) {
    const house = rng.pick(params.houses);
    // Avec les points, pas de 0 + 10 : il faut des points des deux couleurs.
    let [a, b] = pickPair(rng, house);
    while (params.dots && (a === 0 || b === 0)) [a, b] = pickPair(rng, house);
    const missingFirst = rng.chance(0.5);
    const shown = missingFirst ? b : a;
    const sum = missingFirst ? `{?} + ${b}` : `${a} + {?}`;
    const prompt = params.reversed && rng.chance(0.4) ? `${house} = ${sum}` : `${sum} = ${house}`;
    return {
      widget: 'number-input',
      instruction: `COMPLÈTE pour faire ${house}.`,
      prompt,
      maxLength: 2,
      ...(params.dots
        ? {
            picture: {
              kind: 'icons' as const,
              icons: Array.from({ length: house }, (_, i) => (i < shown ? '🔴' : '🔵')),
            },
          }
        : {}),
      data: { a, b, house, expected: missingFirst ? a : b },
    };
  },

  solve: (q) => ({ value: String(q.data.expected) }),

  explain: (q) => `${q.data.a} + ${q.data.b} = ${q.data.house}. ${houseTip(q.data.a, q.data.b)}`,

  invariants: (q) =>
    q.data.a + q.data.b === q.data.house && q.data.expected >= 0 ? undefined : 'addition fausse',

  signature: (q) => q.prompt,
});
