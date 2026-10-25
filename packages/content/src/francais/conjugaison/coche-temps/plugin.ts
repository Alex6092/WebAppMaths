import { defineLevels, definePlugin } from '@app/core';
import { MOMENT_LABEL, MOMENTS, type Moment, type VerbKind } from '../../lib/conjugaison';
import { MOMENT_CATEGORIES } from '../../lib/couleurs';
import { buildSentence } from '../../lib/phrases';
import { verbsOfKinds } from '../../lib/verbes';

// CONJ 2, exercices 5 et 7 : « COCHE le temps de chaque phrase. »
// Avec indicateur de temps (exercice 5), ou grâce au verbe seul (exercice 7).

interface Params {
  rows: number;
  withIndicator: boolean;
  kinds: VerbKind[];
}

interface Data {
  moments: Moment[];
  verbs: string[];
}

export default definePlugin<'classify', Params, Data>('classify', {
  id: 'francais.conjugaison.coche-temps',
  version: 1,
  title: 'Coche le temps de la phrase',
  description: 'Passé, présent ou futur ? Coche la bonne case.',
  icon: '☑️',
  notions: ['francais.conjugaison.indicateurs-temps', 'francais.conjugaison.temps-du-verbe'],
  expectedLevel: 4,
  levels: defineLevels<Params>([
    {
      label: 'Avec un indicateur de temps',
      grade: 'CE1',
      params: { rows: 3, withIndicator: true, kinds: ['regular'] },
    },
    {
      label: 'Avec un indicateur, 4 phrases',
      grade: 'CE1',
      params: {
        rows: 4,
        withIndicator: true,
        kinds: ['regular', 'spelling', 'group2', 'irregular'],
      },
    },
    {
      label: 'Grâce au verbe seulement',
      grade: 'CE1',
      params: { rows: 3, withIndicator: false, kinds: ['regular'] },
    },
    {
      label: 'Grâce au verbe, tous les verbes',
      grade: 'CE1',
      params: {
        rows: 4,
        withIndicator: false,
        kinds: ['regular', 'spelling', 'group2', 'irregular'],
      },
    },
  ]),

  generate({ rng, params }) {
    // Au moins deux moments différents, dans le désordre.
    const moments = rng.shuffle([
      ...rng.sample(MOMENTS, 2),
      ...Array.from({ length: params.rows - 2 }, () => rng.pick(MOMENTS)),
    ]);
    const verbs = verbsOfKinds(params.kinds);
    const sentences = moments.map((moment) =>
      buildSentence(rng, { verbs, moment, indicator: params.withIndicator ? 'any' : 'none' }),
    );
    return {
      widget: 'classify',
      instruction: 'COCHE le temps de chaque phrase.',
      layout: 'table',
      items: sentences.map((s) => ({ text: s.text })),
      categories: MOMENT_CATEGORIES,
      data: { moments, verbs: sentences.map((s) => s.tokens[s.roles.indexOf('verb')]!.text) },
    };
  },

  solve: (q) => ({ placed: [...q.data.moments] }),

  explain: (q) =>
    q.data.moments.map((m, i) => `« ${q.data.verbs[i]} » : ${MOMENT_LABEL[m]}`).join(' ; ') +
    '. Astuce : je dis la phrase avec « hier », « aujourd’hui » ou « demain ».',

  signature: (q) => q.items.map((i) => i.text).join('|'),
});
