import { defineLevels, definePlugin } from '@app/core';
import { FOODS, ORIGIN_LABEL, type Origin } from '../../lib/aliments';

// SCI 2, leçon 1 : les aliments d'origine animale, végétale ou minérale.

interface Params {
  origins: Origin[];
  items: number;
}

interface Data {
  origins: Origin[];
}

export default definePlugin<'classify', Params, Data>('classify', {
  id: 'qlm.vivant.origine-aliments',
  version: 1,
  title: 'L’origine des aliments',
  description: 'Animale, végétale ou minérale ?',
  icon: '🐄',
  notions: ['qlm.vivant.origine-aliments'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    {
      label: 'Animale ou végétale',
      grade: 'CE1',
      params: { origins: ['animale', 'vegetale'], items: 6 },
    },
    {
      label: 'Animale, végétale ou minérale',
      grade: 'CE1',
      params: { origins: ['animale', 'vegetale', 'minerale'], items: 7 },
    },
  ]),

  generate({ rng, params }) {
    // Deux aliments au moins par origine (un seul pour la minérale : l'eau ou le sel).
    const picked = params.origins.flatMap((origin) =>
      rng.sample(
        FOODS.filter((f) => f.origin === origin),
        origin === 'minerale' ? 1 : 2,
      ),
    );
    const rest = rng.sample(
      FOODS.filter(
        (f) => f.origin && f.origin !== 'minerale' && params.origins.includes(f.origin),
      ).filter((f) => !picked.includes(f)),
      params.items - picked.length,
    );
    const foods = rng.shuffle([...picked, ...rest]);
    return {
      widget: 'classify',
      instruction: 'CLASSE les aliments selon leur origine.',
      layout: 'columns',
      items: foods.map((f) => ({ text: f.name, icon: f.icon })),
      categories: params.origins.map((o) => ({ id: o, label: ORIGIN_LABEL[o] })),
      data: { origins: foods.map((f) => f.origin!) },
    };
  },

  solve: (q) => ({ placed: [...q.data.origins] }),

  explain: () =>
    'Origine animale : ça vient d’un animal (lait, œufs, viande, poisson, miel). Origine végétale : ça vient d’une plante. Origine minérale : l’eau et le sel.',

  signature: (q) =>
    q.items
      .map((i) => i.text)
      .sort()
      .join('|'),
});
