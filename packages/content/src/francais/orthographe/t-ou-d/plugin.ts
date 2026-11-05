import { defineLevels, definePlugin } from '@app/core';
import { T_OR_D, type TOrD } from '../../lib/lettre-d';

// Dictée 5, exercice 1 : « COMPLÈTE avec t ou d » (la tomate, dimanche… petit, profond).

interface Params {
  /** Aussi les lettres muettes à la fin du mot (petit, profond). */
  end: boolean;
}

interface Data {
  word: string;
  letter: TOrD['letter'];
  end: boolean;
  clue: string | null;
}

const full = (w: { word: string; letter: string }) => w.word.replace('_', w.letter);

export default definePlugin<'fill-blank', Params, Data>('fill-blank', {
  id: 'francais.orthographe.t-ou-d',
  version: 1,
  title: 'Complète avec t ou d',
  description: 'La tomate, dimanche, petit, profond : t ou d ?',
  icon: '✏️',
  notions: ['francais.orthographe.lettre-d', 'francais.orthographe.dictee-5'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'Je l’entends', grade: 'CE1', params: { end: false } },
    { label: 'Avec les lettres muettes', grade: 'CE1', params: { end: true } },
  ]),

  generate({ rng, params }) {
    // Au niveau 2, une fois sur deux la lettre est muette à la fin.
    const end = params.end && rng.chance(0.5);
    const w = rng.pick(T_OR_D.filter((x) => x.end === end));
    return {
      widget: 'fill-blank',
      instruction: 'COMPLÈTE avec t ou d.',
      prompt: w.word.replace('_', '{0}'),
      blanks: [{ kind: 'choice', options: ['t', 'd'] }],
      data: { word: w.word, letter: w.letter, end: w.end, clue: w.clue ?? null },
    };
  },

  solve: (q) => ({ values: [q.data.letter] }),

  explain(q) {
    const word = full(q.data);
    if (!q.data.end) return `On entend [${q.data.letter}] : « ${word} ».`;
    if (!q.data.clue)
      return `« ${word} » finit par un ${q.data.letter} muet : ce mot s’apprend par cœur.`;
    return `On n’entend pas la lettre de la fin. Pense à « ${q.data.clue} » : on y entend le ${q.data.letter}. On écrit « ${word} ».`;
  },

  signature: (q) => q.data.word,
});
