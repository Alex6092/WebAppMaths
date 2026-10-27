import { defineLevels, definePlugin } from '@app/core';
import {
  ALL_KINDS,
  calcText,
  COMPOSITION,
  fill,
  randomProblem,
  statementText,
  type ProblemKind,
  type ProblemParams,
} from '../../lib/problemes';

// Après le calcul : la phrase-réponse reprend les mots de la question, avec le bon nombre.

interface Data {
  answer: string;
}

const LEVEL = (kinds: readonly ProblemKind[]): ProblemParams => ({ kinds, max: 100, carry: true });

export default definePlugin<'mcq', ProblemParams, Data>('mcq', {
  id: 'maths.problemes.phrase-reponse',
  version: 1,
  title: 'La phrase-réponse',
  description: 'Choisis la phrase qui répond à la question.',
  icon: '✍️',
  notions: ['maths.problemes.analyser'],
  expectedLevel: 1,
  levels: defineLevels<ProblemParams>([
    { label: 'Le tout ou une partie', grade: 'CE1', params: LEVEL(COMPOSITION) },
    { label: 'Tous les problèmes', grade: 'CE1', params: LEVEL(ALL_KINDS) },
  ]),

  generate({ rng, params }) {
    const p = randomProblem(rng, params);
    const answer = fill(p.reply, p.result);
    const others = p.wrongReplies.filter((r) => r !== answer);
    const wrong = rng.sample(others, Math.min(3, others.length));
    return {
      widget: 'mcq',
      instruction: 'COCHE la bonne phrase-réponse.',
      text: `${statementText(p)}\n${p.question}\nLe calcul : ${calcText(p)}`,
      choices: rng.shuffle([answer, ...wrong]).map((r) => ({ id: r, label: r })),
      multiple: false,
      layout: 'list',
      data: { answer },
    };
  },

  solve: (q) => ({ selected: [q.data.answer] }),

  explain: (q) =>
    `La phrase-réponse reprend les mots de la question, avec le résultat du calcul : « ${q.data.answer} »`,
});
