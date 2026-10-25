import type { Domain, Notion } from '@app/core';

export const domains: Domain[] = [
  { id: 'qlm.temps', subject: 'qlm', title: 'Se repérer dans le temps', icon: '🕰️', order: 1 },
  { id: 'qlm.espace', subject: 'qlm', title: 'Se repérer dans l’espace', icon: '🧭', order: 2 },
  { id: 'qlm.vivant', subject: 'qlm', title: 'Le vivant', icon: '🌱', order: 3 },
  { id: 'qlm.matiere', subject: 'qlm', title: 'La matière', icon: '💧', order: 4 },
];

export const notions: Notion[] = [];
