import { defineLevels, definePlugin, type ClassifyCategory } from '@app/core';
import { T_LABEL, T_WORDS, type TSound } from '../../lib/lettre-t';

// Dictée 4, exercice 1 : « LIS les mots et CLASSE-les dans le tableau » ([t], [s] ou muet).

interface Params {
  count: number;
}

interface Data {
  placed: TSound[];
}

const SOUNDS: TSound[] = ['t', 's', 'muet'];
const CATEGORIES: ClassifyCategory[] = [
  { id: 't', label: T_LABEL.t, color: '#e3f2fd' },
  { id: 's', label: T_LABEL.s, color: '#fce4ec' },
  { id: 'muet', label: T_LABEL.muet, color: '#eeeeee' },
];

export default definePlugin<'classify', Params, Data>('classify', {
  id: 'francais.orthographe.lettre-t-classe',
  version: 1,
  title: 'La lettre t : [t], [s] ou muette ?',
  description: 'Une carte, la pollution, souvent : range les mots selon le son du t.',
  icon: '👂',
  notions: ['francais.orthographe.lettre-t', 'francais.orthographe.dictee-4'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'Six mots', grade: 'CE1', params: { count: 6 } },
    { label: 'Neuf mots', grade: 'CE1', params: { count: 9 } },
  ]),

  generate({ rng, params }) {
    // Autant de mots de chaque sorte, au moins deux.
    const each = params.count / SOUNDS.length;
    const items = rng.shuffle(
      SOUNDS.flatMap((sound) => rng.sample(T_WORDS[sound], each).map((text) => ({ text, sound }))),
    );
    return {
      widget: 'classify',
      instruction: 'LIS les mots et RANGE-les : comment se prononce la lettre t ?',
      layout: 'columns',
      items: items.map((i) => ({ text: i.text })),
      categories: CATEGORIES,
      data: { placed: items.map((i) => i.sound) },
    };
  },

  solve: (q) => ({ placed: [...q.data.placed] }),

  explain: () =>
    'Devant -ion, -ie, -iel ou -ial, le t se dit souvent [s] : la pollution, spatial. À la fin du mot, il est souvent muet : souvent, le sport.',
});
