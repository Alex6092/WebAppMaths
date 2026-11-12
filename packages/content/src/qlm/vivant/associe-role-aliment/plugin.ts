import { defineLevels, definePlugin } from '@app/core';
import { FOOD_ROLES, FOOD_ROLES_NOTION } from '../../lib/nutriments';

export default definePlugin('classify', {
  id: 'qlm.vivant.associe-role-aliment',
  version: 1,
  title: 'Bâtisseurs, énergétiques ou protecteurs ?',
  icon: '🥗',
  notions: [FOOD_ROLES_NOTION],
  expectedLevel: 2,
  levels: defineLevels([
    { label: 'Les trois rôles', grade: 'CE1', params: { nutrients: false } },
    { label: 'Les nutriments et les fibres', grade: 'CE1', params: { nutrients: true } },
  ]),
  minVariety: 6,

  generate({ rng, params }) {
    const items = rng.shuffle(
      FOOD_ROLES.flatMap(({ id, role, nutrients }) =>
        (params.nutrients ? nutrients : [role]).map((text) => ({ id, text })),
      ),
    );
    return {
      widget: 'classify',
      instruction: params.nutrients
        ? 'CLASSE chaque étiquette selon le rôle auquel on l’associe.'
        : 'RANGE chaque étiquette sous le groupe d’aliments qui lui correspond.',
      layout: 'columns',
      items: items.map(({ text }) => ({ text })),
      categories: FOOD_ROLES.map(({ id, label }) => ({ id, label })),
      data: { placed: items.map(({ id }) => id) },
    };
  },

  solve: (q) => ({ placed: [...q.data.placed] }),
  explain: () =>
    'Les aliments bâtisseurs aident à grandir, les énergétiques donnent de l’énergie, et les protecteurs aident le corps à bien fonctionner.',
});
