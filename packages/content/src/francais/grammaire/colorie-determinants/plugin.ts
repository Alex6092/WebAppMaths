import { defineLevels, definePlugin } from '@app/core';
import { PINK } from '../../lib/couleurs';
import { DETERMINANT_NOTION, NOUN_SENTENCES, sentenceTokens } from '../../lib/nom-determinant';

// Leçon « Le déterminant » : un petit mot toujours placé devant le nom (le chat, l’arbre).

interface Data {
  sentence: string;
  right: boolean[];
}

export default definePlugin<'word-select', Record<string, never>, Data>('word-select', {
  id: 'francais.grammaire.colorie-determinants',
  version: 1,
  title: 'Colorie les déterminants',
  description: 'Le, la, les, l’, un, une, des : le petit mot devant le nom.',
  icon: '🖍️',
  notions: [DETERMINANT_NOTION],
  expectedLevel: 1,
  levels: defineLevels<Record<string, never>>([
    { label: 'Dans une phrase', grade: 'CE1', params: {} },
  ]),
  minVariety: 15,

  generate({ rng }) {
    const s = rng.pick(NOUN_SENTENCES.filter((x) => x.words.some((w) => w.role === 'det')));
    return {
      widget: 'word-select',
      instruction: 'COLORIE les déterminants : le petit mot devant le nom.',
      layout: 'sentence',
      mark: 'color',
      tokens: sentenceTokens(s),
      colors: PINK,
      data: { sentence: s.text, right: [...s.words.map((w) => w.role === 'det'), false] },
    };
  },

  solve: (q) => ({ picks: q.data.right.map((r) => (r ? PINK[0]!.id : null)) }),

  explain(q) {
    const groups = q.tokens.flatMap((t, i) => {
      if (!q.data.right[i]) return [];
      const noun = q.tokens[i + 1]!.text;
      const det = t.text.toLowerCase();
      return [det.endsWith('’') ? `${det}${noun}` : `${det} ${noun}`];
    });
    return `Les déterminants sont devant les noms : ${groups.join(', ')}.`;
  },

  signature: (q) => q.data.sentence,
});
