import type { FoodFamily } from './aliments';

export const FOOD_ROLES_NOTION = 'qlm.vivant.roles-aliments';
export const NUTRIENT_TABLE_NOTION = 'qlm.vivant.tableau-nutriments';

const GRAMS = { symbol: 'g', spoken: 'grammes' };
const MILLIGRAMS = { symbol: 'mg', spoken: 'milligrammes' };

export const NUTRIENTS = [
  { label: 'lipides', unit: GRAMS },
  { label: 'glucides', unit: GRAMS },
  { label: 'fibres', unit: GRAMS },
  { label: 'protéines', unit: GRAMS },
  { label: 'calcium', unit: MILLIGRAMS },
  { label: 'vitamine C', unit: MILLIGRAMS },
] as const;

export const FOOD_ROLES = [
  {
    id: 'batisseurs',
    label: 'Bâtisseurs',
    nutrients: ['protéines', 'calcium'],
    role: 'aident à grandir et à construire les muscles et les os',
  },
  {
    id: 'energetiques',
    label: 'Énergétiques',
    nutrients: ['glucides', 'lipides'],
    role: 'donnent de l’énergie pour les activités',
  },
  {
    id: 'protecteurs',
    label: 'Protecteurs',
    nutrients: ['vitamines', 'fibres'],
    role: 'aident le corps à bien fonctionner',
  },
];

/** Valeurs arrondies et illustratives pour comparer des portions de 100 g en CE1. */
export const NUTRIENT_FOODS = [
  { name: 'Pain blanc', family: 'feculents', values: [2, 49, 3, 9, 26, 0] },
  { name: 'Orange', family: 'fruits-legumes', values: [0, 8, 2, 1, 39, 44] },
  { name: 'Carotte', family: 'fruits-legumes', values: [0, 7, 3, 1, 25, 5] },
  { name: 'Poulet', family: 'viandes-poissons-oeufs', values: [4, 0, 0, 30, 12, 0] },
  { name: 'Yaourt nature', family: 'laitiers', values: [3, 5, 0, 4, 127, 0] },
  { name: 'Huile d’olive', family: 'matieres-grasses', values: [100, 0, 0, 0, 0, 0] },
] as const satisfies readonly {
  name: string;
  family: FoodFamily;
  values: readonly [number, number, number, number, number, number];
}[];
