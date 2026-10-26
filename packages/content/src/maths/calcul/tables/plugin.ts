import { defineLevels, definePlugin } from '@app/core';

// Les premières tables de multiplication du CE1 : 2, 3, 4, 5 et 10.

interface Params {
  tables: number[];
}

interface Data {
  a: number;
  b: number;
}

export default definePlugin<'number-input', Params, Data>('number-input', {
  id: 'maths.calcul.tables',
  version: 1,
  title: 'Tables de multiplication',
  description: 'Apprends les tables de 2, 3, 4, 5 et 10.',
  icon: '✖️',
  notions: ['maths.calcul.tables'],
  expectedLevel: 5,
  levels: defineLevels<Params>([
    { label: 'Table de 2', grade: 'CE1', params: { tables: [2] } },
    { label: 'Tables de 5 et de 10', grade: 'CE1', params: { tables: [5, 10] } },
    { label: 'Table de 3', grade: 'CE1', params: { tables: [3] } },
    { label: 'Table de 4', grade: 'CE1', params: { tables: [4] } },
    { label: 'Toutes mélangées', grade: 'CE1', params: { tables: [2, 3, 4, 5, 10] } },
  ]),

  generate({ rng, params }) {
    const table = rng.pick(params.tables);
    const other = rng.int(1, 10);
    // 3 × 4 ou 4 × 3 : les deux sens, pour retenir que l'ordre ne change rien.
    const [a, b] = rng.chance(0.5) ? [table, other] : [other, table];
    return {
      widget: 'number-input',
      instruction: 'CALCULE.',
      prompt: `${a} × ${b} = {?}`,
      maxLength: 3,
      data: { a, b },
    };
  },

  solve: (q) => ({ value: String(q.data.a * q.data.b) }),

  explain(q) {
    const { a, b } = q.data;
    if (a === 10 || b === 10) return `Fois 10, j’ajoute un zéro : ${a} × ${b} = ${a * b}.`;
    const [times, n] = a <= b ? [a, b] : [b, a];
    return `${a} × ${b}, c’est ${Array.from({ length: times }, () => n).join(' + ')} = ${a * b}.`;
  },

  signature: (q) => `${q.data.a}x${q.data.b}`,
});
