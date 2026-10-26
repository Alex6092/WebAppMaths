import {
  compareMoney,
  defineLevels,
  definePlugin,
  fewestCoins,
  moneyText,
  pickedTotal,
} from '@app/core';
import {
  itemFor,
  MONEY_LEVELS,
  priceSentence,
  purseFor,
  randomPrice,
  type MoneyParams,
} from '../../lib/monnaie';

// « Paie avec le moins de pièces et de billets possible » : le porte-monnaie permet de payer de
// plusieurs façons (un billet de 10 € ou deux de 5 €) ; la plus courte est la bonne.

interface Data {
  price: number;
  pay: number[];
}

export default definePlugin<'money', MoneyParams, Data>('money', {
  id: 'maths.mesures.moins-de-pieces',
  version: 1,
  title: 'Le moins de pièces possible',
  description: 'Paie avec le moins de pièces et de billets possible.',
  icon: '🪙',
  notions: ['maths.mesures.payer'],
  expectedLevel: 3,
  levels: defineLevels<MoneyParams>(MONEY_LEVELS.slice(0, 3)),

  generate({ rng, params }) {
    const price = randomPrice(rng, params);
    const item = itemFor(rng, price);
    const best = fewestCoins(price, params.values);
    // De la monnaie qui remplace un ou deux des billets ou des pièces de la meilleure façon.
    const big = best.filter((v) => v > Math.min(...params.values));
    const replaced = rng.sample(big, Math.min(big.length, rng.int(1, 2)));
    const change = replaced.flatMap((v) =>
      fewestCoins(
        v,
        params.values.filter((w) => w < v),
      ),
    );
    const { purse, picked } = purseFor(rng, price, params, best, change);
    return {
      widget: 'money',
      instruction: 'ENTOURE le moins possible de pièces et de billets pour payer le prix juste.',
      prompt: priceSentence(item, price),
      speech: priceSentence(item, price, true),
      icon: item.icon,
      purse,
      data: { price, pay: picked },
    };
  },

  solve: (q) => ({ picked: [...q.data.pay] }),

  // La bonne somme ne suffit pas : il faut aussi le moins de pièces et de billets.
  check(q, answer) {
    const result = compareMoney(q, q.data.price, answer);
    if (!result.correct || answer.picked.length <= q.data.pay.length) return result;
    return {
      correct: false,
      score: 0.5,
      marks: { total: 'near' },
      feedback: 'C’est la bonne somme, mais tu peux payer avec moins de pièces et de billets. 💪',
    };
  },

  explain(q, answer) {
    const best = q.data.pay.map((i) => q.purse[i]!);
    const bills = best.filter((v) => v >= 500).length;
    const what =
      best.length === 1
        ? bills
          ? 'un seul billet'
          : 'une seule pièce'
        : bills === 0
          ? `${best.length} pièces`
          : bills === best.length
            ? `${best.length} billets`
            : `${best.length} billets et pièces`;
    const right = pickedTotal(q, answer) === q.data.price;
    const sum = best.map((v) => v / 100).join(' + ');
    return `${right ? 'La somme est juste, mais on' : 'On'} peut payer avec ${what} : ${sum} = ${moneyText(q.data.price)}.`;
  },

  signature: (q) => `${q.data.price}:${q.purse.join('+')}`,
});
