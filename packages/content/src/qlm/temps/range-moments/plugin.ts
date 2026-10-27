import { defineLevels, definePlugin } from '@app/core';
import { DAY_MOMENTS, LIFE_STAGES, STORIES, type Sequence } from '../../lib/temps';

// Avant, après : ranger les moments de la journée, les âges de la vie, puis une petite histoire.

interface Params {
  what: 'day' | 'life' | 'story';
}

interface Data {
  title: string;
  /** Les numéros des étiquettes, dans l'ordre du temps. */
  order: number[];
}

const INSTRUCTION: Record<Params['what'], string> = {
  day: 'RANGE les moments de la journée, du plus tôt au plus tard.',
  life: 'RANGE les âges de la vie, du plus jeune au plus âgé.',
  story: 'RANGE l’histoire dans l’ordre : qu’est-ce qui se passe d’abord ?',
};

export default definePlugin<'order', Params, Data>('order', {
  id: 'qlm.temps.range-moments',
  version: 1,
  title: 'Avant, après',
  description: 'Le matin avant le soir, le bébé avant l’enfant : range dans l’ordre du temps.',
  icon: '➡️',
  notions: ['qlm.temps.chronologie'],
  expectedLevel: 3,
  levels: defineLevels<Params>([
    { label: 'Les moments de la journée', grade: 'CE1', params: { what: 'day' } },
    { label: 'Les âges de la vie', grade: 'CE1', params: { what: 'life' } },
    { label: 'Une petite histoire', grade: 'CE1', params: { what: 'story' } },
  ]),

  generate({ rng, params }) {
    const sequence: Sequence =
      params.what === 'day'
        ? DAY_MOMENTS
        : params.what === 'life'
          ? LIFE_STAGES
          : rng.pick(STORIES);
    const tiles = rng.shuffle(sequence.steps.map((text, rank) => ({ text, rank })));
    const order = tiles.map((_, i) => i).sort((a, b) => tiles[a]!.rank - tiles[b]!.rank);
    return {
      widget: 'order',
      instruction: INSTRUCTION[params.what],
      tiles: tiles.map((t) => ({ text: t.text })),
      // Les moments et les âges sont une liste ; l'histoire, des phrases à la suite.
      ...(params.what === 'story' ? {} : { list: true }),
      data: { title: sequence.title, order },
    };
  },

  solve: (q) => ({ order: [...q.data.order] }),

  explain: (q) =>
    `Dans l’ordre du temps : ${q.data.order.map((i) => q.tiles[i]!.text).join(' → ')}`,
});
