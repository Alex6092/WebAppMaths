import { defineLevels, definePlugin } from '@app/core';
import {
  COMMON_NOUNS,
  KIND_ICON,
  NOM_NOTION,
  PROPER_NOUNS,
  type NounKind,
} from '../../lib/nom-determinant';

// Leçon « Le nom » : « Un nom est un mot qui désigne une personne, une chose, un animal ou un lieu. »

interface Params {
  /** Aussi des noms propres : Paris, Jules Dupont. */
  proper: boolean;
}

interface Data {
  word: string;
  kind: NounKind;
  proper: boolean;
}

const KINDS: NounKind[] = ['personne', 'animal', 'chose', 'lieu'];
const ARTICLE: Record<NounKind, string> = {
  personne: 'une personne',
  animal: 'un animal',
  chose: 'une chose',
  lieu: 'un lieu',
};

export default definePlugin<'mcq', Params, Data>('mcq', {
  id: 'francais.grammaire.nom-designe',
  version: 1,
  title: 'Que désigne le nom ?',
  description: 'Une personne, un animal, une chose ou un lieu ?',
  icon: '🔎',
  notions: [NOM_NOTION],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'Des noms communs', grade: 'CE1', params: { proper: false } },
    { label: 'Avec des noms propres', grade: 'CE1', params: { proper: true } },
  ]),
  minVariety: 20,

  generate({ rng, params }) {
    const proper = params.proper && rng.chance(0.4);
    const kind: NounKind = proper ? rng.pick(['personne', 'lieu'] as const) : rng.pick(KINDS);
    const word = proper
      ? rng.pick(PROPER_NOUNS[kind as 'personne' | 'lieu'])
      : rng.pick(COMMON_NOUNS[kind]);
    return {
      widget: 'mcq',
      instruction: 'COCHE ce que désigne le nom.',
      prompt: `« ${word} » désigne {?}`,
      choices: KINDS.map((k) => ({ id: k, label: ARTICLE[k], icon: KIND_ICON[k] })),
      multiple: false,
      layout: 'grid',
      data: { word, kind, proper },
    };
  },

  solve: (q) => ({ selected: [q.data.kind] }),

  explain: (q) =>
    `« ${q.data.word} » désigne ${ARTICLE[q.data.kind]}${
      q.data.proper ? ' : c’est un nom propre, il a une majuscule.' : '.'
    }`,

  signature: (q) => q.data.word,
});
