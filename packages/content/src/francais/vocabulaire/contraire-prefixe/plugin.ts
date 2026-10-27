import { defineLevels, definePlugin } from '@app/core';
import { PREFIXED, PREFIXES } from '../../lib/vocabulaire';

// Des contraires avec un petit mot devant : possible → impossible, faire → défaire.

interface Data {
  word: string;
  prefix: string;
}

export default definePlugin<'fill-blank', Record<string, never>, Data>('fill-blank', {
  id: 'francais.vocabulaire.contraire-prefixe',
  version: 1,
  title: 'Le contraire avec in-, dé-, mal-…',
  description: 'Possible → impossible : ajoute le petit mot qui fait le contraire.',
  icon: '➕',
  notions: ['francais.vocabulaire.contraires'],
  expectedLevel: 1,
  levels: defineLevels<Record<string, never>>([
    { label: 'in-, im-, dé-, mal-, mé-', grade: 'CE1', params: {} },
  ]),

  generate({ rng }) {
    const { word, prefix } = rng.pick(PREFIXED);
    return {
      widget: 'fill-blank',
      instruction: 'COMPLÈTE pour écrire le contraire du mot.',
      prompt: `${word} → {0}${word}`,
      blanks: [{ kind: 'choice', options: [...PREFIXES] }],
      data: { word, prefix },
    };
  },

  solve: (q) => ({ values: [q.data.prefix] }),

  explain: (q) =>
    q.data.prefix === 'im'
      ? `Devant p, b ou m, on écrit « im » : ${q.data.word} → im${q.data.word}.`
      : `Le contraire de « ${q.data.word} » est « ${q.data.prefix}${q.data.word} ».`,
});
