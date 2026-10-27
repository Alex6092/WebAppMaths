import { defineLevels, definePlugin } from '@app/core';
import { LIFE_CYCLES } from '../../lib/animaux';

// « RANGE les étapes de la vie » : l'œuf, le poussin, la poule ; la graine, la pousse, la fleur.

interface Params {
  /** animal : la poule, le papillon, la grenouille ; plant : le haricot. */
  of: 'animal' | 'plant';
}

interface Data {
  title: string;
  order: number[];
}

const PLANTS = ['le haricot'];

export default definePlugin<'order', Params, Data>('order', {
  id: 'qlm.vivant.cycle-vie',
  version: 1,
  title: 'Naître et grandir',
  description: 'L’œuf, la chenille, la chrysalide, le papillon : range les étapes de la vie.',
  icon: '🐛',
  notions: ['qlm.vivant.cycles'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'La vie d’un animal', grade: 'CE1', params: { of: 'animal' } },
    { label: 'La vie d’une plante', grade: 'CE1', params: { of: 'plant' } },
  ]),

  generate({ rng, params }) {
    const cycle = rng.pick(
      LIFE_CYCLES.filter((c) => PLANTS.includes(c.title) === (params.of === 'plant')),
    );
    const tiles = rng.shuffle(cycle.steps.map((text, rank) => ({ text, rank })));
    const order = tiles.map((_, i) => i).sort((a, b) => tiles[a]!.rank - tiles[b]!.rank);
    return {
      widget: 'order',
      instruction: `RANGE les étapes de la vie : ${cycle.icon} ${cycle.title}.`,
      tiles: tiles.map((t) => ({ text: t.text })),
      list: true,
      data: { title: cycle.title, order },
    };
  },

  solve: (q) => ({ order: [...q.data.order] }),

  explain: (q) => `${q.data.order.map((i) => q.tiles[i]!.text).join(' → ')}.`,
});
