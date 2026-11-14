import { defineLevels, definePlugin } from '@app/core';
import { P_HEARD, P_NOTION, P_SILENT } from '../../lib/lettre-p';

// ORTHO 6 : le p s'entend dans un slip, stop ; il est muet dans un loup, beaucoup, et devant t
// dans compter, sept.

interface Params {
  count: number;
}

interface Data {
  placed: string[];
}

const CATEGORIES = [
  { id: 'heard', label: 'j’entends [p]' },
  { id: 'silent', label: 'le p est muet' },
];

export default definePlugin<'classify', Params, Data>('classify', {
  id: 'francais.orthographe.lettre-p-entends',
  version: 1,
  title: 'J’entends le p, ou il est muet ?',
  description: 'Un loup, une loupe ; sept, un serpent : dis le mot et écoute le p.',
  icon: '👂',
  notions: [P_NOTION],
  expectedLevel: 1,
  levels: defineLevels<Params>([{ label: 'Huit mots', grade: 'CE1', params: { count: 8 } }]),

  generate({ rng, params }) {
    const heard = rng.int(3, params.count - 3);
    const items = rng.shuffle([
      ...rng.sample(P_HEARD, heard).map((text) => ({ text, id: 'heard' })),
      ...rng.sample(P_SILENT, params.count - heard).map((text) => ({ text, id: 'silent' })),
    ]);
    return {
      widget: 'classify',
      instruction: 'DIS le mot dans ta tête et RANGE-le : j’entends le p, ou le p est muet ?',
      layout: 'columns',
      items: items.map(({ text }) => ({ text })),
      categories: CATEGORIES,
      data: { placed: items.map(({ id }) => id) },
    };
  },

  solve: (q) => ({ placed: [...q.data.placed] }),

  explain: () =>
    'J’entends le p dans une loupe, un slip, stop. Il est muet à la fin de un loup, trop, beaucoup, et devant le t de compter, sept.',
});
