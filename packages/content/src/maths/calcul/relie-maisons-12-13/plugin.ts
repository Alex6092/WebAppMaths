import { defineLevels, definePlugin } from '@app/core';
import { BIG_HOUSES, houseTip, type House } from '../../lib/maisons';

// Les sommes égales à 12 et 13 : RELIE chaque nombre à celui qui fait 12 (ou 13) avec lui.

interface Params {
  houses: House[];
  count: number;
}

interface Data {
  house: House;
  links: number[];
  left: number[];
}

export default definePlugin<'match', Params, Data>('match', {
  id: 'maths.calcul.relie-maisons-12-13',
  version: 1,
  title: 'Relie les nombres qui font 12 ou 13',
  description: '5 va avec 7 pour faire 12, et avec 8 pour faire 13.',
  icon: '🔗',
  notions: ['maths.calcul.sommes-12-13'],
  expectedLevel: 3,
  levels: defineLevels<Params>([
    { label: 'Pour faire 12', grade: 'CE1', params: { houses: [12], count: 4 } },
    { label: 'Pour faire 13', grade: 'CE1', params: { houses: [13], count: 4 } },
    { label: '12 ou 13, six paires', grade: 'CE1', params: { houses: [...BIG_HOUSES], count: 6 } },
  ]),

  generate({ rng, params }) {
    const house = rng.pick(params.houses);
    const left = rng.sample(
      Array.from({ length: house + 1 }, (_, n) => n),
      params.count,
    );
    const right = rng.shuffle(left.map((_, i) => i));
    return {
      widget: 'match',
      instruction: `RELIE les deux nombres qui font ${house} ensemble.`,
      columns: [
        { cards: left.map((n) => ({ text: `${n} +` })) },
        { cards: right.map((i) => ({ text: String(house - left[i]!) })) },
      ],
      data: { house, links: left.map((_, i) => right.indexOf(i)), left },
    };
  },

  solve: (q) => ({ links: [[...q.data.links]] }),

  explain(q, answer) {
    const { house, left, links } = q.data;
    // L'explication porte sur le premier trait faux.
    const i = Math.max(
      0,
      links.findIndex((l, k) => answer.links[0]?.[k] !== l),
    );
    const a = left[i]!;
    return `${a} + ${house - a} = ${house}. ${houseTip(a, house - a)}`;
  },

  invariants: (q) =>
    q.data.left.every(
      (a, i) => Number(q.columns[1]!.cards[q.data.links[i]!]!.text) + a === q.data.house,
    )
      ? undefined
      : 'paire fausse',

  signature: (q) => `${q.data.house}:${q.data.left.join(',')}`,
});
