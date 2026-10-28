import { defineLevels, definePlugin } from '@app/core';
import { MIN_STORIES_PER_LEVEL, type StoryLevel } from '../../lib/histoires';
import {
  explainStory,
  solveStory,
  storyExercise,
  storyInvariants,
  type StoryData,
} from '../../lib/histoires/exercice';

// Écouter une histoire, puis répondre à quelques questions. L'histoire et ses questions forment
// une seule question de l'app : la suivante raconte une autre histoire.

interface Params {
  level: StoryLevel;
}

export default definePlugin<'comprehension', Params, StoryData>('comprehension', {
  id: 'francais.oral.histoires',
  version: 2,
  title: 'Écoute une histoire',
  description: 'Écoute l’histoire jusqu’au bout, puis réponds aux questions.',
  icon: '🎧',
  notions: ['francais.oral.comprendre-histoire'],
  expectedLevel: 3,
  // Une ou deux minutes d'écoute : trop long pour le défi du jour et « Tout mélanger ».
  inMix: false,
  levels: defineLevels<Params>([
    { label: 'Petites histoires en images', grade: 'CP', params: { level: 1 } },
    { label: 'Histoires et contes', grade: 'CP', params: { level: 2 } },
    { label: 'Avec des « pourquoi ? »', grade: 'CE1', params: { level: 3 } },
    { label: 'Contes plus longs', grade: 'CE2', params: { level: 4 } },
  ]),

  generate: ({ rng, params }) =>
    storyExercise(rng, params.level, {
      instruction: 'ÉCOUTE l’histoire, puis RÉPONDS aux questions.',
      read: false,
    }),

  solve: solveStory,
  explain: explainStory,
  invariants: (q, { params }) => storyInvariants(q, params.level),

  // Une séance ne raconte pas deux fois la même histoire, même avec d'autres questions.
  signature: (q) => q.data.story,
  minVariety: MIN_STORIES_PER_LEVEL,
});
