import { defineLevels, definePlugin } from '@app/core';
import { RED_PEN } from '../../lib/couleurs';
import { NOM_NOTION, NOUN_SENTENCES, sentenceTokens } from '../../lib/nom-determinant';

// Leçon « Le nom » : « Indice : les noms propres prennent une majuscule. »
// Les noms propres de la phrase ont perdu leur majuscule : l'enfant les retrouve.

interface Data {
  sentence: string;
  right: boolean[];
  names: string[];
}

const WITH_PROPER = NOUN_SENTENCES.filter((s) => s.words.some((w) => w.role === 'proper'));

export default definePlugin<'word-select', Record<string, never>, Data>('word-select', {
  id: 'francais.grammaire.majuscule-nom-propre',
  version: 1,
  title: 'La majuscule des noms propres',
  description: 'Paris, Léa, France : les noms propres prennent une majuscule.',
  icon: '🔠',
  notions: [NOM_NOTION],
  expectedLevel: 1,
  levels: defineLevels<Record<string, never>>([
    { label: 'Dans une phrase', grade: 'CE1', params: {} },
  ]),
  minVariety: 15,

  generate({ rng }) {
    const s = rng.pick(WITH_PROPER);
    const right = s.words.map((w) => w.role === 'proper');
    return {
      widget: 'word-select',
      instruction: 'Des noms propres ont oublié leur majuscule. ENTOURE-les.',
      layout: 'sentence',
      mark: 'circle',
      tokens: sentenceTokens(s, true),
      colors: RED_PEN,
      data: {
        sentence: s.text,
        right: [...right, false],
        names: s.words.filter((w) => w.role === 'proper').map((w) => w.text),
      },
    };
  },

  solve: (q) => ({ picks: q.data.right.map((r) => (r ? RED_PEN[0]!.id : null)) }),

  explain(q) {
    const { names, sentence } = q.data;
    const rule =
      names.length > 1
        ? 'ce sont des noms propres, ils prennent une majuscule'
        : 'c’est un nom propre, il prend une majuscule';
    return `${names.join(', ')} : ${rule}. ${sentence}`;
  },

  signature: (q) => q.data.sentence,
});
