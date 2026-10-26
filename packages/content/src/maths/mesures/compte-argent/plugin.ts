import { compareBlanks, defineLevels, definePlugin, moneyText, moneyTotal } from '@app/core';
import { largestFirst, MONEY_LEVELS, randomPurse, type MoneyParams } from '../../lib/monnaie';

// « Combien d'argent y a-t-il ? » : des pièces et des billets, la somme à écrire.

interface Data {
  values: number[];
}

/** « 10 + 5 + 2 », les billets d'abord. */
const sum = (values: readonly number[], unit: number) =>
  largestFirst(values)
    .map((v) => v / unit)
    .join(' + ');

/** Ce qu'il faut écrire : les euros, puis les centimes quand ils ont leur case. */
function written(values: readonly number[], cents: boolean): string[] {
  const total = moneyTotal(values);
  return cents ? [String(Math.floor(total / 100)), String(total % 100)] : [String(total / 100)];
}

export default definePlugin<'fill-blank', MoneyParams, Data>('fill-blank', {
  id: 'maths.mesures.compte-argent',
  version: 1,
  title: 'Combien d’argent ?',
  description: 'Compte les pièces et les billets.',
  icon: '💶',
  notions: ['maths.mesures.monnaie'],
  expectedLevel: 3,
  levels: defineLevels<MoneyParams>([...MONEY_LEVELS]),

  generate({ rng, params, level }) {
    const count = params.cents ? rng.int(4, 7) : rng.int(3, params.max === 20 ? 5 : 7);
    const purse = randomPurse(rng, params, count);
    // Au premier niveau, les billets et les pièces sont rangés du plus grand au plus petit.
    const values = level === 1 ? largestFirst(purse) : rng.shuffle(purse);
    return {
      widget: 'fill-blank',
      instruction: 'COMPTE l’argent.',
      prompt: params.cents ? 'Il y a {0} € et {1} c.' : 'Il y a {0} €.',
      blanks: (params.cents ? [0, 1] : [0]).map(() => ({
        kind: 'text' as const,
        size: 3,
        digits: true,
      })),
      picture: { kind: 'money', values },
      data: { values },
    };
  },

  solve: (q) => ({ values: written(q.data.values, q.blanks.length > 1) }),

  // « 05 » centimes vaut « 5 ».
  check(q, answer) {
    const values = answer.values.map((v) => v.replace(/^0+(?=\d)/, ''));
    const accepted = written(q.data.values, q.blanks.length > 1).map((v) => [v]);
    return compareBlanks(q, accepted, { values });
  },

  explain(q) {
    const euros = q.data.values.filter((v) => v >= 100);
    const cents = q.data.values.filter((v) => v < 100);
    const total = moneyTotal(q.data.values);
    if (cents.length === 0)
      return `${sum(euros, 100)} = ${total / 100} : il y a ${moneyText(total)}.`;
    return `Les euros : ${sum(euros, 100)} = ${moneyTotal(euros) / 100} €. Les centimes : ${sum(cents, 1)} = ${moneyTotal(cents)} c. Il y a ${moneyText(total)}.`;
  },

  signature: (q) => largestFirst(q.data.values).join('+'),
});
