import { defineLevels, definePlugin } from '@app/core';
import { retry } from '../../lib/numbers';
import { CONTRARIES, partner, SYNONYMS, type WordPair } from './vocabulaire';

/** Les synonymes et les contraires se travaillent de la même façon : trouver, puis relier. */

export type Relation = 'synonymes' | 'contraires';

const BANK: Record<Relation, readonly WordPair[]> = { synonymes: SYNONYMS, contraires: CONTRARIES };
const OTHER: Record<Relation, Relation> = { synonymes: 'contraires', contraires: 'synonymes' };

const ASK: Record<Relation, (word: string) => string> = {
  synonymes: (w) => `COCHE le mot qui veut dire presque la même chose que « ${w} ».`,
  contraires: (w) => `COCHE le contraire de « ${w} ».`,
};
const SAY: Record<Relation, (a: string, b: string) => string> = {
  synonymes: (a, b) =>
    `« ${a} » et « ${b} » veulent dire presque la même chose : ce sont des synonymes.`,
  contraires: (a, b) => `« ${a} » et « ${b} » ont des sens opposés : ce sont des contraires.`,
};

/** Le mot lié à `word` dans l'autre banque : le piège (pour « content », le synonyme « heureux »). */
function trapFor(relation: Relation, word: string): string | undefined {
  const pair = BANK[OTHER[relation]].find((p) => p.a === word || p.b === word);
  return pair && partner(pair, word);
}

interface FindParams {
  choices: number;
  /** Le piège de l'autre banque parmi les choix, quand il existe. */
  trap: boolean;
}
interface FindData {
  word: string;
  answer: string;
}

/** « COCHE le contraire de chaud » : le bon mot, et des mots de la même nature. */
export function findPlugin(relation: Relation, icon: string) {
  const bank = BANK[relation];
  return definePlugin<'mcq', FindParams, FindData>('mcq', {
    id: `francais.vocabulaire.trouve-${relation === 'synonymes' ? 'synonyme' : 'contraire'}`,
    version: 1,
    title: relation === 'synonymes' ? 'Trouve le synonyme' : 'Trouve le contraire',
    description:
      relation === 'synonymes'
        ? 'Le mot qui veut dire presque la même chose.'
        : 'Le mot qui veut dire le contraire.',
    icon,
    notions: [`francais.vocabulaire.${relation}`],
    expectedLevel: 2,
    levels: defineLevels<FindParams>([
      { label: 'Parmi trois mots', grade: 'CE1', params: { choices: 3, trap: false } },
      {
        label: 'Parmi quatre mots, avec un piège',
        grade: 'CE1',
        params: { choices: 4, trap: true },
      },
    ]),

    generate({ rng, params }) {
      const pair = rng.pick(bank);
      const word = rng.chance(0.5) ? pair.a : pair.b;
      const answer = partner(pair, word);
      const trap = params.trap ? trapFor(relation, word) : undefined;
      const taken = new Set([word, answer, ...(trap ? [trap] : [])]);
      const others = rng
        .shuffle(bank.filter((p) => p !== pair && p.nature === pair.nature))
        .map((p) => rng.pick([p.a, p.b]))
        .filter((w) => !taken.has(w))
        .slice(0, params.choices - taken.size + 1);
      const choices = rng.shuffle([answer, ...(trap ? [trap] : []), ...others]);
      return {
        widget: 'mcq',
        instruction: ASK[relation](word),
        choices: choices.map((w) => ({ id: w, label: w })),
        multiple: false,
        layout: 'grid',
        data: { word, answer },
      };
    },

    solve: (q) => ({ selected: [q.data.answer] }),

    explain: (q) => SAY[relation](q.data.word, q.data.answer),

    invariants: (q, { params }) =>
      q.choices.length === params.choices ? undefined : `${q.choices.length} choix`,
  });
}

interface MatchParams {
  count: number;
}
interface MatchData {
  links: number[];
}

/** « RELIE les contraires » : une colonne de mots, une colonne de leurs partenaires. */
export function matchPlugin(relation: Relation, icon: string) {
  const bank = BANK[relation];
  return definePlugin<'match', MatchParams, MatchData>('match', {
    id: `francais.vocabulaire.relie-${relation}`,
    version: 1,
    title: `Relie les ${relation}`,
    description: `Relie chaque mot à son ${relation === 'synonymes' ? 'synonyme' : 'contraire'}.`,
    icon,
    notions: [`francais.vocabulaire.${relation}`],
    expectedLevel: 2,
    levels: defineLevels<MatchParams>([
      { label: 'Quatre paires', grade: 'CE1', params: { count: 4 } },
      { label: 'Six paires', grade: 'CE1', params: { count: 6 } },
    ]),

    generate({ rng, params }) {
      // Un mot ne revient pas dans deux paires (grand / petit, grand / immense).
      const pairs = retry(
        () => rng.sample(bank, params.count),
        (ps) => new Set(ps.flatMap((p) => [p.a, p.b])).size === ps.length * 2,
      );
      const flipped = pairs.map((p) => (rng.chance(0.5) ? [p.a, p.b] : [p.b, p.a]));
      const right = rng.shuffle(flipped.map((_, i) => i));
      return {
        widget: 'match',
        instruction: `RELIE chaque mot à son ${relation === 'synonymes' ? 'synonyme' : 'contraire'}.`,
        columns: [
          { cards: flipped.map(([a]) => ({ text: a! })) },
          { cards: right.map((i) => ({ text: flipped[i]![1]! })) },
        ],
        data: { links: flipped.map((_, i) => right.indexOf(i)) },
      };
    },

    solve: (q) => ({ links: [[...q.data.links]] }),

    explain: () =>
      relation === 'synonymes'
        ? 'Des synonymes veulent dire presque la même chose : je peux remplacer l’un par l’autre dans une phrase.'
        : 'Des contraires veulent dire l’inverse : chaud et froid, ouvrir et fermer.',

    signature: (q) => q.columns[0]!.cards.map((c) => c.text).join('|'),
  });
}
