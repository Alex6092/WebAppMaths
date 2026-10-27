import type { Rng } from '@app/core';

/**
 * Le singulier et le pluriel des noms : on ajoute un s ; un x après -eau, -au, -eu ; les mots
 * en s, x, z ne changent pas ; -al devient -aux, et sept mots en -ou prennent un x.
 */

export type PluralRule = 's' | 'x' | 'same' | 'aux' | 'oux';

export interface PluralNoun {
  sing: string;
  plur: string;
  f: boolean;
  rule: PluralRule;
  icon?: string;
}

const make =
  (rule: PluralRule, plural: (s: string) => string) =>
  (sing: string, f: boolean, icon?: string): PluralNoun => ({
    sing,
    plur: plural(sing),
    f,
    rule,
    ...(icon ? { icon } : {}),
  });
const s = make('s', (w) => `${w}s`);
const x = make('x', (w) => `${w}x`);
const same = make('same', (w) => w);
const aux = make('aux', (w) => w.replace(/al$/, 'aux'));
const oux = make('oux', (w) => `${w}x`);

export const PLURAL_NOUNS: readonly PluralNoun[] = [
  s('chat', false, '🐱'),
  s('chien', false, '🐶'),
  s('fleur', true, '🌸'),
  s('pomme', true, '🍎'),
  s('livre', false, '📕'),
  s('ballon', false, '🎈'),
  s('voiture', true, '🚗'),
  s('maison', true, '🏠'),
  s('crayon', false, '✏️'),
  s('étoile', true, '⭐'),
  s('arbre', false, '🌳'),
  s('poule', true, '🐔'),
  s('lapin', false, '🐰'),
  s('vélo', false, '🚲'),
  s('robe', true, '👗'),
  s('banane', true, '🍌'),
  s('cerise', true, '🍒'),
  s('train', false, '🚂'),
  s('poisson', false, '🐟'),
  s('table', true),
  s('porte', true),
  s('école', true),
  s('sac', false),
  s('clou', false),
  s('trou', false),
  s('kangourou', false, '🦘'),
  x('gâteau', false, '🎂'),
  x('bateau', false, '⛵'),
  x('chapeau', false, '🎩'),
  x('château', false, '🏰'),
  x('oiseau', false, '🐦'),
  x('cadeau', false, '🎁'),
  x('drapeau', false, '🚩'),
  x('manteau', false, '🧥'),
  x('seau', false),
  x('tuyau', false),
  x('jeu', false, '🎲'),
  x('feu', false, '🔥'),
  x('cheveu', false),
  same('souris', true, '🐭'),
  same('nez', false, '👃'),
  same('noix', true),
  same('tapis', false),
  same('bras', false),
  same('croix', true),
  same('radis', false),
  same('ours', false, '🐻'),
  same('bus', false, '🚌'),
  same('voix', true),
  aux('cheval', false, '🐴'),
  aux('journal', false, '📰'),
  aux('animal', false),
  aux('hôpital', false, '🏥'),
  aux('bocal', false),
  oux('bijou', false, '💍'),
  oux('caillou', false),
  oux('chou', false, '🥬'),
  oux('genou', false),
  oux('hibou', false, '🦉'),
  oux('joujou', false),
  oux('pou', false),
];

export const nounsOf = (rules: readonly PluralRule[]) =>
  PLURAL_NOUNS.filter((n) => rules.includes(n.rule));

/** Pourquoi le pluriel s'écrit ainsi. */
export const RULE_TEXT: Record<PluralRule, string> = {
  s: 'Au pluriel, on ajoute un **s**.',
  x: 'Les mots en -eau, -au et -eu prennent un **x** au pluriel.',
  same: 'Les mots qui finissent par s, x ou z **ne changent pas** au pluriel.',
  aux: 'Les mots en -al font leur pluriel en **-aux**.',
  oux: 'Bijou, caillou, chou, genou, hibou, joujou et pou prennent un **x** au pluriel.',
};

const vowel = (w: string) => /^[aeiouyàâéèêîôûh]/i.test(w);

/** Les petits mots devant le nom : un seul, ou plusieurs. next : le mot qui suit (un adjectif). */
export function determiner(rng: Rng, noun: PluralNoun, plural: boolean, next = noun.sing): string {
  if (plural) return rng.pick(['des', 'les', 'mes', 'deux', 'trois']);
  const options = noun.f ? ['une', 'la', 'ma'] : ['un', 'le', 'mon'];
  const det = rng.pick(options);
  if (vowel(next) && (det === 'le' || det === 'la')) return 'l’';
  if (vowel(next) && det === 'ma') return 'mon';
  return det;
}

/** « un chat », « l’école », « des souris » */
export const group = (det: string, word: string) =>
  det.endsWith('’') ? `${det}${word}` : `${det} ${word}`;

/** Des adjectifs de couleur (après le nom) et de taille (avant), au masculin et au féminin. */
export interface Adjective {
  m: string;
  f: string;
  before: boolean;
}
const adj = (m: string, f: string, before = false): Adjective => ({ m, f, before });
export const ADJECTIVES: readonly Adjective[] = [
  adj('noir', 'noire'),
  adj('vert', 'verte'),
  adj('bleu', 'bleue'),
  adj('rouge', 'rouge'),
  adj('jaune', 'jaune'),
  adj('petit', 'petite', true),
  adj('grand', 'grande', true),
  adj('joli', 'jolie', true),
];
