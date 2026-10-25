import { defineLevels, definePlugin, type Rng } from '@app/core';
import { PERSONS, TENSES, verbKind, type Tense, type VerbKind } from '../../lib/conjugaison';
import { PINK } from '../../lib/couleurs';
import { ADJECTIVES, ADVERBS, DAYS_MONTHS, ER_TRAPS, NOUNS } from '../../lib/mots';
import { withPronoun } from '../../lib/phrases';
import { VERBS } from '../../lib/verbes';

// CONJ 1, exercices 1 et 2 : « COLORIE les verbes à l'infinitif » / « … les verbes conjugués ».

type Target = 'inf' | 'conj';
type Kind = Target | 'other';

interface Params {
  size: number;
  kinds: VerbKind[];
  /** Mots en -er qui ne sont pas des verbes (janvier, cahier…). */
  traps: boolean;
  tenses: Tense[];
}

interface Data {
  target: Target;
  kinds: Kind[];
}

const INSTRUCTION: Record<Target, string> = {
  inf: 'COLORIE les verbes à l’infinitif.',
  conj: 'COLORIE les verbes conjugués.',
};

function makeGrid(rng: Rng, params: Params): { words: string[]; kinds: Kind[] } {
  const verbs = rng.shuffle(VERBS.filter((v) => params.kinds.includes(verbKind(v.inf))));
  const third = Math.round(params.size / 3);
  const nInf = rng.int(third, third + 1);
  const nConj = rng.int(third - 1, third + 1);
  const nOther = params.size - nInf - nConj;
  const others = [
    ...(params.traps ? rng.sample(ER_TRAPS, Math.min(2, nOther)) : []),
    ...rng.shuffle([...NOUNS, ...ADVERBS, ...ADJECTIVES, ...DAYS_MONTHS]),
  ];
  const cells: [string, Kind][] = [
    ...verbs.slice(0, nInf).map((v): [string, Kind] => [v.inf, 'inf']),
    ...verbs
      .slice(nInf, nInf + nConj)
      .map((v): [string, Kind] => [
        withPronoun(rng, v.inf, rng.pick(params.tenses), rng.pick(PERSONS)),
        'conj',
      ]),
  ];
  for (const word of others) {
    if (cells.length >= params.size) break;
    if (!cells.some(([w]) => w === word)) cells.push([word, 'other']);
  }
  const shuffled = rng.shuffle(cells);
  return { words: shuffled.map(([w]) => w), kinds: shuffled.map(([, k]) => k) };
}

export default definePlugin<'word-select', Params, Data>('word-select', {
  id: 'francais.conjugaison.colorie-verbes',
  version: 1,
  title: 'Colorie les verbes',
  description: 'Trouve les verbes à l’infinitif, ou les verbes conjugués.',
  icon: '🖍️',
  notions: ['francais.conjugaison.infinitif-conjugue'],
  expectedLevel: 3,
  levels: defineLevels<Params>([
    {
      label: 'Verbes en -er, 6 cases',
      grade: 'CE1',
      params: { size: 6, kinds: ['regular', 'spelling'], traps: false, tenses: ['present'] },
    },
    {
      label: 'Attention aux mots en -er, 9 cases',
      grade: 'CE1',
      params: {
        size: 9,
        kinds: ['regular', 'spelling', 'group2'],
        traps: true,
        tenses: ['present'],
      },
    },
    {
      label: 'Tous les verbes, 12 cases',
      grade: 'CE1',
      params: {
        size: 12,
        kinds: ['regular', 'spelling', 'group2', 'irregular'],
        traps: true,
        tenses: [...TENSES],
      },
    },
  ]),

  generate({ rng, params }) {
    const target: Target = rng.chance(0.5) ? 'inf' : 'conj';
    const { words, kinds } = makeGrid(rng, params);
    return {
      widget: 'word-select',
      instruction: INSTRUCTION[target],
      layout: 'grid',
      mark: 'color',
      tokens: words.map((text) => ({ text })),
      colors: PINK,
      data: { target, kinds },
    };
  },

  solve: (q) => ({ picks: q.data.kinds.map((k) => (k === q.data.target ? 'x' : null)) }),

  explain(q) {
    const words = q.tokens.filter((_, i) => q.data.kinds[i] === q.data.target).map((t) => t.text);
    return q.data.target === 'inf'
      ? `Les verbes à l’infinitif sont : ${words.join(', ')}. On peut dire « il faut ${words[0]} ».`
      : `Les verbes conjugués sont : ${words.join(', ')}. Une personne (je, tu, nous…) est devant le verbe.`;
  },

  invariants(q, { params }) {
    if (q.tokens.length !== params.size) return 'mauvaise taille de grille';
    if (new Set(q.tokens.map((t) => t.text)).size !== q.tokens.length) return 'mot en double';
    if (!q.data.kinds.includes(q.data.target)) return 'aucun mot à colorier';
    return undefined;
  },

  signature: (q) => q.tokens.map((t) => t.text).join('|') + q.data.target,
});
