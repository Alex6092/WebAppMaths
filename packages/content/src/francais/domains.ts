import type { Domain, Notion } from '@app/core';

export const domains: Domain[] = [
  { id: 'francais.conjugaison', subject: 'francais', title: 'Conjugaison', icon: '⏳', order: 1 },
  { id: 'francais.grammaire', subject: 'francais', title: 'Grammaire', icon: '🧱', order: 2 },
  { id: 'francais.orthographe', subject: 'francais', title: 'Orthographe', icon: '✏️', order: 3 },
  { id: 'francais.vocabulaire', subject: 'francais', title: 'Vocabulaire', icon: '📚', order: 4 },
  { id: 'francais.lecture', subject: 'francais', title: 'Lecture', icon: '👀', order: 5 },
];

export const notions: Notion[] = [];
