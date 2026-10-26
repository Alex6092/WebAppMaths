import { defineLevels, definePlugin } from '@app/core';
import { retry } from '../../../lib/numbers';

// « … < 347 < … » : le nombre d'avant et d'après, encadrer à la dizaine, à la centaine.

type Kind = 'voisins' | 'dizaine' | 'centaine';

interface Params {
  kind: Kind;
  max: number;
}

interface Data {
  kind: Kind;
  n: number;
  low: number;
  high: number;
}

const INSTRUCTIONS: Record<Kind, string> = {
  voisins: 'ÉCRIS le nombre juste avant et le nombre juste après.',
  dizaine: 'ENCADRE à la dizaine.',
  centaine: 'ENCADRE à la centaine.',
};

export default definePlugin<'fill-blank', Params, Data>('fill-blank', {
  id: 'maths.nombres.encadrer',
  version: 1,
  title: 'Encadrer un nombre',
  description: 'Trouve les nombres juste avant et juste après, ou encadre à la dizaine.',
  icon: '🧭',
  notions: ['maths.nombres.encadrer'],
  expectedLevel: 4,
  levels: defineLevels<Params>([
    { label: 'Avant, après, jusqu’à 100', grade: 'CP', params: { kind: 'voisins', max: 99 } },
    { label: 'Avant, après, jusqu’à 999', grade: 'CE1', params: { kind: 'voisins', max: 998 } },
    { label: 'À la dizaine', grade: 'CE1', params: { kind: 'dizaine', max: 999 } },
    { label: 'À la centaine', grade: 'CE1', params: { kind: 'centaine', max: 999 } },
  ]),

  generate({ rng, params }) {
    const { kind, max } = params;
    let n: number;
    if (kind === 'voisins') {
      // Souvent un passage de dizaine ou de centaine : 399 → 400, 610 → 609.
      n = rng.chance(0.5)
        ? retry(
            () => rng.int(1, Math.floor(max / 10)) * 10 + rng.pick([-1, 0]),
            (x) => x >= 2 && x <= max,
          )
        : rng.int(2, max);
    } else {
      const step = kind === 'dizaine' ? 10 : 100;
      n = retry(
        () => rng.int(101, max),
        (x) => x % step !== 0,
      );
    }
    const step = kind === 'voisins' ? 1 : kind === 'dizaine' ? 10 : 100;
    const low = kind === 'voisins' ? n - 1 : Math.floor(n / step) * step;
    const high = kind === 'voisins' ? n + 1 : low + step;
    return {
      widget: 'fill-blank',
      instruction: INSTRUCTIONS[kind],
      prompt: `{0} < ${n} < {1}`,
      blanks: [
        { kind: 'text', size: 4, digits: true },
        { kind: 'text', size: 4, digits: true },
      ],
      data: { kind, n, low, high },
    };
  },

  solve: (q) => ({ values: [String(q.data.low), String(q.data.high)] }),

  explain(q) {
    const { kind, n, low, high } = q.data;
    if (kind === 'voisins') return `Juste avant ${n}, il y a ${low} ; juste après, ${high}.`;
    return `${n} est entre ${low} et ${high} : ${low} < ${n} < ${high}.`;
  },

  signature: (q) => `${q.data.kind}:${q.data.n}`,
});
