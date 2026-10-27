import { defineLevels, definePlugin, type PickColor } from '@app/core';
import {
  ALL_KINDS,
  COMPOSITION,
  randomProblem,
  type ProblemKind,
  type ProblemParams,
} from '../../lib/problemes';

// « ANALYSER UN PROBLÈME » : l'énoncé en bleu, la question en jaune.

const COLORS: PickColor[] = [
  { id: 'enonce', label: 'l’énoncé en bleu', color: '#90caf9' },
  { id: 'question', label: 'la question en jaune', color: '#fff176' },
];

interface Data {
  /** Le rôle de chaque phrase. */
  parts: ('enonce' | 'question')[];
}

const LEVEL = (kinds: readonly ProblemKind[]): ProblemParams => ({ kinds, max: 100, carry: true });

export default definePlugin<'word-select', ProblemParams, Data>('word-select', {
  id: 'maths.problemes.enonce-question',
  version: 1,
  title: 'L’énoncé et la question',
  description: 'Colorie l’énoncé en bleu et la question en jaune.',
  icon: '🔎',
  notions: ['maths.problemes.analyser'],
  expectedLevel: 2,
  levels: defineLevels<ProblemParams>([
    { label: 'Le tout ou une partie', grade: 'CE1', params: LEVEL(COMPOSITION) },
    { label: 'Tous les problèmes', grade: 'CE1', params: LEVEL(ALL_KINDS) },
  ]),

  generate({ rng, params }) {
    const p = randomProblem(rng, params);
    const sentences = [...p.statement, p.question];
    return {
      widget: 'word-select',
      instruction: 'COLORIE l’énoncé en bleu et la question en jaune.',
      layout: 'sentence',
      mark: 'color',
      tokens: sentences.map((text) => ({ text })),
      colors: COLORS,
      data: { parts: [...p.statement.map(() => 'enonce' as const), 'question'] },
    };
  },

  solve: (q) => ({ picks: [...q.data.parts] }),

  explain: () =>
    'L’énoncé, c’est ce qu’on sait. La question, c’est ce qu’on cherche : elle finit par un point d’interrogation.',

  signature: (q) => q.tokens.map((t) => t.text).join(' '),
});
