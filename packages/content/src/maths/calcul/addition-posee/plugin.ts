import { columnSolution, countCarries, defineLevels, definePlugin } from '@app/core';
import { explainColumn } from '../../../lib/column-explain';
import { digitCount, randomWithDigits, retry } from '../../../lib/numbers';

type CarryRule = 'any' | 'none' | 'some' | 'one' | 'two';

interface Params {
  /** Nombre de chiffres de chaque nombre à additionner. */
  sizes: number[];
  maxSum: number;
  carries: CarryRule;
}

function carriesFit(rule: CarryRule, count: number): boolean {
  switch (rule) {
    case 'any':
      return true;
    case 'none':
      return count === 0;
    case 'some':
      return count >= 1;
    case 'one':
      return count === 1;
    case 'two':
      return count === 2;
  }
}

export default definePlugin('column-op', {
  id: 'maths.calcul.addition-posee',
  version: 1,
  title: 'Additions posées',
  description: 'Calcule l’addition en colonnes, sans oublier les retenues.',
  icon: '➕',
  notions: ['maths.calcul.poser-addition'],
  expectedLevel: 6,
  levels: defineLevels<Params>([
    { label: '1 chiffre', grade: 'CP', params: { sizes: [1, 1], maxSum: 18, carries: 'any' } },
    {
      label: '2 chiffres sans retenue',
      grade: 'CP',
      params: { sizes: [2, 2], maxSum: 99, carries: 'none' },
    },
    {
      label: '2 chiffres avec retenue',
      grade: 'CP',
      params: { sizes: [2, 2], maxSum: 99, carries: 'some' },
    },
    {
      label: '3 chiffres sans retenue',
      grade: 'CP',
      params: { sizes: [3, 3], maxSum: 999, carries: 'none' },
    },
    {
      label: '3 chiffres avec une retenue',
      grade: 'CP',
      params: { sizes: [3, 3], maxSum: 999, carries: 'one' },
    },
    {
      label: '3 chiffres avec deux retenues',
      grade: 'CE1',
      params: { sizes: [3, 3], maxSum: 999, carries: 'two' },
    },
    {
      label: 'Trois nombres',
      grade: 'CE1',
      params: { sizes: [3, 2, 2], maxSum: 999, carries: 'some' },
    },
  ]),

  generate({ rng, params }) {
    return retry(
      () => ({
        widget: 'column-op' as const,
        instruction:
          params.sizes.length > 2 ? 'CALCULE l’addition des trois nombres.' : 'CALCULE l’addition.',
        op: '+' as const,
        operands: params.sizes.map((digits) => randomWithDigits(rng, digits)),
        showCarries: params.sizes.some((d) => d > 1),
        data: {},
      }),
      (q) =>
        q.operands.reduce((s, n) => s + n, 0) <= params.maxSum &&
        carriesFit(params.carries, countCarries(q)),
    );
  },

  solve: columnSolution,

  explain: explainColumn,

  invariants(q, { params }) {
    if (q.operands.some((n, i) => digitCount(n) !== params.sizes[i]))
      return 'mauvais nombre de chiffres';
    if (q.operands.reduce((s, n) => s + n, 0) > params.maxSum) return 'somme trop grande';
    if (!carriesFit(params.carries, countCarries(q))) return `retenues ≠ ${params.carries}`;
    return undefined;
  },

  signature: (q) => q.operands.join('+'),
});
