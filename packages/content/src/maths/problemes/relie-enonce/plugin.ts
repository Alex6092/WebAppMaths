import { defineLevels, definePlugin, type MatchColumn } from '@app/core';
import { retry } from '../../../lib/numbers';
import {
  ALL_KINDS,
  COMPOSITION,
  fill,
  makeProblem,
  randomProblem,
  statementText,
  type Problem,
  type ProblemKind,
} from '../../lib/problemes';

// « RELIE un énoncé, sa question et sa phrase-réponse » (sur la fiche : les colorier d'une même couleur).

interface Params {
  kinds: readonly ProblemKind[];
  /** Nombre de problèmes. */
  count: number;
  /** Avec la colonne des phrases-réponses. */
  replies: boolean;
}

interface Data {
  /** Le numéro du problème de chaque carte, colonne par colonne. */
  order: number[][];
}

export default definePlugin<'match', Params, Data>('match', {
  id: 'maths.problemes.relie-enonce',
  version: 1,
  title: 'Relie l’énoncé, la question et la réponse',
  description: 'Retrouve la question et la phrase-réponse de chaque énoncé.',
  icon: '🔗',
  notions: ['maths.problemes.analyser'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    {
      label: 'L’énoncé et sa question',
      grade: 'CE1',
      params: { kinds: COMPOSITION, count: 3, replies: false },
    },
    {
      label: 'Avec la phrase-réponse',
      grade: 'CE1',
      params: { kinds: COMPOSITION, count: 3, replies: true },
    },
    {
      label: 'Tous les problèmes',
      grade: 'CE1',
      params: { kinds: ALL_KINDS, count: 4, replies: true },
    },
  ]),

  generate({ rng, params }) {
    // Des sortes de problèmes différentes quand le niveau en a assez. Deux questions identiques
    // (« Combien de fleurs y a-t-il en tout ? ») ne se relieraient pas.
    const settings = { kinds: params.kinds, max: 100, carry: true };
    const problems = retry(
      () =>
        params.kinds.length >= params.count
          ? rng.sample(params.kinds, params.count).map((kind) => makeProblem(rng, kind, settings))
          : Array.from({ length: params.count }, () => randomProblem(rng, settings)),
      (ps) => new Set(ps.map((p) => p.question)).size === ps.length,
    );
    const texts: ((p: Problem) => string)[] = [statementText, (p) => p.question];
    const titles = ['énoncés', 'questions'];
    if (params.replies) {
      texts.push((p) => fill(p.reply, p.result));
      titles.push('phrases-réponses');
    }
    const order = texts.map(() => rng.shuffle(problems.map((_, i) => i)));
    const columns: MatchColumn[] = texts.map((text, c) => ({
      title: titles[c],
      cards: order[c]!.map((i) => ({ text: text(problems[i]!) })),
    }));
    return {
      widget: 'match',
      instruction: params.replies
        ? 'RELIE chaque énoncé à sa question, puis chaque question à sa phrase-réponse.'
        : 'RELIE chaque énoncé à sa question.',
      columns,
      data: { order },
    };
  },

  // La carte i d'une colonne va avec la carte du même problème dans la colonne suivante.
  solve: (q) => ({
    links: q.data.order.slice(1).map((next, c) => q.data.order[c]!.map((p) => next.indexOf(p))),
  }),

  explain: () =>
    'Lis la question : elle reprend les mots de l’énoncé. La phrase-réponse reprend les mots de la question.',

  signature: (q) => q.columns[0]!.cards.map((c) => c.text).join('|'),
});
