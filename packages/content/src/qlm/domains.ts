import type { Domain, LessonBlock, Notion } from '@app/core';
import { FAMILY_LABEL, FOOD_FAMILIES, FOODS } from './lib/aliments';

export const domains: Domain[] = [
  { id: 'qlm.temps', subject: 'qlm', title: 'Se repérer dans le temps', icon: '🕰️', order: 1 },
  { id: 'qlm.espace', subject: 'qlm', title: 'Se repérer dans l’espace', icon: '🧭', order: 2 },
  { id: 'qlm.vivant', subject: 'qlm', title: 'Le vivant', icon: '🌱', order: 3 },
  { id: 'qlm.matiere', subject: 'qlm', title: 'La matière', icon: '💧', order: 4 },
];

const cell = (name: string) => {
  const food = FOODS.find((f) => f.name === name)!;
  return `${food.icon} ${food.name}`;
};

// SCI 2, leçon 1 : d'où proviennent nos aliments ?
const ORIGINE_LESSON: LessonBlock[] = [
  'Nos aliments viennent de l’**agriculture** (fruits, légumes, céréales), de l’**élevage** (lait, œufs, viande) ou de la **pêche** (poissons).',
  'Ils ont des **origines** différentes :',
  {
    kind: 'table',
    columns: [
      {
        title: 'origine animale',
        cells: ['le poulet', 'les œufs', 'le lait', 'le poisson'].map(cell),
      },
      {
        title: 'origine végétale',
        cells: ['la salade', 'la pomme', 'le riz', 'la carotte'].map(cell),
      },
      { title: 'origine minérale', cells: ['l’eau', 'le sel'].map(cell) },
    ],
  },
  'La plupart des aliments sont **transformés** : on les fabrique en mélangeant et en modifiant des aliments d’origines différentes. *La pizza, le gâteau, le pain…*',
];

// SCI 2, leçon 2 : les familles d'aliments (la fiche à classer).
const FAMILLES_LESSON: LessonBlock[] = [
  'Aucun aliment n’est interdit, mais il faut **manger varié** : un peu de chaque **famille d’aliments**, en bonnes **quantités**.',
  ...[FOOD_FAMILIES.slice(0, 3), FOOD_FAMILIES.slice(3)].map((families): LessonBlock => ({
    kind: 'table',
    columns: families.map((family) => ({
      title: FAMILY_LABEL[family],
      cells: FOODS.filter((f) => f.family === family)
        .slice(0, 4)
        .map((f) => `${f.icon} ${f.name}`),
    })),
  })),
];

export const notions: Notion[] = [
  {
    id: 'qlm.vivant.origine-aliments',
    domain: 'qlm.vivant',
    title: 'D’où viennent nos aliments ?',
    grades: ['CE1'],
    competence: 'Connaître l’origine des aliments : animale, végétale ou minérale.',
    lesson: ORIGINE_LESSON,
  },
  {
    id: 'qlm.vivant.familles-aliments',
    domain: 'qlm.vivant',
    title: 'Les familles d’aliments',
    grades: ['CE1'],
    competence: 'Classer les aliments en familles.',
    lesson: FAMILLES_LESSON,
  },
];
