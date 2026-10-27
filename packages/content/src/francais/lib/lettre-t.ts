/**
 * La lettre t (dictée 4 de la classe) : elle fait [t] (une carte), [s] devant -ion, -ie, -iel…
 * (la pollution, spatial), ou elle ne s'entend pas à la fin du mot (souvent, le sport).
 * Chaque mot n'a qu'une sorte de t : pas « petit » (un t qu'on entend, un t muet).
 */

export type TSound = 't' | 's' | 'muet';

export const T_WORDS: Record<TSound, readonly string[]> = {
  t: [
    'une carte',
    'l’histoire',
    'une tulipe',
    'une étoile',
    'le métro',
    'un taxi',
    'toucher',
    'monter',
    'le tennis',
    'un tiroir',
    'une tasse',
    'une tomate',
    'un tigre',
    'une tortue',
    'une guitare',
    'un cartable',
    'la porte',
    'un bateau',
    'un lutin',
    'un métier',
    'la moitié',
    'la matière',
    'la partie',
    'bâtir',
  ],
  s: [
    'spatial',
    'la pollution',
    'une punition',
    'une émotion',
    'une indication',
    'une option',
    'la patience',
    'un martien',
    'partiel',
    'minutieux',
    'une addition',
    'une opération',
    'la récréation',
    'une potion',
    'une portion',
    'une solution',
    'une position',
    'initial',
    'l’aviation',
  ],
  muet: [
    'souvent',
    'le climat',
    'devant',
    'le sport',
    'un chat',
    'le lit',
    'la nuit',
    'un fruit',
    'le chocolat',
    'un haricot',
    'le bout',
    'un abricot',
    'salut',
    'un mot',
    'un robot',
    'le lait',
    'un enfant',
    'différent',
    'avant',
    'un saut',
    'un achat',
    'le vent',
    'une dent',
    'un plat',
    'un éléphant',
  ],
};

export const T_LABEL: Record<TSound, string> = {
  t: 'je vois t, j’entends [t]',
  s: 'je vois t, j’entends [s]',
  muet: 'je vois t, je ne l’entends pas',
};

/** Trouver la lettre muette grâce à un mot de la même famille : sauter → un saut. */
export const T_FROM_VERB: readonly [string, string][] = [
  ['chanter', 'chant'],
  ['sauter', 'saut'],
  ['arrêter', 'arrêt'],
  ['acheter', 'achat'],
  ['débattre', 'débat'],
  ['ajouter', 'ajout'],
  ['tricoter', 'tricot'],
  ['regretter', 'regret'],
  ['écarter', 'écart'],
  ['transporter', 'transport'],
  ['rejeter', 'rejet'],
  ['reporter', 'report'],
];

/** Ou grâce au féminin : petite → petit. */
export const T_FROM_FEMININE: readonly [string, string][] = [
  ['petite', 'petit'],
  ['haute', 'haut'],
  ['forte', 'fort'],
  ['courte', 'court'],
  ['contente', 'content'],
  ['différente', 'différent'],
  ['verte', 'vert'],
  ['droite', 'droit'],
  ['prête', 'prêt'],
  ['lente', 'lent'],
  ['gratuite', 'gratuit'],
  ['parfaite', 'parfait'],
];
