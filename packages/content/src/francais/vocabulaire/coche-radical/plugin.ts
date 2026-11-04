import { defineLevels, definePlugin } from '@app/core';
import { explainRadical, radicalSeries, seriesText } from '../../lib/radical';

// Fiche « Les familles de mots » : le radical, la partie commune à tous les mots de la famille.

interface Params {
  words: number;
  choices: number;
}

interface Data {
  radical: string;
  words: string[];
}

export default definePlugin<'mcq', Params, Data>('mcq', {
  id: 'francais.vocabulaire.coche-radical',
  version: 1,
  title: 'Trouve le radical',
  description: 'La partie commune à tous les mots de la famille.',
  icon: '🧩',
  notions: ['francais.vocabulaire.familles'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'Trois mots, trois choix', grade: 'CE1', params: { words: 3, choices: 3 } },
    { label: 'Quatre mots, quatre choix', grade: 'CE1', params: { words: 4, choices: 4 } },
  ]),

  generate({ rng, params }) {
    const series = radicalSeries(rng, params.words, params.choices - 1);
    const choices = [series.radical, ...series.decoys].sort(
      (a, b) => a.length - b.length || a.localeCompare(b),
    );
    return {
      widget: 'mcq',
      instruction: 'COCHE le radical : la plus grande partie commune à tous ces mots.',
      text: seriesText(series),
      choices: choices.map((c) => ({ id: c, label: c })),
      multiple: false,
      layout: 'row',
      data: { radical: series.radical, words: series.words },
    };
  },

  solve: (q) => ({ selected: [q.data.radical] }),

  explain: (q) => explainRadical(q.data),

  invariants: (q, { params }) =>
    q.choices.length !== params.choices
      ? `${q.choices.length} choix`
      : q.data.words.every((w) => w.includes(q.data.radical))
        ? undefined
        : 'le radical manque dans un mot',

  signature: (q) => q.text ?? '',
});
