import { defineLevels, definePlugin } from '@app/core';
import { MONTHS } from '../../lib/temps';

// « RANGE les mois dans l'ordre de l'année » : de plus en plus de mois.

interface Params {
  count: number;
}

interface Data {
  /** Les numéros des étiquettes, dans l'ordre de l'année. */
  order: number[];
}

export default definePlugin<'order', Params, Data>('order', {
  id: 'qlm.temps.range-mois',
  version: 1,
  title: 'Les mois de l’année',
  description: 'Janvier, février, mars… : range les mois dans l’ordre.',
  icon: '🗓️',
  notions: ['qlm.temps.mois-saisons'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'Quatre mois à la suite', grade: 'CE1', params: { count: 4 } },
    { label: 'Six mois à la suite', grade: 'CE1', params: { count: 6 } },
    { label: 'Toute l’année', grade: 'CE1', params: { count: 12 } },
  ]),

  generate({ rng, params }) {
    // Des mois à la suite dans la même année, de janvier à décembre.
    const start = rng.int(0, MONTHS.length - params.count);
    const months = MONTHS.slice(start, start + params.count);
    const tiles = rng.shuffle(months.map((text, rank) => ({ text, rank })));
    const order = tiles.map((_, i) => i).sort((a, b) => tiles[a]!.rank - tiles[b]!.rank);
    return {
      widget: 'order',
      instruction:
        params.count === 12
          ? 'RANGE les mois de l’année dans l’ordre, en commençant par janvier.'
          : 'RANGE les mois dans l’ordre de l’année.',
      tiles: tiles.map((t) => ({ text: t.text })),
      list: true,
      data: { order },
    };
  },

  solve: (q) => ({ order: [...q.data.order] }),

  explain: (q) => `Dans l’ordre : ${q.data.order.map((i) => q.tiles[i]!.text).join(', ')}.`,
});
