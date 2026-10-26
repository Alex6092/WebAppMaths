import { defineLevels, definePlugin } from '@app/core';
import { RED_PEN } from '../../lib/couleurs';
import { FAMILIES, familyWords } from '../../lib/familles';

// Leçon « Les familles de mots » : le mot qui n'est pas de la famille.

interface Params {
  /** Mots de la famille montrés (l'intrus en plus). */
  size: number;
}

interface Data {
  base: string;
  intrus: number;
}

export default definePlugin<'word-select', Params, Data>('word-select', {
  id: 'francais.vocabulaire.intrus-famille',
  version: 1,
  title: 'Trouve l’intrus',
  description: 'Le mot qui n’est pas de la même famille.',
  icon: '🕵️',
  notions: ['francais.vocabulaire.familles'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: '3 mots de la famille et un intrus', grade: 'CE1', params: { size: 3 } },
    { label: '4 mots de la famille et un intrus', grade: 'CE1', params: { size: 4 } },
  ]),

  generate({ rng, params }) {
    const family = rng.pick(FAMILIES.filter((f) => familyWords(f).length >= params.size));
    const other = rng.pick(FAMILIES.filter((f) => f !== family));
    const intrus = rng.pick(familyWords(other));
    const words = rng.shuffle([...rng.sample(familyWords(family), params.size), intrus]);
    return {
      widget: 'word-select',
      instruction: 'ENTOURE l’intrus : le mot qui n’est pas de la même famille.',
      layout: 'grid',
      mark: 'circle',
      tokens: words.map((text) => ({ text })),
      colors: RED_PEN,
      data: { base: family.base, intrus: words.indexOf(intrus) },
    };
  },

  solve: (q) => ({ picks: q.tokens.map((_, i) => (i === q.data.intrus ? 'x' : null)) }),

  explain: (q) =>
    `Les autres mots sont de la famille de « ${q.data.base} ». « ${q.tokens[q.data.intrus]!.text} » n’en fait pas partie.`,

  signature: (q) =>
    q.tokens
      .map((t) => t.text)
      .sort()
      .join('|'),
});
