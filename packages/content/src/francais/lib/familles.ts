/**
 * Familles de mots pour le CE1 : un mot de base et des mots fabriqués à partir de lui, qui
 * gardent une partie commune bien visible. Pas de pièges savants : les mots d'une famille
 * à l'autre ne se ressemblent pas, et aucun intrus n'est en réalité de la même famille.
 */
export interface WordFamily {
  base: string;
  words: readonly string[];
}

export const FAMILIES: readonly WordFamily[] = [
  { base: 'dent', words: ['dentiste', 'dentifrice', 'dentier'] },
  { base: 'nage', words: ['nager', 'nageur', 'nageuse', 'nageoire'] },
  { base: 'jour', words: ['journée', 'journal', 'bonjour'] },
  { base: 'terre', words: ['terrier', 'terrain', 'enterrer', 'atterrir'] },
  { base: 'faire', words: ['défaire', 'refaire'] },
  { base: 'fleur', words: ['fleuriste', 'fleurir', 'fleuri'] },
  { base: 'jardin', words: ['jardinier', 'jardiner', 'jardinage'] },
  { base: 'chant', words: ['chanter', 'chanteur', 'chanteuse'] },
  { base: 'dessin', words: ['dessiner', 'dessinateur'] },
  { base: 'dormir', words: ['dortoir', 'endormir', 'dormeur'] },
  { base: 'glace', words: ['glacier', 'glaçon', 'glacé'] },
  { base: 'poisson', words: ['poissonnier', 'poissonnerie'] },
  { base: 'école', words: ['écolier', 'écolière'] },
  { base: 'froid', words: ['refroidir', 'froideur'] },
  { base: 'grand', words: ['grandir', 'agrandir', 'grandeur'] },
  { base: 'long', words: ['longueur', 'allonger', 'rallonger'] },
  { base: 'rouge', words: ['rougir', 'rougeur'] },
  { base: 'blanc', words: ['blanchir', 'blancheur'] },
  { base: 'montagne', words: ['montagnard', 'montagneux'] },
  { base: 'fruit', words: ['fruitier', 'fruité'] },
  { base: 'peinture', words: ['peindre', 'peintre'] },
  { base: 'boulanger', words: ['boulangère', 'boulangerie'] },
];

/** Tous les mots d'une famille, le mot de base compris. */
export const familyWords = (f: WordFamily): string[] => [f.base, ...f.words];
