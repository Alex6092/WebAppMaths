import { defineLevels, definePlugin } from '@app/core';
import { MIN_STORIES_PER_LEVEL, type StoryLevel } from '../../lib/histoires';
import {
  explainStory,
  solveStory,
  storyExercise,
  storyInvariants,
  type StoryData,
} from '../../lib/histoires/exercice';

// Lire seul un texte, puis répondre aux questions : le texte reste affiché. Au CP, de petits
// textes écrits pour être déchiffrés ; ensuite, les histoires de l'écoute, une classe plus tard
// qu'à l'oral (un enfant n'y relit pas l'histoire qu'il vient d'entendre).

interface Params {
  level: StoryLevel;
}

export default definePlugin<'comprehension', Params, StoryData>('comprehension', {
  id: 'francais.lecture.comprendre-texte',
  version: 1,
  title: 'Lis et comprends',
  description: 'Lis le texte, puis réponds aux questions. Tu peux le relire autant que tu veux.',
  icon: '📖',
  notions: ['francais.lecture.comprendre-texte'],
  expectedLevel: 2,
  // Plusieurs minutes de lecture : pas dans le défi du jour ni dans « Tout mélanger ».
  inMix: false,
  levels: defineLevels<Params>([
    { label: 'Petits textes, réponses en images', grade: 'CP', params: { level: 0 } },
    { label: 'Histoires à lire', grade: 'CE1', params: { level: 2 } },
    { label: 'Avec des « pourquoi ? »', grade: 'CE2', params: { level: 3 } },
  ]),

  generate: ({ rng, params }) =>
    storyExercise(rng, params.level, {
      instruction: 'LIS le texte, puis RÉPONDS aux questions.',
      read: true,
    }),

  solve: solveStory,
  explain: explainStory,
  invariants: (q, { params }) => storyInvariants(q, params.level),

  signature: (q) => q.data.story,
  minVariety: MIN_STORIES_PER_LEVEL,
});
