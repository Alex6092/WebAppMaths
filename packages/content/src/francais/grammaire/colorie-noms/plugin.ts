import { defineLevels, definePlugin } from '@app/core';
import { PINK } from '../../lib/couleurs';
import {
  COMMON_PICK,
  NOM_NOTION,
  NOUN_SENTENCES,
  PROPER_PICK,
  sentenceTokens,
} from '../../lib/nom-determinant';

// Leçon « Le nom » : trouver les noms d'une phrase, puis les noms propres et les noms communs.

interface Params {
  /** Deux couleurs : les noms propres en bleu, les noms communs en vert. */
  twoColors: boolean;
}

interface Data {
  sentence: string;
  picks: (string | null)[];
}

export default definePlugin<'word-select', Params, Data>('word-select', {
  id: 'francais.grammaire.colorie-noms',
  version: 1,
  title: 'Colorie les noms',
  description: 'Un nom désigne une personne, un animal, une chose ou un lieu.',
  icon: '🖍️',
  notions: [NOM_NOTION],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'Tous les noms', grade: 'CE1', params: { twoColors: false } },
    { label: 'Noms propres et noms communs', grade: 'CE1', params: { twoColors: true } },
  ]),
  minVariety: 15,

  generate({ rng, params }) {
    const s = rng.pick(NOUN_SENTENCES);
    const picks = s.words.map(({ role }) => {
      if (role !== 'common' && role !== 'proper') return null;
      return params.twoColors ? role : PINK[0]!.id;
    });
    return {
      widget: 'word-select',
      instruction: params.twoColors
        ? 'COLORIE les noms propres en bleu et les noms communs en vert.'
        : 'COLORIE les noms.',
      layout: 'sentence',
      mark: 'color',
      tokens: sentenceTokens(s),
      colors: params.twoColors ? [PROPER_PICK, COMMON_PICK] : PINK,
      data: { sentence: s.text, picks: [...picks, null] },
    };
  },

  solve: (q) => ({ picks: [...q.data.picks] }),

  explain(q) {
    const words = q.tokens.map((t) => t.text);
    const of = (pick: (p: string | null) => boolean) =>
      words.filter((_, i) => pick(q.data.picks[i]!)).join(', ');
    if (q.colors.length === 1) return `Les noms sont : ${of((p) => p !== null)}.`;
    const proper = of((p) => p === 'proper');
    const common = of((p) => p === 'common');
    return [
      proper && `Noms propres (avec une majuscule) : ${proper}.`,
      common && `Noms communs (avec un déterminant) : ${common}.`,
    ]
      .filter(Boolean)
      .join(' ');
  },

  signature: (q) => q.data.sentence,
});
