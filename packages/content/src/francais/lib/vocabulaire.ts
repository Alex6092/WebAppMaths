/**
 * Vocabulaire du CE1 : synonymes (des mots qui veulent dire presque la même chose) et contraires
 * (des mots de sens opposé), rangés par nature pour que les pièges soient du même genre.
 */

export type Nature = 'nom' | 'adjectif' | 'verbe' | 'mot';

export interface WordPair {
  a: string;
  b: string;
  nature: Nature;
}

const pairs = (nature: Nature, list: [string, string][]): WordPair[] =>
  list.map(([a, b]) => ({ a, b, nature }));

export const SYNONYMS: readonly WordPair[] = [
  ...pairs('adjectif', [
    ['content', 'heureux'],
    ['joli', 'beau'],
    ['triste', 'malheureux'],
    ['gentil', 'aimable'],
    ['fatigué', 'épuisé'],
    ['malade', 'souffrant'],
    ['bizarre', 'étrange'],
    ['rapide', 'vif'],
    ['petit', 'minuscule'],
    ['grand', 'immense'],
    ['effrayé', 'apeuré'],
    ['mince', 'fin'],
  ]),
  ...pairs('nom', [
    ['voiture', 'auto'],
    ['vélo', 'bicyclette'],
    ['bateau', 'navire'],
    ['ami', 'copain'],
    ['chemin', 'sentier'],
    ['bruit', 'vacarme'],
    ['cadeau', 'présent'],
    ['peur', 'frayeur'],
    ['maison', 'habitation'],
  ]),
  ...pairs('verbe', [
    ['commencer', 'débuter'],
    ['finir', 'terminer'],
    ['crier', 'hurler'],
    ['regarder', 'observer'],
    ['casser', 'briser'],
    ['jeter', 'lancer'],
    ['briller', 'scintiller'],
    ['parler', 'bavarder'],
    ['manger', 'dévorer'],
  ]),
];

export const CONTRARIES: readonly WordPair[] = [
  ...pairs('adjectif', [
    ['grand', 'petit'],
    ['chaud', 'froid'],
    ['gentil', 'méchant'],
    ['plein', 'vide'],
    ['rapide', 'lent'],
    ['jeune', 'vieux'],
    ['propre', 'sale'],
    ['léger', 'lourd'],
    ['long', 'court'],
    ['dur', 'mou'],
    ['content', 'triste'],
    ['facile', 'difficile'],
    ['riche', 'pauvre'],
    ['mouillé', 'sec'],
    ['beau', 'laid'],
    ['ouvert', 'fermé'],
  ]),
  ...pairs('nom', [
    ['jour', 'nuit'],
    ['début', 'fin'],
    ['matin', 'soir'],
    ['été', 'hiver'],
  ]),
  ...pairs('verbe', [
    ['ouvrir', 'fermer'],
    ['monter', 'descendre'],
    ['gagner', 'perdre'],
    ['entrer', 'sortir'],
    ['allumer', 'éteindre'],
    ['rire', 'pleurer'],
    ['aimer', 'détester'],
    ['donner', 'prendre'],
    ['arriver', 'partir'],
  ]),
  ...pairs('mot', [
    ['haut', 'bas'],
    ['avant', 'après'],
    ['devant', 'derrière'],
    ['dessus', 'dessous'],
    ['toujours', 'jamais'],
    ['dedans', 'dehors'],
  ]),
];

/** Les contraires qu'on fait en ajoutant un petit mot devant (in-, im-, dé-, mal-, mé-). */
export const PREFIXED: readonly { word: string; prefix: string }[] = [
  { word: 'possible', prefix: 'im' },
  { word: 'patient', prefix: 'im' },
  { word: 'poli', prefix: 'im' },
  { word: 'visible', prefix: 'in' },
  { word: 'connu', prefix: 'in' },
  { word: 'utile', prefix: 'in' },
  { word: 'faire', prefix: 'dé' },
  { word: 'coller', prefix: 'dé' },
  { word: 'boucher', prefix: 'dé' },
  { word: 'plier', prefix: 'dé' },
  { word: 'heureux', prefix: 'mal' },
  { word: 'propre', prefix: 'mal' },
  { word: 'adroit', prefix: 'mal' },
  { word: 'content', prefix: 'mé' },
];
export const PREFIXES = ['in', 'im', 'dé', 'mal', 'mé'];

/** Le partenaire d'un mot dans sa paire. */
export const partner = (pair: WordPair, word: string) => (pair.a === word ? pair.b : pair.a);

/** Des mots pour ranger par ordre alphabétique : un par première lettre si possible. */
export const ALPHABET_WORDS: readonly string[] = [
  'abeille',
  'ami',
  'arbre',
  'avion',
  'balle',
  'banane',
  'bateau',
  'bébé',
  'bille',
  'bol',
  'cadeau',
  'camion',
  'chat',
  'cheval',
  'citron',
  'cochon',
  'dauphin',
  'dent',
  'dragon',
  'école',
  'étoile',
  'éléphant',
  'fée',
  'fleur',
  'forêt',
  'fusée',
  'gâteau',
  'girafe',
  'gomme',
  'hibou',
  'herbe',
  'île',
  'igloo',
  'jardin',
  'jouet',
  'judo',
  'kiwi',
  'koala',
  'lapin',
  'lion',
  'loup',
  'lune',
  'maison',
  'marteau',
  'mouton',
  'nez',
  'nid',
  'nuage',
  'orange',
  'ours',
  'oiseau',
  'pain',
  'papillon',
  'pomme',
  'poule',
  'quai',
  'radis',
  'renard',
  'robot',
  'roue',
  'sapin',
  'serpent',
  'soleil',
  'souris',
  'table',
  'tigre',
  'tortue',
  'train',
  'usine',
  'vache',
  'vélo',
  'voiture',
  'wagon',
  'yaourt',
  'zèbre',
  'zoo',
];

/** L'ordre du dictionnaire : sans tenir compte des accents (é se range avec e). */
export const alphabetical = (a: string, b: string) =>
  a.localeCompare(b, 'fr', { sensitivity: 'base' });

/** Le nombre de lettres communes au début de deux mots. */
export const commonStart = (a: string, b: string) => {
  const bare = (w: string) => w.normalize('NFD').replace(/\p{M}/gu, '');
  const [x, y] = [bare(a), bare(b)];
  let n = 0;
  while (n < x.length && x[n] === y[n]) n++;
  return n;
};
