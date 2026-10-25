/** Mots qui ne sont pas des verbes : distracteurs des grilles « COLORIE les verbes ». */

export const NOUNS = [
  'piano',
  'histoire',
  'moment',
  'enfant',
  'jardin',
  'table',
  'crayon',
  'fenêtre',
  'voisin',
  'gâteau',
  'chaussette',
  'bonbon',
  'forêt',
  'vélo',
  'tableau',
  'pomme',
  'album',
  'ficelle',
  'neige',
  'nuage',
  'maison',
  'hérisson',
  'cadeau',
  'couleur',
  'ciseaux',
  'boîte',
  'montagne',
  'hibou',
  'tapis',
  'genou',
  'dessin',
  'école',
  'cerise',
  'soleil',
  'cartable',
  'bruit',
] as const;

export const ADVERBS = [
  'souvent',
  'vite',
  'ici',
  'jamais',
  'toujours',
  'lentement',
  'dehors',
  'devant',
  'tôt',
  'ensemble',
  'loin',
  'doucement',
  'parfois',
  'dessous',
] as const;

export const ADJECTIVES = [
  'joyeux',
  'petit',
  'froid',
  'rapide',
  'lourd',
  'léger',
  'gentil',
] as const;

export const DAYS_MONTHS = [
  'lundi',
  'mardi',
  'mercredi',
  'dimanche',
  'janvier',
  'février',
  'hiver',
  'matin',
  'soir',
] as const;

/**
 * Pièges : finissent en -er ou -ir comme un infinitif, mais ce ne sont pas des verbes.
 * (« hier » est aussi un indicateur de temps.)
 */
export const ER_TRAPS = [
  'janvier',
  'cahier',
  'escalier',
  'panier',
  'fermier',
  'boulanger',
  'premier',
  'léger',
  'rocher',
  'plaisir',
  'désir',
  'avenir',
  'hier',
] as const;
