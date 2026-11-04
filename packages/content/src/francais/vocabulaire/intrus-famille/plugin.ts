import { defineLevels, definePlugin } from '@app/core';
import { RED_PEN } from '../../lib/couleurs';
import { FAMILIES, familyTraps, familyWords, trapReason, type Trap } from '../../lib/familles';

// Leçon « Les familles de mots » : le mot qui n'est pas de la famille. Au dernier niveau, comme
// sur la fiche de la classe, l'intrus ressemble aux autres (dent, dentiste, dentier… dedans).

interface Params {
  /** Mots de la famille montrés (l'intrus en plus). */
  size: number;
  /** L'intrus est un piège de la famille, et non le mot d'une autre famille. */
  trap: boolean;
}

interface Data {
  base: string;
  intrus: number;
  trap: Trap | null;
}

export default definePlugin<'word-select', Params, Data>('word-select', {
  id: 'francais.vocabulaire.intrus-famille',
  version: 2,
  title: 'Trouve l’intrus',
  description: 'Le mot qui n’est pas de la même famille.',
  icon: '🕵️',
  notions: ['francais.vocabulaire.familles'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    {
      label: '3 mots de la famille et un intrus',
      grade: 'CE1',
      params: { size: 3, trap: false },
    },
    {
      label: '4 mots de la famille et un intrus',
      grade: 'CE1',
      params: { size: 4, trap: false },
    },
    {
      label: 'Un intrus qui ressemble aux autres',
      grade: 'CE1',
      params: { size: 3, trap: true },
    },
  ]),

  generate({ rng, params }) {
    const family = rng.pick(
      FAMILIES.filter(
        (f) => familyWords(f).length >= params.size && (!params.trap || familyTraps(f).length),
      ),
    );
    const trap = params.trap ? rng.pick(familyTraps(family)) : null;
    const intrus =
      trap?.word ?? rng.pick(familyWords(rng.pick(FAMILIES.filter((f) => f !== family))));
    const words = rng.shuffle([...rng.sample(familyWords(family), params.size), intrus]);
    return {
      widget: 'word-select',
      instruction: 'ENTOURE l’intrus : le mot qui n’est pas de la même famille.',
      layout: 'grid',
      mark: 'circle',
      tokens: words.map((text) => ({ text })),
      colors: RED_PEN,
      data: { base: family.base, intrus: words.indexOf(intrus), trap },
    };
  },

  solve: (q) => ({ picks: q.tokens.map((_, i) => (i === q.data.intrus ? 'x' : null)) }),

  explain: (q) =>
    `Les autres mots sont de la famille de « ${q.data.base} ». ${
      q.data.trap
        ? trapReason(q.data.base, q.data.trap)
        : `« ${q.tokens[q.data.intrus]!.text} » n’en fait pas partie.`
    }`,

  signature: (q) =>
    q.tokens
      .map((t) => t.text)
      .sort()
      .join('|'),
});
