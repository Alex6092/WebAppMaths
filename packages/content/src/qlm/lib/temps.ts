import { MONTHS, WEEKDAYS } from '@app/core';

/** Les jours et les mois, dans l'ordre (le lundi d'abord, comme à l'école). */
export const DAYS: readonly string[] = WEEKDAYS;
export { MONTHS };

export type Season = 'printemps' | 'ete' | 'automne' | 'hiver';

export const SEASONS: readonly Season[] = ['printemps', 'ete', 'automne', 'hiver'];

export const SEASON_LABEL: Record<Season, string> = {
  printemps: 'le printemps',
  ete: 'l’été',
  automne: 'l’automne',
  hiver: 'l’hiver',
};

/** « au printemps », « en été » */
export const SEASON_IN: Record<Season, string> = {
  printemps: 'au printemps',
  ete: 'en été',
  automne: 'en automne',
  hiver: 'en hiver',
};

/** « un mois d’été » */
export const SEASON_OF: Record<Season, string> = {
  printemps: 'de printemps',
  ete: 'd’été',
  automne: 'd’automne',
  hiver: 'd’hiver',
};

export const SEASON_ICON: Record<Season, string> = {
  printemps: '🌸',
  ete: '☀️',
  automne: '🍂',
  hiver: '⛄',
};

export const SEASON_COLOR: Record<Season, string> = {
  printemps: '#e8f5e9',
  ete: '#fff8e1',
  automne: '#fbe9e7',
  hiver: '#e3f2fd',
};

/**
 * La saison de chaque mois (1 à 12), seulement pour les mois tout entiers dans une saison :
 * mars, juin, septembre et décembre en ont deux (elle change le 21).
 */
export const MONTH_SEASON: Partial<Record<number, Season>> = {
  1: 'hiver',
  2: 'hiver',
  4: 'printemps',
  5: 'printemps',
  7: 'ete',
  8: 'ete',
  10: 'automne',
  11: 'automne',
};

/** Ce qu'on voit ou ce qu'on fait à chaque saison, pour les ranger. */
export const SEASON_SCENES: Record<Season, { text: string; icon: string }[]> = {
  printemps: [
    { text: 'les arbres en fleurs', icon: '🌸' },
    { text: 'les tulipes', icon: '🌷' },
    { text: 'les œufs de Pâques', icon: '🐣' },
    { text: 'les bourgeons', icon: '🌱' },
  ],
  ete: [
    { text: 'la plage', icon: '🏖️' },
    { text: 'la baignade', icon: '🏊' },
    { text: 'les tournesols', icon: '🌻' },
    { text: 'la pastèque', icon: '🍉' },
  ],
  automne: [
    { text: 'les feuilles mortes', icon: '🍂' },
    { text: 'les champignons', icon: '🍄' },
    { text: 'les châtaignes', icon: '🌰' },
    { text: 'la rentrée des classes', icon: '🎒' },
  ],
  hiver: [
    { text: 'le bonhomme de neige', icon: '⛄' },
    { text: 'la luge', icon: '🛷' },
    { text: 'les flocons', icon: '❄️' },
    { text: 'le sapin de Noël', icon: '🎄' },
  ],
};

/** Des moments rangés dans l'ordre : la journée, la vie, une histoire. */
export interface Sequence {
  /** « les moments de la journée » */
  title: string;
  steps: string[];
}

export const DAY_MOMENTS: Sequence = {
  title: 'les moments de la journée',
  steps: ['🌅 le matin', '🍽️ le midi', '🏫 l’après-midi', '🌇 le soir', '🌙 la nuit'],
};

export const LIFE_STAGES: Sequence = {
  title: 'les âges de la vie',
  steps: ['👶 le bébé', '🧒 l’enfant', '🧑 l’adolescent', '👨 l’adulte', '👴 la personne âgée'],
};

export const STORIES: Sequence[] = [
  {
    title: 'le matin d’école',
    steps: [
      '⏰ Je me réveille.',
      '🥣 Je prends mon petit déjeuner.',
      '🪥 Je me brosse les dents.',
      '🎒 Je pars à l’école.',
    ],
  },
  {
    title: 'le gâteau',
    steps: [
      '🛒 J’achète les ingrédients.',
      '🥣 Je mélange la pâte.',
      '🔥 Je fais cuire le gâteau.',
      '🍰 Je mange le gâteau.',
    ],
  },
  {
    title: 'la plante',
    steps: [
      '🫘 Je plante une graine.',
      '💧 J’arrose la terre.',
      '🌱 Une pousse sort de la terre.',
      '🌼 La plante fleurit.',
    ],
  },
  {
    title: 'le bonhomme de neige',
    steps: [
      '❄️ La neige tombe.',
      '🧤 Je mets mes gants.',
      '⛄ Je fais un bonhomme de neige.',
      '☀️ Le soleil le fait fondre.',
    ],
  },
  {
    title: 'le soir',
    steps: [
      '🍲 Je dîne.',
      '🛁 Je prends mon bain.',
      '📖 J’écoute une histoire.',
      '😴 Je m’endors.',
    ],
  },
];

/** Le mot avec sa majuscule, en tête de phrase. */
export const capitalized = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Ajoute n à i, en faisant le tour (après dimanche vient lundi). */
export const around = (i: number, n: number, length: number) =>
  (((i + n) % length) + length) % length;
