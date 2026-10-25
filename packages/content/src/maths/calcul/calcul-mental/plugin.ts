import { defineLevels, definePlugin, type Rng } from '@app/core';
import { digitAt, retry } from '../../../lib/numbers';

type Kind =
  | 'somme10'
  | 'passer10'
  | 'difference20'
  | 'complement10'
  | 'plusMoins10'
  | 'double'
  | 'moitie'
  | 'dizaineSuivante'
  | 'complement100'
  | 'plusMoinsDizaines';

interface Params {
  kinds: Kind[];
}

interface Data {
  kind: Kind;
  expected: number;
}

interface Item {
  prompt: string;
  expected: number;
}

const MAKERS: Record<Kind, (rng: Rng) => Item> = {
  somme10(rng) {
    const a = rng.int(1, 9);
    const b = rng.int(1, 10 - a);
    return { prompt: `${a} + ${b} = {?}`, expected: a + b };
  },
  passer10(rng) {
    const [a, b] = retry(
      () => [rng.int(2, 9), rng.int(2, 9)] as const,
      ([x, y]) => x + y > 10,
    );
    return { prompt: `${a} + ${b} = {?}`, expected: a + b };
  },
  difference20(rng) {
    const a = rng.int(11, 20);
    const b = rng.int(2, 9);
    return { prompt: `${a} − ${b} = {?}`, expected: a - b };
  },
  complement10(rng) {
    const a = rng.int(1, 9);
    const prompt = rng.chance(0.5) ? `${a} + {?} = 10` : `{?} + ${a} = 10`;
    return { prompt, expected: 10 - a };
  },
  plusMoins10(rng) {
    if (rng.chance(0.5)) {
      const n = rng.int(10, 89);
      return { prompt: `${n} + 10 = {?}`, expected: n + 10 };
    }
    const n = rng.int(20, 99);
    return { prompt: `${n} − 10 = {?}`, expected: n - 10 };
  },
  double(rng) {
    const n = rng.int(1, 50);
    return { prompt: `Le double de ${n}, c’est {?}`, expected: 2 * n };
  },
  moitie(rng) {
    const n = 2 * rng.int(1, 50);
    return { prompt: `La moitié de ${n}, c’est {?}`, expected: n / 2 };
  },
  dizaineSuivante(rng) {
    const n = retry(
      () => rng.int(11, 99),
      (x) => x % 10 !== 0,
    );
    const target = Math.ceil(n / 10) * 10;
    return { prompt: `${n} + {?} = ${target}`, expected: target - n };
  },
  complement100(rng) {
    const n = rng.int(1, 9) * 10;
    return { prompt: `${n} + {?} = 100`, expected: 100 - n };
  },
  plusMoinsDizaines(rng) {
    const { n, step, plus } = retry(
      () => ({
        n: rng.int(100, 899),
        step: rng.pick([10, 20, 30, 40, 100, 200, 300]),
        plus: rng.chance(0.5),
      }),
      ({ n, step, plus }) => {
        const result = plus ? n + step : n - step;
        if (result < 100 || result > 999) return false;
        if (step >= 100) return true;
        // Pas de passage de la centaine : les dizaines restent entre 0 et 9.
        const tens = digitAt(n, 1) + (plus ? step : -step) / 10;
        return tens >= 0 && tens <= 9;
      },
    );
    return {
      prompt: `${n} ${plus ? '+' : '−'} ${step} = {?}`,
      expected: plus ? n + step : n - step,
    };
  },
};

export default definePlugin('number-input', {
  id: 'maths.calcul.calcul-mental',
  version: 1,
  title: 'Calcul mental',
  description: 'Calcule dans ta tête : sommes, différences, doubles et moitiés.',
  icon: '🧠',
  notions: ['maths.calcul.mental'],
  expectedLevel: 7,
  levels: defineLevels<Params>([
    { label: 'Additions jusqu’à 10', grade: 'CP', params: { kinds: ['somme10'] } },
    { label: 'Passer la dizaine (8 + 5)', grade: 'CP', params: { kinds: ['passer10'] } },
    { label: 'Soustractions jusqu’à 20', grade: 'CP', params: { kinds: ['difference20'] } },
    { label: 'Compléments à 10', grade: 'CP', params: { kinds: ['complement10'] } },
    { label: 'Ajouter ou retirer 10', grade: 'CE1', params: { kinds: ['plusMoins10'] } },
    { label: 'Doubles et moitiés', grade: 'CE1', params: { kinds: ['double', 'moitie'] } },
    {
      label: 'Compléter à la dizaine, à 100',
      grade: 'CE1',
      params: { kinds: ['dizaineSuivante', 'complement100'] },
    },
    {
      label: 'Ajouter des dizaines, des centaines',
      grade: 'CE1',
      params: { kinds: ['plusMoinsDizaines'] },
    },
  ]),

  generate({ rng, params }) {
    const kind = rng.pick(params.kinds);
    const item = MAKERS[kind](rng);
    return {
      widget: 'number-input',
      instruction: 'CALCULE dans ta tête.',
      prompt: item.prompt,
      maxLength: 4,
      data: { kind, expected: item.expected } satisfies Data,
    };
  },

  solve: (q) => ({ value: String(q.data.expected) }),

  explain(q) {
    if (q.data.kind === 'double')
      return `Le double, c’est deux fois le nombre : ${q.data.expected / 2} + ${q.data.expected / 2} = ${q.data.expected}.`;
    if (q.data.kind === 'moitie')
      return `La moitié, c’est partager en deux parts égales : ${q.data.expected} + ${q.data.expected} = ${2 * q.data.expected}.`;
    return `Le bon résultat est ${q.data.expected}.`;
  },

  invariants: (q) =>
    Number.isInteger(q.data.expected) && q.data.expected >= 0 ? undefined : 'résultat invalide',

  signature: (q) => q.prompt,
});
