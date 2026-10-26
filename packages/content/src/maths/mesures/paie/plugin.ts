import { defineLevels, definePlugin, moneyText } from '@app/core';
import {
  itemFor,
  MONEY_LEVELS,
  payment,
  priceSentence,
  purseFor,
  randomPrice,
  type MoneyParams,
} from '../../lib/monnaie';

// « ENTOURE l'argent pour payer » : un prix, des pièces et des billets étalés, dont certains en trop.

interface Data {
  price: number;
  /** Une façon de payer : les numéros des pièces et des billets dans le porte-monnaie. */
  pay: number[];
}

export default definePlugin<'money', MoneyParams, Data>('money', {
  id: 'maths.mesures.paie',
  version: 1,
  title: 'Payer le prix juste',
  description: 'Entoure les pièces et les billets pour payer.',
  icon: '🛍️',
  notions: ['maths.mesures.payer'],
  expectedLevel: 3,
  levels: defineLevels<MoneyParams>([...MONEY_LEVELS]),

  generate({ rng, params }) {
    const price = randomPrice(rng, params);
    const item = itemFor(rng, price);
    const { purse, picked } = purseFor(rng, price, params, payment(rng, price, params.values));
    return {
      widget: 'money',
      instruction: 'ENTOURE l’argent qu’il faut pour payer le prix juste.',
      prompt: priceSentence(item, price),
      speech: priceSentence(item, price, true),
      icon: item.icon,
      purse,
      data: { price, pay: picked },
    };
  },

  solve: (q) => ({ picked: [...q.data.pay] }),

  explain(q) {
    const pay = q.data.pay.map((i) => q.purse[i]!);
    const euros = pay.every((v) => v % 100 === 0);
    const sum = pay.map((v) => (euros ? v / 100 : moneyText(v))).join(' + ');
    return `Par exemple : ${sum} = ${moneyText(q.data.price)}.`;
  },

  signature: (q) => `${q.data.price}:${q.purse.join('+')}`,
});
