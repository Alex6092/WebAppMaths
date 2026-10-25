import { defineLevels, definePlugin } from '@app/core';
import {
  conjugate,
  MOMENT_LABEL,
  MOMENTS,
  startsWithVowel,
  TENSES,
  type Moment,
  type VerbKind,
} from '../../lib/conjugaison';
import { buildSentence, promptWithBlanks } from '../../lib/phrases';
import { verbsOfKinds } from '../../lib/verbes';
import { retry } from '../../../lib/numbers';

// CONJ 2, exercice 8 : « ENTOURE le bon verbe. » Hier, Léo ( joue – jouait – jouera ) au ballon.

interface Params {
  kinds: VerbKind[];
}

interface Data {
  moment: Moment;
  form: string;
  indicator: string;
}

export default definePlugin<'fill-blank', Params, Data>('fill-blank', {
  id: 'francais.conjugaison.choisis-verbe',
  version: 1,
  title: 'Choisis le bon verbe',
  description: 'L’indicateur de temps t’aide à choisir le verbe.',
  icon: '🎯',
  notions: ['francais.conjugaison.bon-temps'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'Verbes en -er', grade: 'CE1', params: { kinds: ['regular'] } },
    {
      label: 'Verbes en -er qui changent, et finir',
      grade: 'CE1',
      params: { kinds: ['spelling', 'group2'] },
    },
    { label: 'Être, avoir, aller, faire…', grade: 'CE1', params: { kinds: ['irregular'] } },
  ]),

  generate({ rng, params }) {
    // « je » devant un trou ne marche pas avec un verbe qui commence par une voyelle (j'aime).
    const s = retry(
      () =>
        buildSentence(rng, {
          verbs: verbsOfKinds(params.kinds),
          moment: rng.pick(MOMENTS),
          indicator: 'any',
        }),
      (x) => !(x.person === 0 && startsWithVowel(x.pieces.form)),
    );
    const options = TENSES.map((t) => conjugate(s.verb.inf, t, s.person));
    return {
      widget: 'fill-blank',
      instruction: 'CHOISIS le bon verbe.',
      prompt: promptWithBlanks(s.pieces, { form: '{0}' }),
      blanks: [{ kind: 'choice', options }],
      data: { moment: s.moment, form: s.pieces.form, indicator: s.indicator!.text },
    };
  },

  solve: (q) => ({ values: [q.data.form] }),

  explain: (q) =>
    `« ${q.data.indicator} » indique le ${MOMENT_LABEL[q.data.moment]} : on écrit « ${q.data.form} ».`,

  invariants: (q) =>
    q.blanks[0]?.kind === 'choice' && new Set(q.blanks[0].options).size === 3
      ? undefined
      : 'étiquettes en double',

  signature: (q) => q.prompt,
});
