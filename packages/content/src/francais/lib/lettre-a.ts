import type { PickColor } from '@app/core';

/**
 * La lettre a (ORTHO 7 et dictée 7 de la classe). Seule, elle fait [a] (un cartable), avec un
 * accent aussi (un âne, déjà). Avec d'autres lettres, elle fait d'autres sons : au/eau [o],
 * ai [è], ail/aille [aj], an/am [an], ain/aim [in].
 */

export const A_NOTION = 'francais.orthographe.lettre-a';
export const DICTEE_7_NOTION = 'francais.orthographe.dictee-7';

/** Les cases de la fiche ORTHO 7 ; les premiers mots de chaque case sont ceux de la fiche. */
export const A_LESSON_GROUPS = [
  { label: 'a [a]', words: ['un cartable', 'la classe', 'marcher'] },
  { label: 'â [a]', words: ['un mât', 'un âne', 'âgé'] },
  { label: 'à [a]', words: ['à', 'déjà', 'là'] },
  { label: 'au, eau [o]', words: ['un préau', 'aussi', 'un agneau'] },
  { label: 'ai [è]', words: ['aimer', 'du lait', 'une maison'] },
  { label: 'ail, aille [aj]', words: ['un portail', 'du travail', 'une bataille'] },
  { label: 'an, am [an]', words: ['manger', 'blanc', 'une ampoule'] },
  { label: 'ain, aim [in]', words: ['du pain', 'une main', 'la faim'] },
];

export type ASound = 'a' | 'o' | 'e' | 'aj' | 'in' | 'an';

/** Le code couleur de la fiche de dictée : [a] bleu, [o] rouge, [è] vert, [aj] marron… */
export const A_COLORS: Record<ASound, PickColor> = {
  a: { id: 'a', label: '[a] en bleu', color: '#90caf9' },
  o: { id: 'o', label: '[o] en rouge', color: '#ef9a9a' },
  e: { id: 'e', label: '[è] en vert', color: '#a5d6a7' },
  aj: { id: 'aj', label: '[aj] en marron', color: '#bcaaa4' },
  in: { id: 'in', label: '[in] en orange', color: '#ffcc80' },
  an: { id: 'an', label: '[an] en jaune', color: '#fff59d' },
};

/**
 * Des mots où la lettre a ne fait qu'un seul son : pas de « chapeau » ([a] et [o]), ni de
 * « maman » ([a] et [an]). Les premiers sont ceux de l'exercice de la classe.
 */
export const A_WORDS: Record<ASound, readonly string[]> = {
  a: [
    'le lama',
    'un âne',
    'déjà',
    'un sac',
    'la gare',
    'un lac',
    'une tasse',
    'une carte',
    'un rat',
  ],
  o: ['haut', 'chaud', 'un auteur', 'un préau', 'aussi', 'un seau', 'la peau', 'un veau', 'jaune'],
  e: ['la baie', 'l’air', 'du lait', 'une maison', 'une chaise', 'une fraise', 'vrai', 'une craie'],
  aj: ['une maille', 'un bail', 'un portail', 'du travail', 'un rail', 'une paille', 'un détail'],
  in: ['du pain', 'du grain', 'une main', 'la faim', 'demain', 'un bain', 'un train', 'un copain'],
  an: ['un flan', 'grand', 'blanc', 'une lampe', 'un gant', 'un banc', 'une jambe', 'une branche'],
};
