import { defineLevels, definePlugin } from '@app/core';
import { explainRadical, radicalSeries, seriesText } from '../../lib/radical';

// Fiche « Les familles de mots » : écrire le radical d'une série de mots (mont, courage).

interface Params {
  words: number;
}

interface Data {
  radical: string;
  words: string[];
}

export default definePlugin<'fill-blank', Params, Data>('fill-blank', {
  id: 'francais.vocabulaire.ecris-radical',
  version: 1,
  title: 'Écris le radical',
  description: 'Écrire la partie commune à tous les mots de la famille.',
  icon: '✍️',
  notions: ['francais.vocabulaire.familles'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'Trois mots', grade: 'CE1', params: { words: 3 } },
    { label: 'Quatre mots', grade: 'CE1', params: { words: 4 } },
  ]),

  generate({ rng, params }) {
    const series = radicalSeries(rng, params.words);
    return {
      widget: 'fill-blank',
      instruction: 'ÉCRIS le radical : la plus grande partie commune à tous ces mots.',
      text: seriesText(series),
      prompt: 'Le radical est : {0}',
      blanks: [{ kind: 'text', size: series.radical.length + 2 }],
      data: { radical: series.radical, words: series.words },
    };
  },

  solve: (q) => ({ values: [q.data.radical] }),

  explain: (q) => explainRadical(q.data),

  signature: (q) => q.text ?? '',
});
