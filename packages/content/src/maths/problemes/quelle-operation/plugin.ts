import { defineLevels, definePlugin } from '@app/core';
import {
  ALL_KINDS,
  calcText,
  COMPOSITION,
  randomProblem,
  statementText,
  type ProblemKind,
  type ProblemParams,
} from '../../lib/problemes';

// Avant de calculer : quel calcul répond à la question ? Ajouter, enlever ou multiplier.

interface Data {
  answer: string;
  explanation: string;
}

const LEVEL = (kinds: readonly ProblemKind[]): ProblemParams => ({ kinds, max: 100, carry: true });

export default definePlugin<'mcq', ProblemParams, Data>('mcq', {
  id: 'maths.problemes.quelle-operation',
  version: 1,
  title: 'Quel calcul ?',
  description: 'Choisis le calcul qui répond à la question du problème.',
  icon: '🤔',
  notions: ['maths.problemes.resoudre'],
  expectedLevel: 1,
  levels: defineLevels<ProblemParams>([
    { label: 'Le tout ou une partie', grade: 'CE1', params: LEVEL(COMPOSITION) },
    {
      label: 'Il en reste, il en gagne',
      grade: 'CE1',
      params: LEVEL([...COMPOSITION, 'reste', 'gagne']),
    },
    {
      label: 'De plus que, de moins que',
      grade: 'CE1',
      params: LEVEL([...COMPOSITION, 'reste', 'gagne', 'plus', 'moins']),
    },
    { label: 'Avec la multiplication', grade: 'CE1', params: LEVEL(ALL_KINDS) },
  ]),

  generate({ rng, params }) {
    const p = randomProblem(rng, params);
    const [a, b] = p.operands;
    const big = Math.max(a, b);
    const small = Math.min(a, b);
    const calcs = [`${a} + ${b}`, `${big} − ${small}`];
    if (params.kinds.includes('fois')) calcs.push(`${a} × ${b}`);
    const answer = `${a} ${p.op} ${b}`;
    return {
      widget: 'mcq',
      instruction: 'CHOISIS le calcul qui permet de répondre à la question.',
      text: `${statementText(p)}\n${p.question}`,
      choices: rng.shuffle([...new Set(calcs)]).map((c) => ({ id: c, label: c })),
      multiple: false,
      layout: 'row',
      data: { answer, explanation: `${p.reason} ${calcText(p)}.` },
    };
  },

  solve: (q) => ({ selected: [q.data.answer] }),

  explain: (q) => q.data.explanation,

  invariants: (q) =>
    q.choices.some((c) => c.id === q.data.answer) ? undefined : 'le bon calcul manque',
});
