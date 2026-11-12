import { defineLevels, definePlugin } from '@app/core';
import { P_GROUPS, P_NOTION } from '../../lib/lettre-p';

export default definePlugin('classify', {
  id: 'francais.orthographe.lettre-p-classe',
  version: 1,
  title: 'Range les mots avec p, pp ou ph',
  description: 'Écoute le son de la lettre p dans ta tête et observe comment le mot s’écrit.',
  icon: '👂',
  notions: [P_NOTION],
  expectedLevel: 1,
  levels: defineLevels([{ label: 'Les quatre cas', grade: 'CE1', params: {} }]),

  generate({ rng }) {
    const items = rng.shuffle(
      P_GROUPS.flatMap(({ id, words }) => rng.sample(words, 2).map((text) => ({ id, text }))),
    );
    return {
      widget: 'classify',
      instruction: 'LIS et CLASSE les mots dans le tableau.',
      layout: 'table',
      items: items.map(({ text }) => ({ text })),
      categories: P_GROUPS.map(({ id, label }) => ({ id, label })),
      data: { placed: items.map(({ id }) => id) },
    };
  },

  solve: (q) => ({ placed: [...q.data.placed] }),
  explain: () =>
    'Dans poule et nappe, j’entends [p]. Dans photo, j’entends [f]. Dans loup, le p est muet.',
});
