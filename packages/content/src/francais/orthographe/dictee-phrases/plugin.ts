import { defineLevels, definePlugin } from '@app/core';
import { SENTENCES, sentenceWords } from '../../lib/dictee';

// La dictée de phrases : une case par mot, la voix lit la phrase lentement.

interface Params {
  /** Nombre de mots de la phrase. */
  minWords: number;
  maxWords: number;
}

interface Data {
  sentence: string;
  words: string[];
}

export default definePlugin<'fill-blank', Params, Data>('fill-blank', {
  id: 'francais.orthographe.dictee-phrases',
  version: 1,
  title: 'Dictée de phrases',
  description: 'Écoute la phrase et écris chaque mot dans sa case.',
  icon: '📝',
  notions: ['francais.orthographe.dictee'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'Phrases de 4 ou 5 mots', grade: 'CE1', params: { minWords: 1, maxWords: 5 } },
    { label: 'Phrases plus longues', grade: 'CE1', params: { minWords: 6, maxWords: 8 } },
  ]),

  generate({ rng, params }) {
    const sentence = rng.pick(
      SENTENCES.filter((s) => {
        const n = sentenceWords(s).words.length;
        return n >= params.minWords && n <= params.maxWords;
      }),
    );
    const { words, end } = sentenceWords(sentence);
    return {
      widget: 'fill-blank',
      instruction: 'ÉCOUTE la phrase et ÉCRIS chaque mot dans sa case.',
      listen: sentence,
      prompt: `${words.map((_, i) => `{${i}}`).join(' ')}${end}`,
      blanks: words.map((word) => ({ kind: 'text' as const, size: Math.max(3, word.length + 1) })),
      data: { sentence, words },
    };
  },

  solve: (q) => ({ values: [...q.data.words] }),

  explain: (q) => `La phrase s’écrit : « ${q.data.sentence} »`,

  signature: (q) => q.data.sentence,
});
