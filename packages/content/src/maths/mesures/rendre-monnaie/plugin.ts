import { defineLevels, definePlugin } from '@app/core';
import { itemFor, priceSentence } from '../../lib/monnaie';

// « On me rend combien ? » : je paie avec un billet, on me rend la différence.

interface Params {
  /** Le billet donné, en euros. */
  bill: number;
  /** Prix le plus bas, en euros. */
  min: number;
}

interface Data {
  price: number;
  bill: number;
}

export default definePlugin<'number-input', Params, Data>('number-input', {
  id: 'maths.mesures.rendre-monnaie',
  version: 1,
  title: 'Rendre la monnaie',
  description: 'Je donne un billet : combien me rend-on ?',
  icon: '💱',
  notions: ['maths.mesures.payer'],
  expectedLevel: 2,
  // Avec 10 €, il n'y a que 9 prix possibles.
  minVariety: 9,
  levels: defineLevels<Params>([
    { label: 'Avec un billet de 10 €', grade: 'CE1', params: { bill: 10, min: 1 } },
    { label: 'Avec un billet de 20 €', grade: 'CE1', params: { bill: 20, min: 6 } },
    { label: 'Avec un billet de 50 €', grade: 'CE1', params: { bill: 50, min: 15 } },
  ]),

  generate({ rng, params }) {
    const price = rng.int(params.min, params.bill - 1);
    const item = itemFor(rng, price * 100);
    return {
      widget: 'number-input',
      instruction: `${item.icon} ${priceSentence(item, price * 100)} Je donne un billet de ${params.bill} €.`,
      prompt: 'On me rend {?} €.',
      picture: { kind: 'money', values: [params.bill * 100] },
      maxLength: 2,
      data: { price, bill: params.bill },
    };
  },

  solve: (q) => ({ value: String(q.data.bill - q.data.price) }),

  explain(q) {
    const { price, bill } = q.data;
    return `${bill} − ${price} = ${bill - price} : on me rend ${bill - price} €. Je vérifie : ${price} + ${bill - price} = ${bill}.`;
  },

  signature: (q) => `${q.data.bill}-${q.data.price}`,
});
