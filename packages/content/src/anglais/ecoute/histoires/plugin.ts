import { defineLevels, definePlugin } from '@app/core';
import { MIN_STORIES_PER_LEVEL } from '../../../francais/lib/histoires';
import {
  explainStory,
  pickedInvariants,
  solveStory,
  storyQuestion,
  type StoryData,
} from '../../../francais/lib/histoires/exercice';
import { ENGLISH_RULES, ENGLISH_STORIES, type EnglishLevel } from '../../lib/histoires';
import { ENGLISH } from '../../lib/mots';

// Écouter une petite histoire en anglais, puis répondre en français, en touchant des images.
// Après la correction, le texte anglais s'affiche, avec sa traduction.

interface Params {
  level: EnglishLevel;
}

export default definePlugin<'comprehension', Params, StoryData>('comprehension', {
  id: 'anglais.ecoute.histoires',
  version: 1,
  title: 'Une histoire en anglais',
  description: 'Écoute une petite histoire en anglais, puis réponds aux questions.',
  icon: '🎧',
  notions: ['anglais.ecoute.histoires'],
  expectedLevel: 1,
  // Une histoire, puis plusieurs questions : pas dans le défi du jour ni dans « Tout mélanger ».
  inMix: false,
  levels: defineLevels<Params>([
    { label: 'Petites histoires', grade: 'CE1', params: { level: 1 } },
    { label: 'Histoires un peu plus longues', grade: 'CE2', params: { level: 2 } },
  ]),

  generate: ({ rng, params }) => {
    const story = rng.pick(ENGLISH_STORIES.filter((s) => s.level === params.level));
    return storyQuestion(rng, story, ENGLISH_RULES[params.level], {
      instruction: 'ÉCOUTE l’histoire en anglais, puis RÉPONDS aux questions.',
      read: false,
      lang: ENGLISH,
      translation: story.translation,
    });
  },

  solve: solveStory,
  explain: explainStory,
  invariants(q, { params }) {
    const story = ENGLISH_STORIES.find((s) => s.id === q.data.story);
    if (story?.level !== params.level) return 'histoire d’un autre niveau';
    if (q.lang !== ENGLISH) return 'pas en anglais';
    return pickedInvariants(q, story, ENGLISH_RULES[params.level]);
  },

  // Une séance ne raconte pas deux fois la même histoire.
  signature: (q) => q.data.story,
  minVariety: MIN_STORIES_PER_LEVEL,
});
