import { defineLevels, definePlugin } from '@app/core';
import {
  capitalized,
  FAMILY_LABEL,
  FOOD_FAMILIES,
  FOODS,
  type FoodFamily,
} from '../../lib/aliments';

// SCI 2, leçon 2 : à quelle famille appartient cet aliment ?

interface Data {
  family: FoodFamily;
  name: string;
}

export default definePlugin<'mcq', Record<string, never>, Data>('mcq', {
  id: 'qlm.vivant.famille-aliment',
  version: 1,
  title: 'Dans quelle famille ?',
  description: 'Trouve la famille d’un aliment.',
  icon: '🧺',
  notions: ['qlm.vivant.familles-aliments'],
  levels: defineLevels<Record<string, never>>([
    { label: 'Une famille parmi trois', grade: 'CE1', params: {} },
  ]),

  generate({ rng }) {
    const food = rng.pick(FOODS.filter((f) => f.family));
    const family = food.family!;
    // La bonne famille et deux autres, dans l'ordre de la fiche.
    const others = rng.sample(
      FOOD_FAMILIES.filter((f) => f !== family),
      2,
    );
    const choices = FOOD_FAMILIES.filter((f) => f === family || others.includes(f));
    return {
      widget: 'mcq',
      instruction: 'COCHE la famille de cet aliment.',
      prompt: `${food.icon} ${capitalized(food.name)}`,
      choices: choices.map((f) => ({ id: f, label: FAMILY_LABEL[f] })),
      multiple: false,
      layout: 'list',
      data: { family, name: food.name },
    };
  },

  solve: (q) => ({ selected: [q.data.family] }),

  explain: (q) => `${capitalized(q.data.name)} : ${FAMILY_LABEL[q.data.family]}.`,

  signature: (q) => `${q.data.name}:${q.choices.map((c) => c.id).join('|')}`,
});
