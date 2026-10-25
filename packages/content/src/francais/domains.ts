import type { Domain, Notion } from '@app/core';

export const domains: Domain[] = [
  { id: 'francais.conjugaison', subject: 'francais', title: 'Conjugaison', icon: '⏳', order: 1 },
  { id: 'francais.grammaire', subject: 'francais', title: 'Grammaire', icon: '🧱', order: 2 },
  { id: 'francais.orthographe', subject: 'francais', title: 'Orthographe', icon: '✏️', order: 3 },
  { id: 'francais.vocabulaire', subject: 'francais', title: 'Vocabulaire', icon: '📚', order: 4 },
  { id: 'francais.lecture', subject: 'francais', title: 'Lecture', icon: '👀', order: 5 },
];

// CONJ 1 : le verbe, forme infinitive et conjuguée.
const CONJ1_LESSON =
  'Le **verbe à l’infinitif** est le verbe « tout seul », comme dans le dictionnaire : ' +
  '*chanter, finir, prendre*. On peut dire « il faut chanter ».\n\n' +
  'Le **verbe conjugué** change selon la personne et le moment : *je chante, nous chantons, ' +
  'tu chanteras*. On trouve devant lui une personne (je, tu, il, Léa, les enfants…).\n\n' +
  'Pour trouver l’infinitif, je dis « il faut… » : *nous plongeons → il faut plonger*.';

// CONJ 2 : les temps, passé, présent, futur.
const CONJ2_LESSON =
  'Le **verbe conjugué** indique le **moment** où se passe l’action.\n\n' +
  '- Au **passé** : ce qui s’est passé AVANT → *L’année dernière, j’allais à l’école.*\n' +
  '- Au **présent** : ce qui se passe MAINTENANT → *Aujourd’hui, je vais à l’école.*\n' +
  '- Au **futur** : ce qui se passera APRÈS → *Demain, j’irai à l’école.*\n\n' +
  'Pour connaître le temps, je repère le **temps du verbe** (*il chantait* → on dit « hier il ' +
  'chantait » → passé) et les **indicateurs de temps** :\n\n' +
  '- passé : hier, avant-hier, il y a 2 jours, samedi dernier, la semaine dernière, autrefois, jadis\n' +
  '- présent : en ce moment, aujourd’hui, actuellement, maintenant\n' +
  '- futur : demain, après-demain, dans 2 jours, samedi prochain, la semaine prochaine, dans quelques années';

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
];
