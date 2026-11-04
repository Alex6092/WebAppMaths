import { defineLevels, definePlugin } from '@app/core';
import { FAMILIES, familyWords } from '../../lib/familles';

// Fiche « Les familles de mots » : RELIE les paires de mots de la même famille
// (long → allonger, plantation → plante).

interface Params {
  count: number;
}

interface Data {
  links: number[];
  /** Le mot de base de chaque paire, dans l'ordre de la colonne de gauche. */
  bases: string[];
}

export default definePlugin<'match', Params, Data>('match', {
  id: 'francais.vocabulaire.relie-familles',
  version: 1,
  title: 'Relie les mots de la même famille',
  description: 'Deux mots de la même famille vont ensemble.',
  icon: '🔗',
  notions: ['francais.vocabulaire.familles'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'Quatre paires', grade: 'CE1', params: { count: 4 } },
    { label: 'Cinq paires', grade: 'CE1', params: { count: 5 } },
    { label: 'Six paires', grade: 'CE1', params: { count: 6 } },
  ]),

  generate({ rng, params }) {
    const families = rng.sample(FAMILIES, params.count);
    // Deux mots de chaque famille, le mot de base pas toujours à gauche.
    const pairs = families.map((f) => rng.sample(familyWords(f), 2));
    const right = rng.shuffle(pairs.map((_, i) => i));
    return {
      widget: 'match',
      instruction: 'RELIE les paires de mots de la même famille.',
      columns: [
        { cards: pairs.map(([a]) => ({ text: a! })) },
        { cards: right.map((i) => ({ text: pairs[i]![1]! })) },
      ],
      data: { links: pairs.map((_, i) => right.indexOf(i)), bases: families.map((f) => f.base) },
    };
  },

  solve: (q) => ({ links: [[...q.data.links]] }),

  explain: (q) =>
    q.columns[0]!.cards.map(
      (c, i) => `${c.text} → ${q.columns[1]!.cards[q.data.links[i]!]!.text}`,
    ).join(' ; ') + ' : chaque paire a une partie commune et la même idée.',

  signature: (q) => q.columns[0]!.cards.map((c) => c.text).join('|'),
});
