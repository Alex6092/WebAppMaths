import { defineLevels, definePlugin } from '@app/core';
import { MOMENT_LABEL, MOMENTS, type Moment, type VerbKind } from '../../lib/conjugaison';
import { RED_PEN } from '../../lib/couleurs';
import { buildSentence, type Role, type SentenceOptions } from '../../lib/phrases';
import { verbsOfKinds } from '../../lib/verbes';

// CONJ 2, exercice 4 : « ENTOURE l'indicateur de temps dans chaque phrase. »

interface Params {
  place: SentenceOptions['indicator'];
  lessonOnly: boolean;
  kinds: VerbKind[];
}

interface Data {
  moment: Moment;
  indicator: string;
  roles: Role[];
}

export default definePlugin<'word-select', Params, Data>('word-select', {
  id: 'francais.conjugaison.entoure-indicateur',
  version: 1,
  title: 'Entoure l’indicateur de temps',
  description: 'Trouve les mots qui disent quand se passe l’action.',
  icon: '⭕',
  notions: ['francais.conjugaison.indicateurs-temps'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    {
      label: 'En début de phrase',
      grade: 'CE1',
      params: { place: 'start', lessonOnly: true, kinds: ['regular'] },
    },
    {
      label: 'Au début ou à la fin',
      grade: 'CE1',
      params: {
        place: 'any',
        lessonOnly: false,
        kinds: ['regular', 'spelling', 'group2', 'irregular'],
      },
    },
  ]),

  generate({ rng, params }) {
    const s = buildSentence(rng, {
      verbs: verbsOfKinds(params.kinds),
      moment: rng.pick(MOMENTS),
      indicator: params.place,
      lessonIndicators: params.lessonOnly,
    });
    return {
      widget: 'word-select',
      instruction: 'ENTOURE l’indicateur de temps.',
      layout: 'sentence',
      mark: 'circle',
      tokens: s.tokens,
      colors: RED_PEN,
      data: { moment: s.moment, indicator: s.indicator!.text, roles: s.roles },
    };
  },

  solve: (q) => ({ picks: q.data.roles.map((r) => (r === 'indicator' ? 'x' : null)) }),

  explain: (q) =>
    `L’indicateur de temps est « ${q.data.indicator} » : il dit que l’action est au ${MOMENT_LABEL[q.data.moment]}.`,

  signature: (q) => q.tokens.map((t) => t.text).join(' '),
});
