import { defineLevels, definePlugin } from '@app/core';
import { PINK } from '../../lib/couleurs';
import { P_NOTION } from '../../lib/lettre-p';

const SENTENCES = [
  'Le petit loup suit sa proie.',
  'Le serpent passe près des poules.',
  'Lina prend une photo avec son téléphone.',
  'Papa apporte une nappe pour le repas.',
  'Le groupe aperçoit un phare au loin.',
  'Il reste sept pommes dans le panier.',
  'Le chat attrape une pelote sur le tapis.',
  'Les élèves préparent un spectacle de piano.',
  'Amir appelle son frère pour jouer.',
  'Le renard a beaucoup de place dans son abri.',
  'La pharmacienne porte une blouse blanche.',
  'Une pie passe au-dessus de la porte.',
];

export default definePlugin('word-select', {
  id: 'francais.orthographe.lettre-p-colorie',
  version: 1,
  title: 'Colorie les mots avec p',
  description: 'Cherche la lettre p dans une phrase.',
  icon: '🖍️',
  notions: [P_NOTION],
  expectedLevel: 1,
  levels: defineLevels([{ label: 'Dans une phrase', grade: 'CE1', params: {} }]),

  generate({ rng }) {
    const sentence = rng.pick(SENTENCES);
    const tokens = sentence
      .slice(0, -1)
      .split(' ')
      .map((text) => ({ text }));
    return {
      widget: 'word-select',
      instruction: 'COLORIE les mots où tu vois la lettre p.',
      layout: 'sentence',
      mark: 'color',
      tokens: [...tokens, { text: '.', selectable: false, glue: true }],
      colors: PINK,
      data: {
        sentence,
        picks: [...tokens.map(({ text }) => (/p/i.test(text) ? PINK[0]!.id : null)), null],
      },
    };
  },

  solve: (q) => ({ picks: [...q.data.picks] }),
  explain: () =>
    'Je colorie le mot dès que je vois un p, même s’il est muet ou s’il est suivi d’un h.',
  signature: (q) => q.data.sentence,
});
