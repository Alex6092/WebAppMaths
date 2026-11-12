import { defineLevels, definePlugin } from '@app/core';
import { proofSentences, type Story } from '../../lib/histoires';
import {
  explainStory,
  solveStory,
  storyQuestion,
  type StoryData,
} from '../../lib/histoires/exercice';

const WOLF: Pick<Story, 'id' | 'title' | 'icon' | 'text' | 'questions'> = {
  id: 'documentaire-loup',
  title: 'Le loup et sa meute',
  icon: '🐺',
  text: [
    'Dans la forêt, des traces traversent le sentier. Elles ont été laissées par des loups. Les loups vivent souvent en groupe, dans une famille appelée une meute.',
    'Au printemps, la louve met ses petits au monde dans un abri, la tanière. À leur naissance, les louveteaux sont aveugles et sourds. Ils restent d’abord à l’abri, près de leur mère.',
    'Le loup est carnivore. Il chasse des animaux pour se nourrir. Les animaux qu’il chasse s’appellent ses proies.',
  ],
  questions: [
    {
      ask: 'Comment appelle-t-on le groupe dans lequel vivent les loups ?',
      answer: 'une meute',
      wrong: ['une portée', 'un troupeau'],
      proof: 'une famille appelée une meute',
    },
    {
      ask: 'Où naissent les louveteaux ?',
      answer: 'dans une tanière',
      wrong: ['sur le sentier', 'dans un nid'],
      proof: 'met ses petits au monde dans un abri',
    },
    {
      ask: 'Que chasse le loup pour se nourrir ?',
      answer: 'des animaux',
      wrong: ['des feuilles', 'des graines'],
      proof: 'Il chasse des animaux pour se nourrir',
    },
  ],
};

export default definePlugin<'comprehension', object, StoryData>('comprehension', {
  id: 'francais.lecture.documentaire-loup',
  version: 1,
  title: 'Lis un documentaire sur le loup',
  icon: WOLF.icon,
  notions: ['francais.lecture.comprendre-texte'],
  expectedLevel: 1,
  levels: defineLevels([{ label: 'Le loup et sa meute', grade: 'CE1', params: {} }]),
  inMix: false,
  minVariety: 1,

  generate: ({ rng }) =>
    storyQuestion(
      rng,
      WOLF,
      { questions: 3, why: false, pictures: false },
      {
        instruction: 'LIS le documentaire, puis RÉPONDS aux questions.',
        read: true,
      },
    ),

  solve: solveStory,
  explain: explainStory,
  invariants: () =>
    WOLF.questions.some(({ proof }) => proofSentences(WOLF, proof).length !== 1)
      ? 'une question doit avoir une phrase-réponse unique'
      : undefined,
  signature: (q) => q.data.story,
});
