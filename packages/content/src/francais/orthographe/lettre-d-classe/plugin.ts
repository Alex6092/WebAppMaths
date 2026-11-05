import { defineLevels, definePlugin, type ClassifyCategory } from '@app/core';
import { D_LABEL, D_WORDS, type DSound } from '../../lib/lettre-d';

// ORTHO 5 : « LIS les mots et RANGE-les » (j'entends [d], ou le d est muet).

interface Params {
  count: number;
}

interface Data {
  placed: DSound[];
}

const SOUNDS: DSound[] = ['d', 'muet'];
const CATEGORIES: ClassifyCategory[] = [
  { id: 'd', label: D_LABEL.d, color: '#e3f2fd' },
  { id: 'muet', label: D_LABEL.muet, color: '#eeeeee' },
];

export default definePlugin<'classify', Params, Data>('classify', {
  id: 'francais.orthographe.lettre-d-classe',
  version: 1,
  title: 'La lettre d : [d] ou muette ?',
  description: 'Un dragon, un lézard : range les mots selon que tu entends le d ou non.',
  icon: '👂',
  notions: ['francais.orthographe.lettre-d', 'francais.orthographe.dictee-5'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'Six mots', grade: 'CE1', params: { count: 6 } },
    { label: 'Dix mots', grade: 'CE1', params: { count: 10 } },
  ]),

  generate({ rng, params }) {
    const each = params.count / SOUNDS.length;
    const items = rng.shuffle(
      SOUNDS.flatMap((sound) => rng.sample(D_WORDS[sound], each).map((text) => ({ text, sound }))),
    );
    return {
      widget: 'classify',
      instruction: 'LIS les mots et RANGE-les : entends-tu la lettre d ?',
      layout: 'columns',
      items: items.map((i) => ({ text: i.text })),
      categories: CATEGORIES,
      data: { placed: items.map((i) => i.sound) },
    };
  },

  solve: (q) => ({ placed: [...q.data.placed] }),

  explain: () =>
    'Au début ou au milieu du mot, on entend le d : un dragon, un cadeau. À la fin, il est souvent muet : un lézard, grand, froid.',
});
