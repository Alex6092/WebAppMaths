import { compareBlanks, defineLevels, definePlugin, type Blank } from '@app/core';
import { digitAt, retry } from '../../../lib/numbers';

// « 347 = 3 centaines 4 dizaines 7 unités », « 347 = 300 + 40 + 7 », et l'inverse.

type Kind = 'cdu' | 'additive' | 'compose' | 'exchange';

interface Params {
  kind: Kind;
  /** Les parties dans le désordre (7 unités + 3 centaines…). */
  shuffled?: boolean;
}

interface Data {
  n: number;
  values: string[];
  /** L'ordre des réponses n'a pas d'importance (300 + 40 + 7 = 7 + 40 + 300). */
  anyOrder: boolean;
}

const digitsBlank: Blank = { kind: 'text', size: 4, digits: true };

function unit(count: number, name: 'centaine' | 'dizaine' | 'unité'): string {
  return `${count} ${name}${count > 1 ? 's' : ''}`;
}

export default definePlugin<'fill-blank', Params, Data>('fill-blank', {
  id: 'maths.nombres.decomposer',
  version: 1,
  title: 'Centaines, dizaines, unités',
  description: 'Décompose un nombre, ou retrouve-le à partir de ses centaines, dizaines et unités.',
  icon: '🧱',
  notions: ['maths.nombres.decomposer'],
  expectedLevel: 4,
  levels: defineLevels<Params>([
    { label: 'Centaines, dizaines, unités', grade: 'CE1', params: { kind: 'cdu' } },
    { label: '347 = 300 + 40 + 7', grade: 'CE1', params: { kind: 'additive' } },
    { label: 'Retrouver le nombre', grade: 'CE1', params: { kind: 'compose' } },
    { label: 'Dans le désordre', grade: 'CE1', params: { kind: 'compose', shuffled: true } },
    { label: '14 dizaines = 1 centaine 4 dizaines', grade: 'CE1', params: { kind: 'exchange' } },
  ]),

  generate({ rng, params }) {
    const n = retry(
      () => rng.int(101, 999),
      // Assez souvent un zéro au milieu ou à la fin : 307, 450.
      (x) => params.kind === 'cdu' || x % 10 !== 0 || digitAt(x, 1) !== 0,
    );
    const [h, t, u] = [digitAt(n, 2), digitAt(n, 1), digitAt(n, 0)];
    let prompt: string;
    let values: string[];
    let anyOrder = false;

    if (params.kind === 'cdu') {
      prompt = `${n} = {0} centaines   {1} dizaines   {2} unités`;
      values = [String(h), String(t), String(u)];
    } else if (params.kind === 'additive') {
      const parts = [h * 100, t * 10, u].filter((p) => p > 0);
      prompt = `${n} = ${parts.map((_, i) => `{${i}}`).join(' + ')}`;
      values = parts.map(String);
      anyOrder = true;
    } else if (params.kind === 'compose') {
      const parts = [
        h > 0 ? unit(h, 'centaine') : '',
        t > 0 ? unit(t, 'dizaine') : '',
        u > 0 ? unit(u, 'unité') : '',
      ].filter(Boolean);
      prompt = `${(params.shuffled ? rng.shuffle(parts) : parts).join(' + ')} = {0}`;
      values = [String(n)];
    } else {
      // Une centaine « cassée » en 10 dizaines, ou une dizaine en 10 unités.
      const counts =
        t === 0 || rng.chance(0.5)
          ? ([
              [h - 1, 'centaine'],
              [t + 10, 'dizaine'],
              [u, 'unité'],
            ] as const)
          : ([
              [h, 'centaine'],
              [t - 1, 'dizaine'],
              [u + 10, 'unité'],
            ] as const);
      const parts = counts.filter(([c]) => c > 0).map(([c, name]) => unit(c, name));
      prompt = `${parts.join(' + ')} = {0}`;
      values = [String(n)];
    }

    return {
      widget: 'fill-blank',
      instruction: 'COMPLÈTE.',
      prompt,
      blanks: values.map(() => digitsBlank),
      data: { n, values, anyOrder },
    };
  },

  solve: (q) => ({ values: q.data.values }),

  check(q, answer) {
    let expected = q.data.values;
    // 7 + 40 + 300 est juste aussi : on suit l'ordre de l'enfant quand il a les bons nombres.
    if (q.data.anyOrder) {
      const sorted = (list: string[]) => [...list].sort().join(',');
      if (sorted(answer.values) === sorted(expected)) expected = answer.values;
    }
    return compareBlanks(
      q,
      expected.map((v) => [v]),
      answer,
    );
  },

  explain(q) {
    const { n } = q.data;
    const [h, t, u] = [digitAt(n, 2), digitAt(n, 1), digitAt(n, 0)];
    return `${n}, c’est ${h} centaines, ${t} dizaines et ${u} unités : ${n} = ${h * 100} + ${t * 10} + ${u}.`;
  },

  signature: (q) => q.prompt,
});
