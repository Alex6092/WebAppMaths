import { defineLevels, definePlugin, type Rng } from '@app/core';
import { MOMENT_LABEL, MOMENTS, type Moment } from '../../lib/conjugaison';
import { capitalize, LESSON_INDICATORS } from '../../lib/indicateurs';

// CONJ 2, exercice 2 : « Dis si c'est VRAI ou FAUX. »

interface Params {
  /** Énoncés sur la leçon (« le verbe conjugué indique le moment… ») en plus des indicateurs. */
  rules: boolean;
}

interface Data {
  truth: boolean;
  moment: Moment | null;
}

const WHEN: Record<Moment, string> = {
  passe: 's’est passée avant',
  present: 'se passe maintenant',
  futur: 'se passera après',
};

const RULES: [string, boolean][] = [
  ['Le verbe conjugué indique le moment où se passe l’action.', true],
  ['Le passé, c’est ce qui se passera après.', false],
  ['Le présent, c’est ce qui se passe maintenant.', true],
  ['Le futur, c’est ce qui s’est passé avant.', false],
  ['Le futur, c’est ce qui se passera après.', true],
  ['Le passé, c’est ce qui s’est passé avant.', true],
  ['Les indicateurs de temps aident à trouver le moment de l’action.', true],
];

function indicatorStatement(rng: Rng): { text: string; truth: boolean; moment: Moment } {
  const indicator = rng.pick(LESSON_INDICATORS);
  const truth = rng.chance(0.5);
  const said = truth ? indicator.moment : rng.pick(MOMENTS.filter((m) => m !== indicator.moment));
  const quoted = `« ${capitalize(indicator.text)} »`;
  const text = rng.pick([
    `${quoted} est un indicateur de temps du ${MOMENT_LABEL[said]}.`,
    `${quoted} indique que l’action est au ${MOMENT_LABEL[said]}.`,
    `${quoted} indique que l’action ${WHEN[said]}.`,
  ]);
  return { text, truth, moment: indicator.moment };
}

export default definePlugin<'mcq', Params, Data>('mcq', {
  id: 'francais.conjugaison.vrai-faux-temps',
  version: 1,
  title: 'Vrai ou faux ?',
  description: 'Les indicateurs de temps : vrai ou faux ?',
  icon: '✅',
  notions: ['francais.conjugaison.passe-present-futur'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'Les indicateurs de temps', grade: 'CE1', params: { rules: false } },
    { label: 'Les indicateurs et la leçon', grade: 'CE1', params: { rules: true } },
  ]),

  generate({ rng, params }) {
    let statement: { text: string; truth: boolean; moment: Moment | null };
    if (params.rules && rng.chance(0.35)) {
      const [text, truth] = rng.pick(RULES);
      statement = { text, truth, moment: null };
    } else statement = indicatorStatement(rng);
    return {
      widget: 'mcq',
      instruction: 'Dis si c’est VRAI ou FAUX.',
      prompt: statement.text,
      choices: [
        { id: 'vrai', label: 'VRAI' },
        { id: 'faux', label: 'FAUX' },
      ],
      multiple: false,
      layout: 'row',
      data: { truth: statement.truth, moment: statement.moment },
    };
  },

  solve: (q) => ({ selected: [q.data.truth ? 'vrai' : 'faux'] }),

  explain(q) {
    if (!q.data.moment)
      return q.data.truth ? 'C’est vrai, c’est dans la leçon.' : 'C’est faux : relis la leçon.';
    return `C’est un indicateur du ${MOMENT_LABEL[q.data.moment]} : l’action ${WHEN[q.data.moment]}.`;
  },

  signature: (q) => q.prompt ?? '',
});
