import { defineLevels, definePlugin } from '@app/core';
import {
  problemExplanation,
  randomProblem,
  SOLVE_LEVELS,
  statementText,
  type ProblemKind,
  type ProblemParams,
} from '../../lib/problemes';

// « Résolution de problèmes » : lire l'énoncé et la question, calculer, compléter la phrase-réponse.

interface Data {
  kind: ProblemKind;
  result: number;
  explanation: string;
}

export default definePlugin<'number-input', ProblemParams, Data>('number-input', {
  id: 'maths.problemes.resous-probleme',
  version: 1,
  title: 'Résous le problème',
  description: 'Lis l’énoncé et la question, calcule, puis complète la phrase-réponse.',
  icon: '🧩',
  notions: ['maths.problemes.resoudre'],
  expectedLevel: 3,
  levels: defineLevels<ProblemParams>([...SOLVE_LEVELS]),

  generate({ rng, params }) {
    const p = randomProblem(rng, params);
    return {
      widget: 'number-input',
      instruction: 'LIS le problème, CALCULE et COMPLÈTE la phrase-réponse.',
      text: `${statementText(p)}\n${p.question}`,
      prompt: p.reply,
      maxLength: 3,
      data: { kind: p.kind, result: p.result, explanation: problemExplanation(p) },
    };
  },

  solve: (q) => ({ value: String(q.data.result) }),

  explain: (q) => q.data.explanation,

  invariants(q, { params }) {
    if (!params.kinds.includes(q.data.kind)) return `problème ${q.data.kind} hors du niveau`;
    if (q.data.result < 2 || q.data.result > params.max) return `réponse ${q.data.result}`;
    return undefined;
  },
});
