import { defineLevels, definePlugin } from '@app/core';
import { PLANT_PARTS } from '../../lib/vivant';

// « RELIE chaque partie de la plante à son rôle » : les racines puisent l'eau…

interface Params {
  count: number;
}

interface Data {
  /** Pour chaque partie (dans l'ordre affiché), le numéro de son rôle. */
  links: number[];
}

export default definePlugin<'match', Params, Data>('match', {
  id: 'qlm.vivant.parties-plante',
  version: 1,
  title: 'Les parties de la plante',
  description: 'Les racines, la tige, les feuilles, la fleur, le fruit : à quoi servent-ils ?',
  icon: '🌱',
  notions: ['qlm.vivant.plantes'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'Trois parties', grade: 'CE1', params: { count: 3 } },
    { label: 'Toutes les parties', grade: 'CE1', params: { count: 5 } },
  ]),

  generate({ rng, params }) {
    const parts = rng.shuffle(rng.sample(PLANT_PARTS, params.count));
    const roles = rng.shuffle(parts.map((_, i) => i));
    return {
      widget: 'match',
      instruction: 'RELIE chaque partie de la plante à son rôle.',
      columns: [
        { title: 'la partie', cards: parts.map((p) => ({ text: p.part, icon: p.icon })) },
        { title: 'son rôle', cards: roles.map((i) => ({ text: parts[i]!.role })) },
      ],
      data: { links: parts.map((_, i) => roles.indexOf(i)) },
    };
  },

  solve: (q) => ({ links: [[...q.data.links]] }),

  explain: (q) =>
    q.columns[0]!.cards.map(
      (c, i) => `${c.text} ${q.columns[1]!.cards[q.data.links[i]!]!.text}`,
    ).join('. ') + '.',
});
