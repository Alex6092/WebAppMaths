import { defineLevels, definePlugin } from '@app/core';
import { FAMILY_LABEL, FOOD_FAMILIES, FOODS, type FoodFamily } from '../../lib/aliments';

// SCI 2, fiche 2 : « CLASSE les étiquettes en 6 familles d'aliments. »

interface Params {
  families: number;
  perFamily: number;
  layout: 'columns' | 'table';
}

interface Data {
  families: FoodFamily[];
}

export default definePlugin<'classify', Params, Data>('classify', {
  id: 'qlm.vivant.classe-familles-aliments',
  version: 1,
  title: 'Les familles d’aliments',
  description: 'Féculents, fruits et légumes, produits laitiers…',
  icon: '🥗',
  notions: ['qlm.vivant.familles-aliments'],
  expectedLevel: 3,
  levels: defineLevels<Params>([
    { label: '3 familles', grade: 'CE1', params: { families: 3, perFamily: 2, layout: 'columns' } },
    { label: '4 familles', grade: 'CE1', params: { families: 4, perFamily: 2, layout: 'columns' } },
    {
      label: 'Les 6 familles',
      grade: 'CE1',
      params: { families: 6, perFamily: 1, layout: 'table' },
    },
  ]),

  generate({ rng, params }) {
    // Les familles gardent l'ordre de la fiche.
    const chosen = rng.sample(FOOD_FAMILIES, params.families);
    const families = FOOD_FAMILIES.filter((f) => chosen.includes(f));
    const foods = rng.shuffle(
      families.flatMap((family) =>
        rng.sample(
          FOODS.filter((f) => f.family === family),
          params.perFamily,
        ),
      ),
    );
    return {
      widget: 'classify',
      instruction: 'CLASSE les aliments dans leur famille.',
      layout: params.layout,
      items: foods.map((f) => ({ text: f.name, icon: f.icon })),
      categories: families.map((f) => ({ id: f, label: FAMILY_LABEL[f] })),
      data: { families: foods.map((f) => f.family!) },
    };
  },

  solve: (q) => ({ placed: [...q.data.families] }),

  explain: (q) =>
    q.items.map((item, i) => `${item.text} : ${FAMILY_LABEL[q.data.families[i]!]}`).join(' ; '),

  signature: (q) =>
    q.items
      .map((i) => i.text)
      .sort()
      .join('|'),
});
