import { defineLevels, definePlugin } from '@app/core';
import { capitalized, FOODS } from '../../lib/aliments';

// SCI 2, leçon 1 : la plupart des aliments sont transformés.

interface Data {
  transformed: string[];
}

export default definePlugin<'mcq', Record<string, never>, Data>('mcq', {
  id: 'qlm.vivant.aliments-transformes',
  version: 1,
  title: 'Les aliments transformés',
  description: 'Fabriqués à partir d’autres aliments.',
  icon: '🍕',
  notions: ['qlm.vivant.origine-aliments'],
  levels: defineLevels<Record<string, never>>([
    { label: 'Coche les aliments transformés', grade: 'CE1', params: {} },
  ]),

  generate({ rng }) {
    const count = rng.int(2, 3);
    const foods = rng.shuffle([
      ...rng.sample(
        FOODS.filter((f) => f.transformed),
        count,
      ),
      ...rng.sample(
        FOODS.filter((f) => !f.transformed),
        6 - count,
      ),
    ]);
    return {
      widget: 'mcq',
      instruction: 'COCHE les aliments transformés.',
      choices: foods.map((f) => ({ id: f.name, label: capitalized(f.name), icon: f.icon })),
      multiple: true,
      layout: 'grid',
      data: { transformed: foods.filter((f) => f.transformed).map((f) => f.name) },
    };
  },

  solve: (q) => ({ selected: [...q.data.transformed] }),

  explain: (q) =>
    `${q.data.transformed.map(capitalized).join(', ')} : on les fabrique en mélangeant ou en modifiant d’autres aliments.`,

  signature: (q) =>
    q.choices
      .map((c) => c.id)
      .sort()
      .join('|'),
});
