import { defineLevels, definePlugin } from '@app/core';
import { FOODS, SOURCE_LABEL, type Source } from '../../lib/aliments';

// SCI 2, leçon 1 : les aliments viennent de l'agriculture, de l'élevage ou de la pêche.

interface Data {
  sources: Source[];
}

const SOURCES: Source[] = ['agriculture', 'elevage', 'peche'];

export default definePlugin<'classify', Record<string, never>, Data>('classify', {
  id: 'qlm.vivant.provenance-aliments',
  version: 1,
  title: 'Agriculture, élevage ou pêche ?',
  description: 'L’agriculture, l’élevage ou la pêche.',
  icon: '🚜',
  notions: ['qlm.vivant.origine-aliments'],
  levels: defineLevels<Record<string, never>>([
    { label: 'Agriculture, élevage ou pêche', grade: 'CE1', params: {} },
  ]),

  generate({ rng }) {
    const foods = rng.shuffle(
      SOURCES.flatMap((source) =>
        rng.sample(
          FOODS.filter((f) => f.source === source),
          2,
        ),
      ),
    );
    return {
      widget: 'classify',
      instruction: 'CLASSE les aliments : d’où viennent-ils ?',
      layout: 'columns',
      items: foods.map((f) => ({ text: f.name, icon: f.icon })),
      categories: SOURCES.map((s) => ({ id: s, label: SOURCE_LABEL[s] })),
      data: { sources: foods.map((f) => f.source!) },
    };
  },

  solve: (q) => ({ placed: [...q.data.sources] }),

  explain: () =>
    'L’agriculture : les fruits, les légumes, les céréales. L’élevage : les animaux de la ferme (lait, œufs, viande). La pêche : les poissons et les fruits de mer.',

  signature: (q) =>
    q.items
      .map((i) => i.text)
      .sort()
      .join('|'),
});
