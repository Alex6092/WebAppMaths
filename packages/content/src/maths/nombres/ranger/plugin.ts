import { defineLevels, definePlugin, type Rng } from '@app/core';
import { digitAt, retry } from '../../../lib/numbers';

// « RANGE du plus petit au plus grand : … < … < … < … »

interface Params {
  count: number;
  min: number;
  max: number;
  /** Des nombres proches : même centaine, chiffres inversés. */
  close: boolean;
  descending: boolean;
}

interface Data {
  sorted: number[];
}

function closeNumbers(rng: Rng, count: number): number[] {
  const base = rng.int(102, 897);
  const h = digitAt(base, 2);
  const swap = (x: number) => h * 100 + digitAt(x, 0) * 10 + digitAt(x, 1);
  const pool = [base, swap(base), base + 1, base - 1, base + 10, base - 10, base + 100, base - 90]
    .concat(Array.from({ length: 6 }, () => h * 100 + rng.int(0, 99)))
    .filter((x) => x >= 100 && x <= 999);
  return rng.sample([...new Set(pool)], count);
}

export default definePlugin<'fill-blank', Params, Data>('fill-blank', {
  id: 'maths.nombres.ranger',
  version: 1,
  title: 'Ranger des nombres',
  description: 'Range les nombres du plus petit au plus grand, ou l’inverse.',
  icon: '📊',
  notions: ['maths.nombres.ranger'],
  expectedLevel: 4,
  levels: defineLevels<Params>([
    {
      label: '4 nombres jusqu’à 100',
      grade: 'CP',
      params: { count: 4, min: 1, max: 100, close: false, descending: false },
    },
    {
      label: '4 nombres jusqu’à 999',
      grade: 'CE1',
      params: { count: 4, min: 100, max: 999, close: false, descending: false },
    },
    {
      label: '5 nombres proches',
      grade: 'CE1',
      params: { count: 5, min: 100, max: 999, close: true, descending: false },
    },
    {
      label: 'Du plus grand au plus petit',
      grade: 'CE1',
      params: { count: 5, min: 100, max: 999, close: true, descending: true },
    },
  ]),

  generate({ rng, params }) {
    const numbers = params.close
      ? closeNumbers(rng, params.count)
      : retry(
          () => Array.from({ length: params.count }, () => rng.int(params.min, params.max)),
          (list) => new Set(list).size === list.length,
        );
    const sorted = [...numbers].sort((a, b) => (params.descending ? b - a : a - b));
    const sign = params.descending ? ' > ' : ' < ';
    const options = rng.shuffle(numbers).map(String);
    return {
      widget: 'fill-blank',
      instruction: params.descending
        ? 'RANGE du plus grand au plus petit.'
        : 'RANGE du plus petit au plus grand.',
      prompt: sorted.map((_, i) => `{${i}}`).join(sign),
      blanks: sorted.map(() => ({ kind: 'choice' as const, options })),
      data: { sorted },
    };
  },

  solve: (q) => ({ values: q.data.sorted.map(String) }),

  explain: (q) =>
    `Je compare les centaines, puis les dizaines, puis les unités : ${q.data.sorted.join(
      q.prompt.includes('>') ? ' > ' : ' < ',
    )}.`,

  signature: (q) => q.data.sorted.join(','),
});
