import { defineLevels, definePlugin, moneyText, moneyTotal } from '@app/core';
import { FIRST_NAMES } from '../../../francais/lib/sujets';
import { retry } from '../../../lib/numbers';
import { largestFirst, MONEY_LEVELS, randomPurse, type MoneyParams } from '../../lib/monnaie';

// « Qui a le plus d'argent ? » : deux ou trois porte-monnaie à comparer. Le piège : beaucoup de
// pièces ne font pas forcément beaucoup d'argent.

interface Data {
  totals: number[];
  most: boolean;
  answer: string;
}

export default definePlugin<'mcq', MoneyParams, Data>('mcq', {
  id: 'maths.mesures.qui-a-le-plus',
  version: 1,
  title: 'Qui a le plus d’argent ?',
  description: 'Compare les porte-monnaie.',
  icon: '👛',
  notions: ['maths.mesures.monnaie'],
  expectedLevel: 3,
  levels: defineLevels<MoneyParams>(MONEY_LEVELS.slice(0, 3)),

  generate({ rng, params }) {
    const names = rng.sample(FIRST_NAMES, params.max === 20 ? 2 : 3);
    const purses = retry(
      () =>
        names.map(() => {
          // Parfois peu de billets, parfois beaucoup de petites pièces.
          const few = rng.chance(0.5);
          return largestFirst(randomPurse(rng, params, few ? rng.int(2, 3) : rng.int(4, 6)));
        }),
      (list) => new Set(list.map(moneyTotal)).size === list.length,
    );
    const totals = purses.map(moneyTotal);
    const most = rng.chance(0.7);
    const target = most ? Math.max(...totals) : Math.min(...totals);
    return {
      widget: 'mcq',
      instruction: most
        ? 'COCHE l’enfant qui a le plus d’argent.'
        : 'COCHE l’enfant qui a le moins d’argent.',
      choices: names.map((name, i) => ({
        id: name,
        label: name,
        picture: { kind: 'money' as const, values: purses[i]! },
      })),
      multiple: false,
      layout: 'list',
      data: { totals, most, answer: names[totals.indexOf(target)]! },
    };
  },

  solve: (q) => ({ selected: [q.data.answer] }),

  explain(q) {
    const counted = q.choices
      .map((c, i) => `${c.label} a ${moneyText(q.data.totals[i]!)}`)
      .join(', ');
    return `${counted}. C’est ${q.data.answer} qui en a le ${q.data.most ? 'plus' : 'moins'}.`;
  },

  signature: (q) => q.data.totals.join('|') + q.data.most,
});
