import { defineLevels, definePlugin } from '@app/core';
import { PINK } from '../../lib/couleurs';
import { T_WORDS } from '../../lib/lettre-t';

// Dictée 4, exercice 2 : « COLORIE la case quand la lettre T fait le son [s] ».

interface Params {
  count: number;
}

interface Data {
  /** Les cases où le t fait [s]. */
  right: boolean[];
}

export default definePlugin<'word-select', Params, Data>('word-select', {
  id: 'francais.orthographe.lettre-t-colorie',
  version: 1,
  title: 'Quand le t fait [s]',
  description: 'Colorie les mots où la lettre t se dit [s] : une émotion, la patience.',
  icon: '🖍️',
  notions: ['francais.orthographe.lettre-t', 'francais.orthographe.dictee-4'],
  expectedLevel: 1,
  levels: defineLevels<Params>([{ label: 'Douze mots', grade: 'CE1', params: { count: 12 } }]),

  generate({ rng, params }) {
    const s = rng.int(4, 6);
    const words = rng.shuffle([
      ...rng.sample(T_WORDS.s, s).map((text) => ({ text, right: true })),
      ...rng
        .sample([...T_WORDS.t, ...T_WORDS.muet], params.count - s)
        .map((text) => ({ text, right: false })),
    ]);
    return {
      widget: 'word-select',
      instruction: 'COLORIE la case quand la lettre t fait le son [s].',
      layout: 'grid',
      mark: 'color',
      tokens: words.map((w) => ({ text: w.text })),
      colors: PINK,
      data: { right: words.map((w) => w.right) },
    };
  },

  solve: (q) => ({ picks: q.data.right.map((r) => (r ? PINK[0]!.id : null)) }),

  explain: () =>
    'Le t se dit [s] devant -ion, -ie, -iel, -ial, -ieux : une punition, la patience, partiel, spatial.',
});
