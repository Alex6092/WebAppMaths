import type { Domain, LessonBlock, Notion } from '@app/core';
import { ENGLISH, THEMES, themeNotion } from './lib/mots';

const STORY_LESSON: LessonBlock[] = [
  'Pour comprendre une histoire en anglais, je n’ai **pas besoin de connaître tous les mots** ! J’écoute l’histoire **jusqu’au bout**, et je la **réécoute** si je veux.',
  'Je repère les **mots que je connais** : les couleurs, les nombres, les animaux, la famille, les jours…',
  {
    kind: 'words',
    lang: ENGLISH,
    items: [
      { word: 'My name is Tom.', meaning: 'Je m’appelle Tom.', icon: '👦' },
      { word: 'I have a dog.', meaning: 'J’ai un chien.', icon: '🐕' },
      { word: 'It is blue.', meaning: 'Il est bleu.', icon: '💙' },
      { word: 'On Monday', meaning: 'lundi', icon: '📅' },
    ],
  },
  'Les **images** et la **voix** m’aident aussi : une voix contente, triste, fâchée… Après la correction, je peux lire l’histoire **en anglais et en français**.',
];

export const domains: Domain[] = [
  { id: 'anglais.vocabulaire', subject: 'anglais', title: 'Vocabulaire', icon: '🎨', order: 1 },
  {
    id: 'anglais.ecoute',
    subject: 'anglais',
    title: 'Écouter et comprendre',
    icon: '👂',
    order: 2,
  },
];

export const notions: Notion[] = [
  ...THEMES.map(themeNotion),
  {
    id: 'anglais.ecoute.histoires',
    domain: 'anglais.ecoute',
    title: 'Une petite histoire en anglais',
    grades: ['CE1', 'CE2'],
    competence: 'Comprendre une histoire courte lue en anglais.',
    lesson: STORY_LESSON,
  },
];
