import { defineLevels, definePlugin } from '@app/core';
import { END_MARK, sentenceOfKind, type SentenceKind } from '../../lib/ponctuation';

// Leçon « La ponctuation » : ce que le point dit de la phrase.

interface Data {
  kind: SentenceKind;
}

const KINDS: SentenceKind[] = ['info', 'question', 'exclamation'];
const LABEL: Record<SentenceKind, string> = {
  info: 'Elle donne une information.',
  question: 'Elle pose une question.',
  exclamation: 'Elle exprime une émotion ou un ordre.',
};
const MARK_NAME: Record<SentenceKind, string> = {
  info: 'un point',
  question: 'un point d’interrogation',
  exclamation: 'un point d’exclamation',
};

export default definePlugin<'mcq', Record<string, never>, Data>('mcq', {
  id: 'francais.grammaire.type-phrase',
  version: 1,
  title: 'Que fait cette phrase ?',
  description: 'Une information, une question, une émotion ?',
  icon: '💬',
  notions: ['francais.grammaire.ponctuation'],
  levels: defineLevels<Record<string, never>>([
    { label: 'Regarde le point à la fin', grade: 'CE1', params: {} },
  ]),

  generate({ rng }) {
    const kind = rng.pick(KINDS);
    const text = sentenceOfKind(rng, kind);
    return {
      widget: 'mcq',
      instruction: 'COCHE ce que fait cette phrase.',
      // Une espace avant « ? » et « ! », comme en français.
      prompt: `${text}${kind === 'info' ? '' : ' '}${END_MARK[kind]}`,
      choices: KINDS.map((k) => ({ id: k, label: LABEL[k] })),
      multiple: false,
      layout: 'list',
      data: { kind },
    };
  },

  solve: (q) => ({ selected: [q.data.kind] }),

  explain: (q) =>
    `La phrase finit par ${MARK_NAME[q.data.kind]} : ${LABEL[q.data.kind].toLowerCase()}`,

  signature: (q) => q.prompt ?? '',
});
