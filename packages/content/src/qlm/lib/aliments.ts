/**
 * Les aliments de la leçon de sciences (SCI 2) : d'où ils viennent, leur origine et leur
 * famille. Un renseignement absent (undefined) veut dire « pas net » : l'aliment n'est alors
 * pas proposé pour cette question (le chocolat n'a pas d'origine simple, le pain ne vient pas
 * directement d'un champ).
 */
export type Origin = 'animale' | 'vegetale' | 'minerale';
export type Source = 'agriculture' | 'elevage' | 'peche';
export type FoodFamily =
  | 'feculents'
  | 'fruits-legumes'
  | 'laitiers'
  | 'viandes-poissons-oeufs'
  | 'matieres-grasses'
  | 'sucres';

export interface Food {
  name: string;
  icon: string;
  origin?: Origin;
  source?: Source;
  family?: FoodFamily;
  transformed: boolean;
}

export const FOODS: readonly Food[] = [
  // Féculents
  { name: 'le pain', icon: '🥖', origin: 'vegetale', family: 'feculents', transformed: true },
  { name: 'les pâtes', icon: '🍝', origin: 'vegetale', family: 'feculents', transformed: true },
  {
    name: 'le riz',
    icon: '🍚',
    origin: 'vegetale',
    source: 'agriculture',
    family: 'feculents',
    transformed: false,
  },
  {
    name: 'les pommes de terre',
    icon: '🥔',
    origin: 'vegetale',
    source: 'agriculture',
    family: 'feculents',
    transformed: false,
  },
  { name: 'le blé', icon: '🌾', origin: 'vegetale', source: 'agriculture', transformed: false },
  // Fruits et légumes
  ...(
    [
      ['la pomme', '🍎'],
      ['la banane', '🍌'],
      ['la carotte', '🥕'],
      ['la tomate', '🍅'],
      ['le brocoli', '🥦'],
      ['la salade', '🥬'],
      ['le raisin', '🍇'],
      ['la poire', '🍐'],
      ['les cerises', '🍒'],
      ['la fraise', '🍓'],
    ] as const
  ).map(([name, icon]): Food => ({
    name,
    icon,
    origin: 'vegetale',
    source: 'agriculture',
    family: 'fruits-legumes',
    transformed: false,
  })),
  // Produits laitiers
  {
    name: 'le lait',
    icon: '🥛',
    origin: 'animale',
    source: 'elevage',
    family: 'laitiers',
    transformed: false,
  },
  { name: 'le fromage', icon: '🧀', origin: 'animale', family: 'laitiers', transformed: true },
  // Viandes, poissons, œufs
  {
    name: 'les œufs',
    icon: '🥚',
    origin: 'animale',
    source: 'elevage',
    family: 'viandes-poissons-oeufs',
    transformed: false,
  },
  {
    name: 'le poulet',
    icon: '🍗',
    origin: 'animale',
    source: 'elevage',
    family: 'viandes-poissons-oeufs',
    transformed: false,
  },
  {
    name: 'le steak',
    icon: '🥩',
    origin: 'animale',
    source: 'elevage',
    family: 'viandes-poissons-oeufs',
    transformed: false,
  },
  {
    name: 'le poisson',
    icon: '🐟',
    origin: 'animale',
    source: 'peche',
    family: 'viandes-poissons-oeufs',
    transformed: false,
  },
  {
    name: 'les crevettes',
    icon: '🦐',
    origin: 'animale',
    source: 'peche',
    family: 'viandes-poissons-oeufs',
    transformed: false,
  },
  {
    name: 'le crabe',
    icon: '🦀',
    origin: 'animale',
    source: 'peche',
    family: 'viandes-poissons-oeufs',
    transformed: false,
  },
  // Matières grasses
  {
    name: 'le beurre',
    icon: '🧈',
    origin: 'animale',
    family: 'matieres-grasses',
    transformed: true,
  },
  {
    name: 'l’huile d’olive',
    icon: '🫒',
    origin: 'vegetale',
    family: 'matieres-grasses',
    transformed: true,
  },
  // Produits sucrés
  { name: 'les bonbons', icon: '🍬', family: 'sucres', transformed: true },
  { name: 'le chocolat', icon: '🍫', family: 'sucres', transformed: true },
  { name: 'la sucette', icon: '🍭', family: 'sucres', transformed: true },
  { name: 'le gâteau', icon: '🍰', family: 'sucres', transformed: true },
  { name: 'le miel', icon: '🍯', origin: 'animale', family: 'sucres', transformed: false },
  // Origine minérale
  { name: 'l’eau', icon: '💧', origin: 'minerale', transformed: false },
  { name: 'le sel', icon: '🧂', origin: 'minerale', transformed: false },
  // Plats transformés
  { name: 'la pizza', icon: '🍕', transformed: true },
  { name: 'les frites', icon: '🍟', transformed: true },
];

export const ORIGIN_LABEL: Record<Origin, string> = {
  animale: 'origine animale',
  vegetale: 'origine végétale',
  minerale: 'origine minérale',
};

export const SOURCE_LABEL: Record<Source, string> = {
  agriculture: 'l’agriculture',
  elevage: 'l’élevage',
  peche: 'la pêche',
};

/** Les 6 familles, dans l'ordre de la fiche de l'école. */
export const FOOD_FAMILIES: readonly FoodFamily[] = [
  'feculents',
  'fruits-legumes',
  'laitiers',
  'viandes-poissons-oeufs',
  'matieres-grasses',
  'sucres',
];

export const FAMILY_LABEL: Record<FoodFamily, string> = {
  feculents: 'féculents',
  'fruits-legumes': 'fruits et légumes',
  laitiers: 'produits laitiers',
  'viandes-poissons-oeufs': 'viandes, poissons, œufs',
  'matieres-grasses': 'matières grasses',
  sucres: 'produits sucrés',
};

/** « Le fromage », « L’eau » : le nom en début de phrase. */
export const capitalized = (name: string) => name[0]!.toUpperCase() + name.slice(1);
