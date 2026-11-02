import type { Domain, GradeId, LessonBlock, Notion } from '@app/core';
import { whole } from './lib/notes';

// La musique ne dépend pas de la classe : les notions sont ouvertes du CP au CM2.
const ALL: GradeId[] = ['CP', 'CE1', 'CE2', 'CM1', 'CM2'];

const TREBLE_LESSON: LessonBlock[] = [
  'Les notes s’écrivent sur une **portée** : **5 lignes** et **4 interlignes**. On compte les lignes **de bas en haut**.',
  'La **clé de sol** s’enroule autour de la **2e ligne** : la note de cette ligne s’appelle **sol**.',
  {
    kind: 'pictures',
    items: [
      {
        picture: { kind: 'staff', clef: 'treble', items: [whole(32)] },
        caption: 'sol, sur la 2e ligne',
      },
      {
        picture: {
          kind: 'staff',
          clef: 'treble',
          items: [28, 29, 30, 31, 32].map((d) => whole(d)),
        },
        caption: 'do, ré, mi, fa, sol',
      },
    ],
  },
  'Le **do du milieu** a sa petite ligne à lui, sous la portée. Ensuite, chaque note monte d’une marche : une fois **sur** une ligne, une fois **entre** deux lignes.',
];

const BASS_LESSON: LessonBlock[] = [
  'La **clé de fa** est pour les notes **graves** (la main gauche du piano). Ses deux points entourent la **4e ligne** : c’est le **fa**.',
  {
    kind: 'pictures',
    items: [
      {
        picture: { kind: 'staff', clef: 'bass', items: [whole(24)] },
        caption: 'fa, sur la 4e ligne',
      },
      {
        picture: { kind: 'staff', clef: 'bass', items: [28, 27, 26, 25, 24].map((d) => whole(d)) },
        caption: 'do, si, la, sol, fa',
      },
    ],
  },
  'Le **do du milieu** est au-dessus de la portée, sur sa petite ligne. Pour descendre, je dis les notes à l’envers : **do, si, la, sol, fa, mi, ré, do**.',
];

const GRAND_LESSON: LessonBlock[] = [
  'Au piano, on lit **deux portées** à la fois : la **clé de sol** en haut pour la **main droite**, la **clé de fa** en bas pour la **main gauche**.',
  {
    kind: 'pictures',
    items: [
      {
        picture: {
          kind: 'staff',
          clef: 'grand',
          items: [whole(28), { ...whole(28), low: true }],
        },
        caption: 'le même do du milieu, dans les deux clés',
      },
    ],
  },
];

const PLACE_LESSON: LessonBlock[] = [
  'Pour **écrire** une note, je pars d’une note que je connais (le **sol** de la clé de sol, le **fa** de la clé de fa) et je monte ou je descends **marche par marche** : ligne, interligne, ligne…',
  'Une même note revient **plus haut** (plus **aiguë**) ou **plus bas** (plus **grave**) : il y a un sol grave et un sol aigu.',
];

const COMPARE_LESSON: LessonBlock[] = [
  'Plus une note est **haut** sur la portée, plus elle est **aiguë**. Plus elle est **bas**, plus elle est **grave**.',
  'L’écart entre deux notes s’appelle un **intervalle**. Je compte les notes **en comptant les deux** : do → mi, c’est do, ré, mi : **3 notes**, une **tierce**.',
  {
    kind: 'list',
    items: [
      '2 notes : une **seconde** (do → ré)',
      '3 notes : une **tierce** (do → mi)',
      '4 notes : une **quarte** (do → fa)',
      '5 notes : une **quinte** (do → sol)',
      '8 notes : une **octave** (do → do aigu)',
    ],
  },
];

const PITCH_LESSON: LessonBlock[] = [
  'Un son **aigu** est fin, comme un petit oiseau 🐦. Un son **grave** est gros, comme un ours 🐻.',
  'J’écoute bien la **2e note** : est-elle **plus haute** (plus aiguë) ou **plus basse** (plus grave) que la 1re ?',
];

const MELODY_LESSON: LessonBlock[] = [
  'Une **mélodie** peut **monter** (de plus en plus aigu), **descendre** (de plus en plus grave), ou monter **puis** descendre.',
  {
    kind: 'pictures',
    items: [
      { picture: { kind: 'contour', steps: [0, 1, 2, 3] }, caption: 'ça monte' },
      { picture: { kind: 'contour', steps: [3, 2, 1, 0] }, caption: 'ça descend' },
      { picture: { kind: 'contour', steps: [0, 2, 3, 1] }, caption: 'ça monte puis ça descend' },
    ],
  },
];

const DICTATION_LESSON: LessonBlock[] = [
  'J’écoute la mélodie **plusieurs fois**. Pour chaque note : **monte**-t-elle ou **descend**-elle ? **Un peu** (la note voisine) ou **beaucoup** (un saut) ?',
  'Puis je cherche la portée qui **monte et descend pareil**.',
];

const PIANO_LESSON: LessonBlock[] = [
  'Les **touches noires** vont par **2** et par **3**. Le **do** est la touche blanche **juste à gauche des 2 touches noires**.',
  {
    kind: 'pictures',
    items: [
      {
        picture: { kind: 'keyboard', from: 60, to: 71, marks: [60], labels: true },
        caption: 'do, ré, mi, fa, sol, la, si',
      },
    ],
  },
  'Le **fa** est juste à gauche des **3 touches noires**. Une touche noire est un **dièse** ♯ (la touche à droite) ou un **bémol** ♭ (la touche à gauche).',
];

const VIOLIN_LESSON: LessonBlock[] = [
  'Le violon a **4 cordes**, de la plus grave à la plus aiguë : **sol, ré, la, mi**. Jouée sans doigt, la corde est **à vide**.',
  {
    kind: 'pictures',
    items: [
      { picture: { kind: 'violin' }, caption: 'sol, ré, la, mi' },
      {
        picture: { kind: 'staff', clef: 'treble', items: [25, 29, 33, 37].map((d) => whole(d)) },
        caption: 'les 4 cordes à vide',
      },
    ],
  },
  'Chaque doigt monte d’une note : sur la corde de **la**, le **1er doigt** joue **si**, le **2e** do, le **3e** ré. Le **4e doigt** joue la même note que la corde à vide suivante.',
];

const FIGURES_LESSON: LessonBlock[] = [
  'La forme de la note dit **combien de temps** elle dure.',
  {
    kind: 'pictures',
    items: [
      {
        picture: { kind: 'staff', clef: 'rhythm', items: [{ dur: 'w' }] },
        caption: 'ronde : 4 temps',
      },
      {
        picture: { kind: 'staff', clef: 'rhythm', items: [{ dur: 'h' }] },
        caption: 'blanche : 2 temps',
      },
      {
        picture: { kind: 'staff', clef: 'rhythm', items: [{ dur: 'q' }] },
        caption: 'noire : 1 temps',
      },
      {
        picture: { kind: 'staff', clef: 'rhythm', items: [{ dur: 'e', beam: true }, { dur: 'e' }] },
        caption: '2 croches : 1 temps',
      },
    ],
  },
  'Les **silences** aussi ont une durée : la **pause** (4 temps), la **demi-pause** (2 temps), le **soupir** (1 temps), le **demi-soupir**. Un **point** après une note ajoute **la moitié** de sa durée : blanche pointée = 3 temps.',
];

const BEATS_LESSON: LessonBlock[] = [
  'Pour compter les temps, j’**additionne** la durée de chaque note et de chaque silence.',
  {
    kind: 'pictures',
    items: [
      {
        picture: {
          kind: 'staff',
          clef: 'rhythm',
          time: 4,
          items: [{ dur: 'h' }, { dur: 'q' }, { dur: 'q', rest: true }, { bar: true }],
        },
        caption: 'blanche + noire + soupir = 2 + 1 + 1 = 4 temps',
      },
    ],
  },
  'Le chiffre au début (le **chiffrage**) dit combien de temps compte chaque **mesure**, entre deux barres.',
];

export const domains: Domain[] = [
  { id: 'musique.lecture', subject: 'musique', title: 'Lire les notes', icon: '🎼', order: 1 },
  { id: 'musique.ecoute', subject: 'musique', title: 'Écouter', icon: '👂', order: 2 },
  { id: 'musique.instruments', subject: 'musique', title: 'Mon instrument', icon: '🎹', order: 3 },
  { id: 'musique.rythme', subject: 'musique', title: 'Le rythme', icon: '🥁', order: 4 },
];

const notion = (
  id: string,
  domain: string,
  title: string,
  competence: string,
  lesson: LessonBlock[],
): Notion => ({ id, domain, title, grades: ALL, competence, lesson });

export const notions: Notion[] = [
  notion(
    'musique.lecture.cle-de-sol',
    'musique.lecture',
    'Lire les notes en clé de sol',
    'Nommer une note écrite en clé de sol.',
    TREBLE_LESSON,
  ),
  notion(
    'musique.lecture.cle-de-fa',
    'musique.lecture',
    'Lire les notes en clé de fa',
    'Nommer une note écrite en clé de fa.',
    BASS_LESSON,
  ),
  notion(
    'musique.lecture.deux-cles',
    'musique.lecture',
    'Lire dans les deux clés',
    'Lire une note en clé de sol ou en clé de fa, et sur deux portées (piano).',
    GRAND_LESSON,
  ),
  notion(
    'musique.lecture.placer',
    'musique.lecture',
    'Écrire une note sur la portée',
    'Placer une note à sa place sur la portée.',
    PLACE_LESSON,
  ),
  notion(
    'musique.lecture.reperer',
    'musique.lecture',
    'Comparer deux notes',
    'Repérer ligne et interligne, comparer deux notes, nommer un intervalle.',
    COMPARE_LESSON,
  ),
  notion(
    'musique.ecoute.grave-aigu',
    'musique.ecoute',
    'Grave ou aigu ?',
    'Dire si un son est plus grave ou plus aigu qu’un autre.',
    PITCH_LESSON,
  ),
  notion(
    'musique.ecoute.melodie',
    'musique.ecoute',
    'Ça monte ou ça descend ?',
    'Reconnaître si une mélodie monte ou descend.',
    MELODY_LESSON,
  ),
  notion(
    'musique.ecoute.dictee',
    'musique.ecoute',
    'Retrouver la mélodie écrite',
    'Reconnaître sur la portée une mélodie entendue.',
    DICTATION_LESSON,
  ),
  notion(
    'musique.instruments.piano',
    'musique.instruments',
    'Le clavier du piano',
    'Trouver sur le clavier la touche d’une note.',
    PIANO_LESSON,
  ),
  notion(
    'musique.instruments.violon',
    'musique.instruments',
    'Les cordes du violon',
    'Trouver la corde et le doigt d’une note au violon.',
    VIOLIN_LESSON,
  ),
  notion(
    'musique.rythme.figures',
    'musique.rythme',
    'Les figures de notes',
    'Nommer les figures de notes et les silences.',
    FIGURES_LESSON,
  ),
  notion(
    'musique.rythme.durees',
    'musique.rythme',
    'Compter les temps',
    'Compter les temps d’une suite de notes, compléter une mesure.',
    BEATS_LESSON,
  ),
];
