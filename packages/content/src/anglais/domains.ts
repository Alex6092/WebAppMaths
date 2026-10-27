import type { Domain, Notion } from '@app/core';
import { THEMES, themeNotion } from './lib/mots';

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

export const notions: Notion[] = THEMES.map(themeNotion);
