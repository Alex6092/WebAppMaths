import { defineLevels, definePlugin, type Blank } from '@app/core';
import { END_MARK, sentenceOfKind, type SentenceKind } from '../../lib/ponctuation';

// Leçon « La ponctuation » : le point, le point d'exclamation, le point d'interrogation.

interface Params {
  kinds: SentenceKind[];
  rows: number;
}

interface Data {
  kinds: SentenceKind[];
}

const REASON: Record<SentenceKind, string> = {
  info: 'elle donne une information (.)',
  question: 'elle pose une question (?)',
  exclamation: 'elle exprime une émotion ou un ordre (!)',
};

export default definePlugin<'fill-blank', Params, Data>('fill-blank', {
  id: 'francais.grammaire.choisis-point',
  version: 1,
  title: 'Mets le bon point',
  description: 'Le point, le point d’exclamation ou le point d’interrogation ?',
  icon: '❓',
  notions: ['francais.grammaire.ponctuation'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    {
      label: 'Le point ou le point d’interrogation',
      grade: 'CE1',
      params: { kinds: ['info', 'question'], rows: 3 },
    },
    {
      label: 'Les trois points',
      grade: 'CE1',
      params: { kinds: ['info', 'question', 'exclamation'], rows: 4 },
    },
  ]),

  generate({ rng, params }) {
    // Au moins deux sortes de phrases.
    const kinds = rng.shuffle<SentenceKind>([
      ...rng.sample(params.kinds, 2),
      ...Array.from({ length: params.rows - 2 }, () => rng.pick(params.kinds)),
    ]);
    const options = params.kinds.map((k) => END_MARK[k]);
    const used = new Set<string>();
    const lines = kinds.map((kind, i) => {
      let text = sentenceOfKind(rng, kind);
      for (let t = 0; t < 10 && used.has(text); t++) text = sentenceOfKind(rng, kind);
      used.add(text);
      return `${text} {${i}}`;
    });
    return {
      widget: 'fill-blank',
      instruction: 'COMPLÈTE avec le bon point.',
      prompt: lines.join('\n'),
      blanks: kinds.map((): Blank => ({ kind: 'choice', options: [...options] })),
      data: { kinds },
    };
  },

  solve: (q) => ({ values: q.data.kinds.map((k) => END_MARK[k]) }),

  explain: (q) => q.data.kinds.map((k, i) => `Phrase ${i + 1} : ${REASON[k]}`).join(' ; '),

  signature: (q) => q.prompt,
});
