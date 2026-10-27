import { defineLevels, definePlugin, type ClassifyCategory } from '@app/core';
import { ANIMALS, COVER_LABEL, MOVE_LABEL, type Cover, type Move } from '../../lib/animaux';

// « RANGE les animaux » : selon ce qui couvre leur corps, puis selon leur façon de se déplacer.

interface Params {
  by: 'cover' | 'move';
  /** Les colonnes du tableau. */
  groups: (Cover | Move)[];
  each: number;
}

interface Data {
  placed: string[];
}

const COLORS = ['#fff3e0', '#e3f2fd', '#e8f5e9', '#fce4ec'];

export default definePlugin<'classify', Params, Data>('classify', {
  id: 'qlm.vivant.classe-animaux',
  version: 1,
  title: 'Classer les animaux',
  description: 'Des poils, des plumes ou des écailles ? Il marche, il vole, il nage ou il rampe ?',
  icon: '🐾',
  notions: ['qlm.vivant.animaux'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    {
      label: 'Des poils ou des plumes',
      grade: 'CE1',
      params: { by: 'cover', groups: ['poils', 'plumes'], each: 3 },
    },
    {
      label: 'Poils, plumes, écailles',
      grade: 'CE1',
      params: { by: 'cover', groups: ['poils', 'plumes', 'ecailles'], each: 2 },
    },
    {
      label: 'Comment il se déplace',
      grade: 'CE1',
      params: { by: 'move', groups: ['marche', 'vole', 'nage', 'rampe'], each: 2 },
    },
  ]),

  generate({ rng, params }) {
    const groupOf = (a: (typeof ANIMALS)[number]) => (params.by === 'cover' ? a.cover : a.move);
    const items = rng.shuffle(
      params.groups.flatMap((group) =>
        rng
          .sample(
            ANIMALS.filter((a) => groupOf(a) === group),
            params.each,
          )
          .map((a) => ({ ...a, group })),
      ),
    );
    const label = (g: Cover | Move) =>
      params.by === 'cover' ? COVER_LABEL[g as Cover] : MOVE_LABEL[g as Move];
    const categories: ClassifyCategory[] = params.groups.map((g, i) => ({
      id: g,
      label: label(g),
      color: COLORS[i],
    }));
    return {
      widget: 'classify',
      instruction:
        params.by === 'cover'
          ? 'RANGE les animaux : qu’est-ce qui couvre leur corps ?'
          : 'RANGE les animaux : comment se déplacent-ils ?',
      layout: 'columns',
      items: items.map((a) => ({ text: a.name, icon: a.icon })),
      categories,
      data: { placed: items.map((a) => a.group) },
    };
  },

  solve: (q) => ({ placed: [...q.data.placed] }),

  explain: (q) =>
    q.categories
      .map(
        (c) =>
          `${c.label} : ${q.items
            .filter((_, i) => q.data.placed[i] === c.id)
            .map((i) => i.text)
            .join(', ')}`,
      )
      .join('. ') + '.',
});
