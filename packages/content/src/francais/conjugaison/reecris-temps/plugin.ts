import { compareBlanks, defineLevels, definePlugin } from '@app/core';
import {
  acceptedForms,
  MOMENT_LABEL,
  MOMENT_TENSE,
  MOMENTS,
  startsWithVowel,
  type Moment,
  type VerbKind,
} from '../../lib/conjugaison';
import { capitalize, indicatorsOf, SIMPLE_INDICATOR } from '../../lib/indicateurs';
import { assemble, buildSentence, promptWithBlanks } from '../../lib/phrases';
import { verbsOfKinds } from '../../lib/verbes';
import { retry } from '../../../lib/numbers';

// CONJ 2, exercice 10 : « RÉÉCRIS chaque phrase au temps demandé. »
// L'enfant choisit l'indicateur (étiquettes) et tape le verbe conjugué.

interface Params {
  kinds: VerbKind[];
  /** Étiquettes : hier / aujourd'hui / demain, ou deux indicateurs de la leçon par moment. */
  choice: 'simple' | 'lesson';
}

interface Data {
  target: Moment;
  indicators: string[];
  forms: string[];
  answer: string;
}

export default definePlugin<'fill-blank', Params, Data>('fill-blank', {
  id: 'francais.conjugaison.reecris-temps',
  version: 1,
  title: 'Réécris la phrase au bon temps',
  description: 'Change l’indicateur de temps et le verbe.',
  icon: '🔁',
  notions: ['francais.conjugaison.bon-temps'],
  expectedLevel: 3,
  levels: defineLevels<Params>([
    { label: 'Verbes en -er', grade: 'CE1', params: { kinds: ['regular'], choice: 'simple' } },
    {
      label: 'Verbes en -er qui changent, et finir',
      grade: 'CE1',
      params: { kinds: ['regular', 'spelling', 'group2'], choice: 'lesson' },
    },
    {
      label: 'Être, avoir, aller, faire…',
      grade: 'CE1',
      params: { kinds: ['irregular'], choice: 'lesson' },
    },
  ]),

  generate({ rng, params }) {
    const [from, target] = rng.sample(MOMENTS, 2) as [Moment, Moment];
    const s = retry(
      () =>
        buildSentence(rng, {
          verbs: verbsOfKinds(params.kinds),
          moment: from,
          indicator: 'start',
          lessonIndicators: true,
        }),
      (x) => !(x.person === 0 && startsWithVowel(x.verb.inf)),
    );
    const forms = acceptedForms(s.verb.inf, MOMENT_TENSE[target], s.person);
    const byMoment = (m: Moment) =>
      params.choice === 'simple'
        ? [SIMPLE_INDICATOR[m]]
        : rng.sample(indicatorsOf(m, true), 2).map((i) => i.text);
    const options = MOMENTS.flatMap(byMoment).map(capitalize);
    const indicators = options.filter((o) =>
      indicatorsOf(target).some((i) => capitalize(i.text) === o),
    );
    const answer = assemble({ ...s.pieces, indicator: indicators[0]!, form: forms[0]! }).text;
    return {
      widget: 'fill-blank',
      instruction: 'RÉÉCRIS la phrase au temps demandé.',
      prompt: `${s.text}\n→ au ${MOMENT_LABEL[target]} :\n${promptWithBlanks(s.pieces, { indicator: '{0}', form: '{1}' })}`,
      blanks: [{ kind: 'choice', options: rng.shuffle(options) }, { kind: 'text' }],
      data: { target, indicators, forms, answer },
    };
  },

  solve: (q) => ({ values: [q.data.indicators[0]!, q.data.forms[0]!] }),

  check: (q, answer) => compareBlanks(q, [q.data.indicators, q.data.forms], answer),

  explain: (q) => `Au ${MOMENT_LABEL[q.data.target]} : ${q.data.answer}`,

  signature: (q) => q.prompt.split('\n').slice(0, 2).join(' '),
});
