import type { PickColor } from '@app/core';

/**
 * La lettre e (ORTHO 8). Seule, elle fait [e] (le renard) ou elle est muette (la laitue) ;
 * é, er, ez font [é] ; è, ê, ë, et, ei font [è] ; avec d'autres lettres : eau [o], en/em [an],
 * eu/œu [eu], ein [in].
 */

export const E_NOTION = 'francais.orthographe.lettre-e';

export type ESound = 'e' | 'é' | 'è' | 'muet' | 'o' | 'an' | 'eu' | 'in';

export const E_COLORS: Record<ESound, PickColor> = {
  e: { id: 'e', label: '[e] en bleu', color: '#90caf9' },
  é: { id: 'é', label: '[é] en rouge', color: '#ef9a9a' },
  è: { id: 'è', label: '[è] en vert', color: '#a5d6a7' },
  muet: { id: 'muet', label: 'e muet en gris', color: '#e0e0e0' },
  o: { id: 'o', label: '[o] en marron', color: '#bcaaa4' },
  an: { id: 'an', label: '[an] en jaune', color: '#fff59d' },
  eu: { id: 'eu', label: '[eu] en violet', color: '#ce93d8' },
  in: { id: 'in', label: '[in] en orange', color: '#ffcc80' },
};

/**
 * Des mots où toutes les lettres e font le même son : pas de « la fête » ([è] et e muet), ni de
 * « un serpent » ([è] et [an]). Les déterminants n'ont pas de e, sauf « une » (e muet).
 */
export const E_WORDS: Record<ESound, readonly string[]> = {
  e: ['un renard', 'petit', 'un cheval', 'un melon', 'devant', 'un genou', 'demain', 'venir'],
  é: ['un marché', 'chez', 'chanter', 'un vélo', 'un bébé', 'un café', 'un nez', 'un panier'],
  è: ['un robinet', 'Noël', 'un jouet', 'un poulet', 'un bonnet', 'un volet', 'un carnet'],
  muet: ['la laitue', 'une amie', 'la pluie', 'la vie', 'une roue', 'la joue', 'la rue'],
  o: ['beau', 'un bateau', 'un gâteau', 'un chapeau', 'un oiseau', 'un seau', 'un cadeau'],
  an: ['lent', 'un enfant', 'du vent', 'la dent', 'souvent', 'pendant', 'un parent', 'content'],
  eu: ['du feu', 'un œuf', 'un jeu', 'bleu', 'deux', 'un pneu', 'un nœud', 'heureux'],
  in: ['plein', 'un frein', 'un rein', 'un teint'],
};
