import type { Domain, LessonBlock, Notion } from '@app/core';
import { MOMENT_LABEL, MOMENTS } from './lib/conjugaison';
import { MOMENT_COLOR, PINK } from './lib/couleurs';
import { indicatorsOf } from './lib/indicateurs';

export const domains: Domain[] = [
  { id: 'francais.conjugaison', subject: 'francais', title: 'Conjugaison', icon: '⏳', order: 1 },
  { id: 'francais.grammaire', subject: 'francais', title: 'Grammaire', icon: '🧱', order: 2 },
  { id: 'francais.orthographe', subject: 'francais', title: 'Orthographe', icon: '✏️', order: 3 },
  { id: 'francais.vocabulaire', subject: 'francais', title: 'Vocabulaire', icon: '📚', order: 4 },
  { id: 'francais.lecture', subject: 'francais', title: 'Lecture', icon: '👀', order: 5 },
];

// CONJ 1 : le verbe, forme infinitive et conjuguée.
const CONJ1_LESSON: LessonBlock[] = [
  'Le **verbe à l’infinitif** est le verbe « tout seul », comme dans le dictionnaire. On peut dire « il faut… » devant lui : il faut *chanter*.',
  'Le **verbe conjugué** change selon la personne et le moment. Devant lui, il y a une personne : je, tu, il, Léa, les enfants…',
  {
    kind: 'table',
    columns: [
      { title: 'à l’infinitif', color: PINK[0]!.color, cells: ['chanter', 'finir', 'prendre'] },
      { title: 'conjugué', cells: ['je chante', 'nous finissons', 'tu prendras'] },
    ],
  },
  'Dans une phrase, je **souligne** le verbe conjugué :',
  { kind: 'example', lines: ['*Les enfants __plongent__ dans la piscine.*'] },
  'Pour trouver l’infinitif, je dis « il faut… » :',
  {
    kind: 'example',
    lines: ['nous plongeons → il faut **plonger**', 'tu finis → il faut **finir**'],
  },
];

// CONJ 2 : les temps, passé, présent, futur (la frise et le tableau de la fiche de l'école).
const CONJ2_LESSON: LessonBlock[] = [
  'Dans une phrase, le **verbe conjugué** indique le **moment** où se passe l’action.',
  {
    kind: 'timeline',
    steps: [
      {
        title: 'passé',
        color: MOMENT_COLOR.passe,
        text: 'ce qui s’est passé **AVANT** : *L’année dernière, j’__allais__ à l’école.*',
      },
      {
        title: 'présent',
        color: MOMENT_COLOR.present,
        text: 'ce qui se passe **MAINTENANT** : *Aujourd’hui, je __vais__ à l’école.*',
      },
      {
        title: 'futur',
        color: MOMENT_COLOR.futur,
        text: 'ce qui se passera **APRÈS** : *Demain, j’__irai__ à l’école.*',
      },
    ],
  },
  'Pour connaître le temps d’une action, je repère le **temps du verbe** : *il chantait* → on dit « hier il chantait » → passé.',
  'Je repère aussi les **indicateurs de temps** :',
  {
    kind: 'table',
    columns: MOMENTS.map((m) => ({
      title: MOMENT_LABEL[m],
      color: MOMENT_COLOR[m],
      cells: indicatorsOf(m, true).map((i) => i.text.replace("'", '’')),
    })),
  },
];

// Leçon « La phrase » du cahier.
const PHRASE_LESSON: LessonBlock[] = [
  'Une **phrase** est une suite de mots qui **veut dire quelque chose** : elle a un **sens**.',
  'Elle commence par une **MAJUSCULE** et se termine par un **point**.',
  { kind: 'example', lines: ['*__J__e vais à la piscine__.__*'] },
  'Attention : l’**ordre des mots** compte ! Quand les mots sont mélangés, la phrase ne veut plus rien dire.',
  {
    kind: 'example',
    lines: [
      '*Aujourd’hui mange une je glace.* → ce n’est pas une phrase',
      '*Aujourd’hui je mange une glace.* → c’est une phrase',
    ],
  },
];

// Leçon « La ponctuation » du cahier.
const PONCTUATION_LESSON: LessonBlock[] = [
  'Les **points** disent **comment lire** la phrase : où faire une pause, et si la voix **descend** ou **monte**.',
  {
    kind: 'list',
    items: [
      '**.** Le **point** : la phrase **donne une information**. La voix descend. *Tom lit un livre.*',
      '**!** Le **point d’exclamation** : pour un **ordre** ou une **émotion** (joie, surprise, peur…). *Waouh, quel beau dessin !*',
      '**?** Le **point d’interrogation** : la phrase **pose une question**. La voix monte. *Où est mon cartable ?*',
    ],
  },
];

// Leçon « Les familles de mots » du cahier.
const FAMILLES_LESSON: LessonBlock[] = [
  'Une **famille de mots**, ce sont tous les mots fabriqués à partir d’un **même mot**. Ils font penser à la **même idée**.',
  'Les mots d’une même famille ont une **partie commune** :',
  {
    kind: 'example',
    lines: [
      '**jardin** → **jardin**ier, **jardin**er, **jardin**age',
      '**nage** → **nage**ur, **nage**oire',
    ],
  },
  'On fabrique les mots de la famille en **ajoutant des lettres** au début ou à la fin du mot :',
  {
    kind: 'example',
    lines: [
      'à la fin : fleur → fleur__iste__, fleur__ir__',
      'au début : faire → __dé__faire, __re__faire',
      'au début et à la fin : terre → __at__terr__ir__',
    ],
  },
];

export const notions: Notion[] = [
  {
    id: 'francais.conjugaison.infinitif-conjugue',
    domain: 'francais.conjugaison',
    title: 'Verbe à l’infinitif ou conjugué',
    grades: ['CE1'],
    competence: 'Distinguer verbes à l’infinitif et verbes conjugués.',
    lesson: CONJ1_LESSON,
  },
  {
    id: 'francais.conjugaison.verbe-conjugue-phrase',
    domain: 'francais.conjugaison',
    title: 'Le verbe conjugué dans la phrase',
    grades: ['CE1'],
    competence: 'Identifier le verbe conjugué dans une phrase.',
    lesson: CONJ1_LESSON,
  },
  {
    id: 'francais.conjugaison.donner-infinitif',
    domain: 'francais.conjugaison',
    title: 'Donner l’infinitif',
    grades: ['CE1'],
    competence: 'Donner l’infinitif d’un verbe conjugué.',
    lesson: CONJ1_LESSON,
  },
  {
    id: 'francais.conjugaison.passe-present-futur',
    domain: 'francais.conjugaison',
    title: 'Passé, présent, futur',
    grades: ['CE1'],
    competence: 'Savoir ce que sont le passé, le présent et le futur.',
    lesson: CONJ2_LESSON,
  },
  {
    id: 'francais.conjugaison.indicateurs-temps',
    domain: 'francais.conjugaison',
    title: 'Les indicateurs de temps',
    grades: ['CE1'],
    competence: 'Repérer les indicateurs de temps.',
    lesson: CONJ2_LESSON,
  },
  {
    id: 'francais.conjugaison.temps-du-verbe',
    domain: 'francais.conjugaison',
    title: 'Le temps du verbe conjugué',
    grades: ['CE1'],
    competence: 'Reconnaître le temps grâce au verbe conjugué.',
    lesson: CONJ2_LESSON,
  },
  {
    id: 'francais.conjugaison.bon-temps',
    domain: 'francais.conjugaison',
    title: 'Utiliser le bon temps',
    grades: ['CE1'],
    competence: 'Utiliser le bon temps dans une phrase.',
    lesson: CONJ2_LESSON,
  },
  {
    id: 'francais.grammaire.phrase',
    domain: 'francais.grammaire',
    title: 'Reconnaître une phrase',
    grades: ['CE1'],
    competence: 'Reconnaître une phrase : elle a un sens, une majuscule et un point.',
    lesson: PHRASE_LESSON,
  },
  {
    id: 'francais.grammaire.ordre-mots',
    domain: 'francais.grammaire',
    title: 'Remettre les mots dans l’ordre',
    grades: ['CE1'],
    competence: 'Remettre les mots d’une phrase dans l’ordre.',
    lesson: PHRASE_LESSON,
  },
  {
    id: 'francais.grammaire.ponctuation',
    domain: 'francais.grammaire',
    title: 'La ponctuation',
    grades: ['CE1'],
    competence: 'Utiliser le point, le point d’exclamation et le point d’interrogation.',
    lesson: PONCTUATION_LESSON,
  },
  {
    id: 'francais.vocabulaire.familles',
    domain: 'francais.vocabulaire',
    title: 'Les familles de mots',
    grades: ['CE1'],
    competence: 'Trouver les mots d’une même famille.',
    lesson: FAMILLES_LESSON,
  },
];
