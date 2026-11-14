import { conjugate, verbGroup, verbKind, type Person } from './conjugaison';
import { VERBS } from './verbes';

/**
 * CONJ 3 : « Le présent de l'indicatif des verbes du premier groupe ». Les verbes en -er,
 * leur radical (jouer → jou) et les terminaisons du présent (e, es, e, ons, ez, ent).
 */

export const PREMIER_GROUPE_NOTION = 'francais.conjugaison.premier-groupe';
export const RADICAL_NOTION = 'francais.conjugaison.radical-terminaison';
export const PRESENT_ER_NOTION = 'francais.conjugaison.present-er';

/** Les verbes des exemples de la leçon. */
export const LESSON_VERBS = ['jouer', 'sauter', 'préparer', 'donner', 'gagner', 'conjuguer'];

/**
 * Les verbes en -er dont le radical ne bouge pas : jouer → jou, je joue, nous jouons.
 * (Pas manger, lever, appeler, nettoyer : leur radical change.)
 */
export const REGULAR_ER: readonly string[] = [
  ...new Set([...LESSON_VERBS, ...VERBS.map((v) => v.inf)]),
].filter((inf) => verbGroup(inf) === 1 && verbKind(inf) === 'regular');

/** Les verbes en -ger et -cer : nous mangeons, nous commençons. */
export const SOFT_ER = VERBS.filter(
  (v) => /[cg]er$/.test(v.inf) && verbKind(v.inf) === 'spelling' && v.compl.length > 0,
);

/** Des verbes qui ne sont pas du 1er groupe (aller, en -er mais à part, n'y est pas). */
export const OTHER_VERBS = [
  'finir',
  'choisir',
  'grandir',
  'remplir',
  'prendre',
  'apprendre',
  'voir',
  'faire',
  'dire',
  'lire',
  'écrire',
  'dormir',
  'courir',
  'partir',
  'venir',
  'boire',
  'mettre',
  'attendre',
  'répondre',
  'vouloir',
  'pouvoir',
  'savoir',
  'être',
  'avoir',
];

export const radicalOf = (inf: string) => inf.slice(0, -2);

/** Les terminaisons du présent, de je à ils : e, es, e, ons, ez, ent. */
export const PRESENT_ENDINGS = ([0, 1, 2, 3, 4, 5] as const).map((p) =>
  conjugate('chanter', 'present', p).slice('chant'.length),
);

export const endingOf = (person: Person) => PRESENT_ENDINGS[person]!;

/** Les choix de terminaison, dans l'ordre de la leçon et sans doublon (e, es, ons, ez, ent). */
export const ENDING_CHOICES = [...new Set(PRESENT_ENDINGS)];
