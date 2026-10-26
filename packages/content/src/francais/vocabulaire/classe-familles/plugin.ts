import { defineLevels, definePlugin } from '@app/core';
import { FAMILIES } from '../../lib/familles';

// Leçon « Les familles de mots » : ranger les mots dans leur famille.

interface Params {
  families: number;
}

interface Data {
  families: string[];
}

export default definePlugin<'classify', Params, Data>('classify', {
  id: 'francais.vocabulaire.classe-familles',
  version: 1,
  title: 'Range les mots dans leur famille',
  description: 'Chaque mot va avec le mot dont il est fabriqué.',
  icon: '🗂️',
  notions: ['francais.vocabulaire.familles'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: '2 familles', grade: 'CE1', params: { families: 2 } },
    { label: '3 familles', grade: 'CE1', params: { families: 3 } },
  ]),

  generate({ rng, params }) {
    const families = rng.sample(FAMILIES, params.families);
    // Deux mots par famille (trois quand la famille en a assez, au premier niveau).
    const items = rng.shuffle(
      families.flatMap((f) =>
        rng
          .sample(f.words, Math.min(f.words.length, params.families === 2 ? 3 : 2))
          .map((text) => ({ text, family: f.base })),
      ),
    );
    return {
      widget: 'classify',
      instruction: 'CLASSE les mots dans leur famille.',
      layout: 'columns',
      items: items.map((i) => ({ text: i.text })),
      categories: families.map((f) => ({ id: f.base, label: `famille de « ${f.base} »` })),
      data: { families: items.map((i) => i.family) },
    };
  },

  solve: (q) => ({ placed: [...q.data.families] }),

  explain: (q) =>
    q.categories
      .map(
        (c) =>
          `${c.label} : ${q.items
            .filter((_, i) => q.data.families[i] === c.id)
            .map((i) => i.text)
            .join(', ')}`,
      )
      .join(' ; '),

  signature: (q) =>
    q.items
      .map((i) => i.text)
      .sort()
      .join('|'),
});
