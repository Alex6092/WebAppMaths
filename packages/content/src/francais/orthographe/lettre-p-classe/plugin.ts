import { defineLevels, definePlugin } from '@app/core';
import { P_GROUPS, P_LESSON_GROUPS, P_NOTION } from '../../lib/lettre-p';

interface Params {
  /** Les cinq cases de la fiche ORTHO 6 (p, pp, ph, p muet devant t, p muet à la fin). */
  lesson: boolean;
}

export default definePlugin<'classify', Params, { placed: string[] }>('classify', {
  id: 'francais.orthographe.lettre-p-classe',
  version: 1,
  title: 'Range les mots avec p, pp ou ph',
  description: 'Écoute le son de la lettre p dans ta tête et observe comment le mot s’écrit.',
  icon: '👂',
  notions: [P_NOTION],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'Les quatre cas', grade: 'CE1', params: { lesson: false } },
    { label: 'Les cinq cases de la leçon', grade: 'CE1', params: { lesson: true } },
  ]),

  generate({ rng, params }) {
    const groups = params.lesson ? P_LESSON_GROUPS : P_GROUPS;
    const items = rng.shuffle(
      groups.flatMap(({ id, words }) => rng.sample(words, 2).map((text) => ({ id, text }))),
    );
    return {
      widget: 'classify',
      instruction: 'LIS et CLASSE les mots dans le tableau.',
      layout: 'table',
      items: items.map(({ text }) => ({ text })),
      categories: groups.map(({ id, label }) => ({ id, label })),
      data: { placed: items.map(({ id }) => id) },
    };
  },

  solve: (q) => ({ placed: [...q.data.placed] }),
  explain: () =>
    'Dans poule et nappe, j’entends [p]. Dans photo, j’entends [f]. Dans loup et dans compter, le p est muet.',
});
