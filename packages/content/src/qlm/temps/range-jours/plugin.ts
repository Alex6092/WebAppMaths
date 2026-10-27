import { defineLevels, definePlugin } from '@app/core';
import { DAYS } from '../../lib/temps';

// « RANGE les jours de la semaine dans l'ordre » : quelques jours à la suite, puis toute la semaine.

interface Params {
  count: number;
}

interface Data {
  /** Les numéros des étiquettes, dans l'ordre de la semaine. */
  order: number[];
}

export default definePlugin<'order', Params, Data>('order', {
  id: 'qlm.temps.range-jours',
  version: 1,
  title: 'Les jours de la semaine',
  description: 'Lundi, mardi, mercredi… : range les jours dans l’ordre.',
  icon: '📅',
  notions: ['qlm.temps.semaine'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'Quatre jours à la suite', grade: 'CE1', params: { count: 4 } },
    { label: 'Toute la semaine', grade: 'CE1', params: { count: 7 } },
  ]),

  generate({ rng, params }) {
    // Des jours à la suite dans la même semaine : du lundi au dimanche, sans faire le tour.
    const start = rng.int(0, DAYS.length - params.count);
    const days = DAYS.slice(start, start + params.count);
    const tiles = rng.shuffle(days.map((text, rank) => ({ text, rank })));
    const order = tiles.map((_, i) => i).sort((a, b) => tiles[a]!.rank - tiles[b]!.rank);
    return {
      widget: 'order',
      instruction:
        params.count === 7
          ? 'RANGE les jours de la semaine dans l’ordre, en commençant par lundi.'
          : 'RANGE les jours dans l’ordre de la semaine.',
      tiles: tiles.map((t) => ({ text: t.text })),
      list: true,
      data: { order },
    };
  },

  solve: (q) => ({ order: [...q.data.order] }),

  explain: (q) => `Dans l’ordre : ${q.data.order.map((i) => q.tiles[i]!.text).join(', ')}.`,
});
