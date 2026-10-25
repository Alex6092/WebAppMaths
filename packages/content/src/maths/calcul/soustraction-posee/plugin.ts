import { columnSolution, countCarries, defineLevels, definePlugin } from '@app/core';
import { explainColumn } from '../../../lib/column-explain';
import { digitAt, digitCount, randomWithDigits, retry } from '../../../lib/numbers';

interface Params {
  digits: number;
  /** Nombre de colonnes avec retenue : un nombre exact, ou 'some' pour au moins une. */
  borrows: number | 'some';
  /** Le premier nombre a un zéro aux dizaines (402 − 157). */
  zeroTens?: boolean;
}

function borrowsFit(rule: Params['borrows'], count: number): boolean {
  return rule === 'some' ? count >= 1 : count === rule;
}

export default definePlugin('column-op', {
  id: 'maths.calcul.soustraction-posee',
  version: 1,
  title: 'Soustractions posées',
  description: 'Calcule la soustraction en colonnes, avec la méthode des retenues.',
  icon: '➖',
  notions: ['maths.calcul.poser-soustraction'],
  expectedLevel: 6,
  levels: defineLevels<Params>([
    { label: '1 chiffre', grade: 'CP', params: { digits: 1, borrows: 0 } },
    { label: '2 chiffres sans retenue', grade: 'CP', params: { digits: 2, borrows: 0 } },
    { label: '2 chiffres avec retenue', grade: 'CP', params: { digits: 2, borrows: 'some' } },
    { label: '3 chiffres sans retenue', grade: 'CP', params: { digits: 3, borrows: 0 } },
    { label: '3 chiffres avec une retenue', grade: 'CP', params: { digits: 3, borrows: 1 } },
    { label: '3 chiffres avec deux retenues', grade: 'CE1', params: { digits: 3, borrows: 2 } },
    {
      label: 'Avec un zéro (402 − 157)',
      grade: 'CE1',
      params: { digits: 3, borrows: 2, zeroTens: true },
    },
  ]),

  generate({ rng, params }) {
    const top = () =>
      params.zeroTens ? rng.int(2, 9) * 100 + rng.int(0, 9) : randomWithDigits(rng, params.digits);
    return retry(
      () => ({
        widget: 'column-op' as const,
        instruction: 'CALCULE la soustraction.',
        op: '-' as const,
        operands: [top(), randomWithDigits(rng, params.digits)],
        showCarries: params.digits > 1,
        data: {},
      }),
      (q) => q.operands[0]! > q.operands[1]! && borrowsFit(params.borrows, countCarries(q)),
    );
  },

  solve: columnSolution,

  explain: explainColumn,

  invariants(q, { params }) {
    const [a = 0, b = 0] = q.operands;
    if (q.operands.length !== 2) return 'il faut deux nombres';
    if (digitCount(a) !== params.digits || digitCount(b) !== params.digits)
      return 'mauvais nombre de chiffres';
    if (a <= b) return 'résultat négatif ou nul';
    if (!borrowsFit(params.borrows, countCarries(q))) return `retenues ≠ ${params.borrows}`;
    if (params.zeroTens && digitAt(a, 1) !== 0) return 'pas de zéro aux dizaines';
    return undefined;
  },

  signature: (q) => q.operands.join('-'),
});
