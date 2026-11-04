import { compareAssignments, defineLevels, definePlugin, type PickColor } from '@app/core';
import { retry } from '../../../lib/numbers';
import { FAMILIES, familyWords } from '../../lib/familles';

// Fiche « Les familles de mots » : deux familles sont mélangées, et on ne dit pas lesquelles
// (habiter – faire – habitation – refait…). L'enfant les démêle avec deux couleurs ; peu importe
// quelle famille il colorie en bleu.

interface Params {
  /** Mots de chaque famille. */
  size: number;
  /** Deux familles qui commencent par la même lettre (savon, saut), quand c'est possible. */
  sameStart: boolean;
}

interface Data {
  bases: [string, string];
  /** La couleur de chaque mot, la famille du premier mot en bleu. */
  groups: string[];
}

const COLORS: PickColor[] = [
  { id: 'a', label: 'une famille en bleu', color: '#bbdefb' },
  { id: 'b', label: 'l’autre famille en vert', color: '#c5e1a5' },
];
const SWAP: Record<string, string> = { a: 'b', b: 'a' };

export default definePlugin<'word-select', Params, Data>('word-select', {
  id: 'francais.vocabulaire.deux-familles',
  version: 1,
  title: 'Deux familles mélangées',
  description: 'Retrouver les deux familles de mots, sans qu’on dise lesquelles.',
  icon: '🎨',
  notions: ['francais.vocabulaire.familles'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'Deux familles de trois mots', grade: 'CE1', params: { size: 3, sameStart: false } },
    {
      label: 'Deux familles de quatre mots qui se ressemblent',
      grade: 'CE1',
      params: { size: 4, sameStart: true },
    },
  ]),

  generate({ rng, params }) {
    const big = FAMILIES.filter((f) => familyWords(f).length >= params.size);
    const first = rng.pick(big);
    const near = big.filter((f) => f !== first && f.base[0] === first.base[0]);
    const second = rng.pick(
      params.sameStart && near.length ? near : big.filter((f) => f !== first),
    );
    const words = [first, second].flatMap((f, k) =>
      rng.sample(familyWords(f), params.size).map((text) => ({ text, k })),
    );
    // Mélangées pour de bon : pas une famille par moitié de la grille.
    const items = retry(
      () => rng.shuffle(words),
      (list) => new Set(list.slice(0, params.size).map((i) => i.k)).size === 2,
    );
    const firstK = items[0]!.k;
    return {
      widget: 'word-select',
      instruction:
        'Deux familles de mots sont mélangées ! COLORIE en bleu les mots d’une famille, et en vert les mots de l’autre famille.',
      layout: 'grid',
      mark: 'color',
      tokens: items.map((i) => ({ text: i.text })),
      colors: COLORS,
      data: {
        bases: firstK === 0 ? [first.base, second.base] : [second.base, first.base],
        groups: items.map((i) => (i.k === firstK ? 'a' : 'b')),
      },
    };
  },

  solve: (q) => ({ picks: [...q.data.groups] }),

  // Les deux coloriages sont justes : on corrige avec celui qui ressemble le plus à la réponse.
  check(q, answer) {
    const direct = compareAssignments(q.data.groups, answer.picks);
    const swapped = compareAssignments(
      q.data.groups.map((g) => SWAP[g]!),
      answer.picks,
    );
    if (direct.correct) return direct;
    if (swapped.correct) return swapped;
    return swapped.score > direct.score ? swapped : direct;
  },

  explain: (q) =>
    q.data.bases
      .map(
        (base, k) =>
          `famille de « ${base} » : ${q.tokens
            .filter((_, i) => q.data.groups[i] === (k === 0 ? 'a' : 'b'))
            .map((t) => t.text)
            .join(', ')}`,
      )
      .join(' ; '),

  invariants: (q, { params }) =>
    q.tokens.length === params.size * 2 ? undefined : `${q.tokens.length} mots`,

  signature: (q) =>
    q.tokens
      .map((t) => t.text)
      .sort()
      .join('|'),
});
