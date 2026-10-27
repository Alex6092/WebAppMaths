import { defineLevels, definePlugin } from '@app/core';
import { MOMENT_LABEL, MOMENTS, type Moment, type VerbKind } from '../../lib/conjugaison';
import { buildSentence } from '../../lib/phrases';
import { verbsOfKinds } from '../../lib/verbes';

// « Écris à quel temps se déroule l'action. Écris l'infinitif du verbe. » (cahier, l'astronome)

interface Params {
  kinds: VerbKind[];
  /** Un indicateur de temps aide à trouver le moment. */
  indicator: boolean;
}

interface Data {
  moment: Moment;
  infinitive: string;
  form: string;
}

const LABELS = MOMENTS.map((m) => MOMENT_LABEL[m]);

export default definePlugin<'fill-blank', Params, Data>('fill-blank', {
  id: 'francais.conjugaison.analyse-verbe',
  version: 1,
  title: 'Le temps et l’infinitif',
  description: 'Trouve le verbe : à quel temps se passe l’action, et quel est son infinitif ?',
  icon: '🔭',
  notions: ['francais.conjugaison.temps-du-verbe', 'francais.conjugaison.donner-infinitif'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    {
      label: 'Avec un indicateur de temps',
      grade: 'CE1',
      params: { kinds: ['regular', 'spelling'], indicator: true },
    },
    {
      label: 'Sans indicateur de temps',
      grade: 'CE1',
      params: { kinds: ['regular', 'spelling', 'group2'], indicator: false },
    },
    {
      label: 'Avec les verbes irréguliers',
      grade: 'CE1',
      params: { kinds: ['regular', 'spelling', 'group2', 'irregular'], indicator: false },
    },
  ]),

  generate({ rng, params }) {
    const s = buildSentence(rng, {
      verbs: verbsOfKinds(params.kinds),
      moment: rng.pick(MOMENTS),
      indicator: params.indicator ? 'any' : 'none',
    });
    return {
      widget: 'fill-blank',
      instruction:
        'TROUVE le verbe. ÉCRIS à quel temps se passe l’action, puis l’infinitif du verbe.',
      prompt: `${s.text}\ntemps : {0}\ninfinitif du verbe : {1}`,
      blanks: [{ kind: 'choice', options: LABELS }, { kind: 'text' }],
      data: {
        moment: s.moment,
        infinitive: s.verb.inf,
        form: s.tokens[s.roles.indexOf('verb')]!.text,
      },
    };
  },

  solve: (q) => ({ values: [MOMENT_LABEL[q.data.moment], q.data.infinitive] }),

  explain: (q) =>
    `Le verbe est « ${q.data.form} » : l’action se passe au ${MOMENT_LABEL[q.data.moment]}. On dit « il faut ${q.data.infinitive} » : son infinitif est ${q.data.infinitive}.`,

  signature: (q) => q.prompt,
});
