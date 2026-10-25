import { compareBlanks, defineLevels, definePlugin } from '@app/core';
import { MOMENT_LABEL, MOMENTS, type Moment, type VerbKind } from '../../lib/conjugaison';
import { capitalize, indicatorsOf, SIMPLE_INDICATOR } from '../../lib/indicateurs';
import { buildSentence, promptWithBlanks } from '../../lib/phrases';
import { verbsOfKinds } from '../../lib/verbes';

// CONJ 2, exercices 6 et 9 : « COMPLÈTE avec hier, aujourd'hui ou demain »,
// puis « avec un indicateur de temps qui convient ».

interface Params {
  kinds: VerbKind[];
  /** Étiquettes : hier / aujourd'hui / demain, ou deux indicateurs de la leçon par moment. */
  choice: 'simple' | 'lesson';
}

interface Data {
  moment: Moment;
  /** Toutes les étiquettes qui conviennent. */
  accepted: string[];
}

export default definePlugin<'fill-blank', Params, Data>('fill-blank', {
  id: 'francais.conjugaison.complete-indicateur',
  version: 1,
  title: 'Complète avec un indicateur de temps',
  description: 'Hier, aujourd’hui ou demain ? Le verbe te le dit.',
  icon: '🧩',
  notions: ['francais.conjugaison.temps-du-verbe', 'francais.conjugaison.bon-temps'],
  expectedLevel: 3,
  levels: defineLevels<Params>([
    {
      label: 'Hier, aujourd’hui ou demain',
      grade: 'CE1',
      params: { kinds: ['regular'], choice: 'simple' },
    },
    {
      label: 'Hier, aujourd’hui ou demain, tous les verbes',
      grade: 'CE1',
      params: { kinds: ['regular', 'spelling', 'group2', 'irregular'], choice: 'simple' },
    },
    {
      label: 'Un indicateur qui convient',
      grade: 'CE1',
      params: { kinds: ['regular', 'spelling', 'group2', 'irregular'], choice: 'lesson' },
    },
  ]),

  generate({ rng, params }) {
    const moment = rng.pick(MOMENTS);
    const s = buildSentence(rng, { verbs: verbsOfKinds(params.kinds), moment, indicator: 'none' });
    const byMoment = (m: Moment) =>
      params.choice === 'simple'
        ? [SIMPLE_INDICATOR[m]]
        : rng.sample(indicatorsOf(m, true), 2).map((i) => i.text);
    const options = MOMENTS.flatMap(byMoment).map(capitalize);
    const accepted = options.filter((o) => isOf(o, moment));
    return {
      widget: 'fill-blank',
      instruction:
        params.choice === 'simple'
          ? 'COMPLÈTE avec hier, aujourd’hui ou demain.'
          : 'COMPLÈTE avec un indicateur de temps qui convient.',
      prompt: promptWithBlanks(
        { ...s.pieces, indicator: '', indicatorAt: 'start' },
        { indicator: '{0}' },
      ),
      blanks: [{ kind: 'choice', options: rng.shuffle(options) }],
      data: { moment, accepted },
    };
  },

  solve: (q) => ({ values: [q.data.accepted[0]!] }),

  check: (q, answer) => compareBlanks(q, [q.data.accepted], answer),

  explain: (q) =>
    `Le verbe est au ${MOMENT_LABEL[q.data.moment]} : ${q.data.accepted.join(' ou ')} convient.`,

  invariants: (q) => (q.data.accepted.length === 0 ? 'aucune étiquette ne convient' : undefined),

  signature: (q) => q.prompt,
});

function isOf(label: string, moment: Moment): boolean {
  return indicatorsOf(moment).some((i) => capitalize(i.text) === label);
}
