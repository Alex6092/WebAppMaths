/**
 * La lettre d (ORTHO 5 et dictée 5 de la classe) : elle fait [d] (un dragon, un cadeau, le sud),
 * se double parfois (une addition), ou ne s'entend pas à la fin du mot (un lézard, grand, froid).
 * Chaque mot n'a qu'une sorte de d : pas « grande » ni « dedans » côté muet.
 */

export type DSound = 'd' | 'muet';

export const D_WORDS: Record<DSound, readonly string[]> = {
  d: [
    'un dragon',
    'demain',
    'donner',
    'un cadeau',
    'grandir',
    'malade',
    'le sud',
    'un plaid',
    'une addition',
    'un drapeau',
    'une légende',
    'décider',
    'un dauphin',
    'dimanche',
    'un domino',
    'la salade',
    'un radis',
    'un dinosaure',
    'une idée',
    'raide',
    'une ronde',
    'le docteur',
    'un dé',
    'une limonade',
  ],
  muet: [
    'un lézard',
    'un pied',
    'grand',
    'froid',
    'le nord',
    'un fjord',
    'chaud',
    'rond',
    'profond',
    'bavard',
    'un renard',
    'un regard',
    'le bord',
    'un canard',
    'un retard',
    'un nid',
    'lourd',
    'gourmand',
    'un marchand',
    'blond',
    'un brouillard',
    'un épinard',
    'le foulard',
    'un accord',
  ],
};

export const D_LABEL: Record<DSound, string> = {
  d: 'je vois d, j’entends [d]',
  muet: 'je vois d, je ne l’entends pas',
};

/** Un adjectif au masculin et au féminin : au féminin, on entend le d. */
export const D_FEMININE: readonly [string, string][] = [
  ['froid', 'froide'],
  ['blond', 'blonde'],
  ['chaud', 'chaude'],
  ['lourd', 'lourde'],
  ['laid', 'laide'],
  ['rond', 'ronde'],
  ['grand', 'grande'],
  ['profond', 'profonde'],
  ['bavard', 'bavarde'],
  ['gourmand', 'gourmande'],
  ['allemand', 'allemande'],
  ['sourd', 'sourde'],
];

/**
 * Trouver la lettre muette grâce à un mot de la même famille, où on l'entend : bavarder → bavard.
 * [mot qui fait entendre le d, déterminant du mot à trouver (vide pour un adjectif), mot à trouver]
 */
export const D_FROM_FAMILY: readonly [string, string, string][] = [
  ['bavarder', '', 'bavard'],
  ['regarder', 'un', 'regard'],
  ['retarder', 'un', 'retard'],
  ['border', 'le', 'bord'],
  ['accorder', 'un', 'accord'],
  ['refroidir', 'il fait', 'froid'],
  ['agrandir', 'il est', 'grand'],
  ['arrondir', 'il est', 'rond'],
  ['alourdir', 'il est', 'lourd'],
  ['approfondir', 'il est', 'profond'],
  ['renarde', 'un', 'renard'],
];

/**
 * « COMPLÈTE avec t ou d » : le mot avec un trou « _ », la lettre qui manque, et l'endroit du trou.
 * À la fin du mot, la lettre est muette : le féminin ou un mot de la famille la fait entendre.
 */
export interface TOrD {
  word: string;
  letter: 't' | 'd';
  end: boolean;
  /** À la fin : le mot qui fait entendre la lettre (« profonde ») ; aucun s'il faut l'apprendre. */
  clue?: string;
}

const heard = (word: string, letter: 't' | 'd'): TOrD => ({ word, letter, end: false });
const silent = (word: string, letter: 't' | 'd', clue?: string): TOrD => ({
  word,
  letter,
  end: true,
  ...(clue ? { clue } : {}),
});

export const T_OR_D: readonly TOrD[] = [
  heard('la _omate', 't'),
  heard('_imanche', 'd'),
  heard('un a_ulte', 'd'),
  heard('du pé_role', 't'),
  heard('une _ortue', 't'),
  heard('le den_iste', 't'),
  heard('un _auphin', 'd'),
  heard('sou_ain', 'd'),
  heard('une par_ie', 't'),
  heard('un _ragon', 'd'),
  heard('un ca_eau', 'd'),
  heard('une _ulipe', 't'),
  heard('un _igre', 't'),
  heard('la mala_ie', 'd'),
  heard('un _omino', 'd'),
  heard('une é_oile', 't'),
  heard('la sala_e', 'd'),
  heard('une gui_are', 't'),
  heard('un _rain', 't'),
  heard('un ra_is', 'd'),
  heard('un _inosaure', 'd'),
  heard('un bâ_on', 't'),
  silent('peti_', 't', 'petite'),
  silent('d’abor_', 'd'),
  silent('souven_', 't'),
  silent('profon_', 'd', 'profonde'),
  silent('chau_', 'd', 'chaude'),
  silent('gran_', 'd', 'grande'),
  silent('for_', 't', 'forte'),
  silent('ron_', 'd', 'ronde'),
  silent('un chan_', 't', 'chanter'),
  silent('un bavar_', 'd', 'bavarder'),
  silent('un sau_', 't', 'sauter'),
  silent('le regar_', 'd', 'regarder'),
  silent('froi_', 'd', 'froide'),
  silent('hau_', 't', 'haute'),
  silent('blon_', 'd', 'blonde'),
  silent('ver_', 't', 'verte'),
];
