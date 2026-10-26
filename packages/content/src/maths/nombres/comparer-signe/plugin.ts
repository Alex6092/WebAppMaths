import { defineLevels, definePlugin, type Rng } from '@app/core';
import { digitAt, digitCount, PLACE_NAMES, retry } from '../../../lib/numbers';

interface Params {
  min: number;
  max: number;
  /** Nombres proches : mêmes centaines, chiffres inversés ou un seul chiffre différent. */
  close?: boolean;
}

const SIGN = { lt: '<', eq: '=', gt: '>' } as const;

function signOf(a: number, b: number): keyof typeof SIGN {
  return a < b ? 'lt' : a > b ? 'gt' : 'eq';
}

function closeTo(rng: Rng, a: number): number {
  const tens = digitAt(a, 1);
  const units = digitAt(a, 0);
  const hundreds = a - (a % 100);
  if (tens !== units && rng.chance(0.5)) return hundreds + units * 10 + tens;
  return rng.chance(0.5)
    ? hundreds + rng.int(0, 9) * 10 + units
    : hundreds + tens * 10 + rng.int(0, 9);
}

export default definePlugin('mcq', {
  id: 'maths.nombres.comparer-signe',
  version: 1,
  title: 'Comparer avec <, > ou =',
  description: 'Choisis le bon signe entre deux nombres.',
  icon: '⚖️',
  notions: ['maths.nombres.comparer'],
  expectedLevel: 4,
  levels: defineLevels<Params>([
    { label: 'Jusqu’à 20', grade: 'CP', params: { min: 0, max: 20 } },
    { label: 'Jusqu’à 100', grade: 'CP', params: { min: 10, max: 99 } },
    { label: 'Jusqu’à 1000', grade: 'CE1', params: { min: 100, max: 999 } },
    { label: 'Nombres très proches', grade: 'CE1', params: { min: 100, max: 999, close: true } },
  ]),

  generate({ rng, params }) {
    const a = rng.int(params.min, params.max);
    const b = rng.chance(0.15)
      ? a
      : retry(
          () => (params.close ? closeTo(rng, a) : rng.int(params.min, params.max)),
          (x) => x !== a && x >= params.min && x <= params.max,
        );
    return {
      widget: 'mcq',
      instruction: 'COMPLÈTE avec <, > ou =.',
      prompt: `${a} {?} ${b}`,
      choices: (['lt', 'eq', 'gt'] as const).map((id) => ({ id, label: SIGN[id] })),
      multiple: false,
      layout: 'row',
      speech: `Compare ${a} et ${b}. Choisis : plus petit que, égal, ou plus grand que.`,
      data: { a, b },
    };
  },

  solve: (q) => ({ selected: [signOf(q.data.a, q.data.b)] }),

  explain(q) {
    const { a, b } = q.data;
    const sign = SIGN[signOf(a, b)];
    if (a === b) return `Les deux nombres sont pareils : ${a} = ${b}.`;
    if (digitCount(a) !== digitCount(b)) {
      const [more, less] = digitCount(a) > digitCount(b) ? [a, b] : [b, a];
      return `${more} a plus de chiffres que ${less}, il est plus grand : ${a} ${sign} ${b}.`;
    }
    let place = digitCount(a) - 1;
    while (place > 0 && digitAt(a, place) === digitAt(b, place)) place--;
    const da = digitAt(a, place);
    const db = digitAt(b, place);
    return `Je compare les ${PLACE_NAMES[place]} : ${da} ${SIGN[signOf(da, db)]} ${db}, donc ${a} ${sign} ${b}.`;
  },

  invariants(q, { params }) {
    const { a, b } = q.data;
    return [a, b].every((n) => n >= params.min && n <= params.max)
      ? undefined
      : 'nombre hors limites';
  },

  signature: (q) => `${q.data.a}?${q.data.b}`,
});
