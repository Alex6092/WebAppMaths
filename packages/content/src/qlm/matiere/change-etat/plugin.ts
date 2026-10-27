import { defineLevels, definePlugin } from '@app/core';
import {
  CHANGE_LABEL,
  CHANGE_RESULT,
  CHANGE_RULE,
  SITUATIONS,
  STATE_ICON,
  STATE_LABEL,
  type Change,
  type State,
} from '../../lib/eau';

// L'eau change d'état : « Le glaçon… fond / gèle / s'évapore », puis « L'eau devient… ».

interface Params {
  /** verb : fondre, geler ou s'évaporer ; state : l'état obtenu. */
  ask: 'verb' | 'state';
}

interface Data {
  change: Change;
  answer: string;
}

const CHANGES: Change[] = ['fond', 'gele', 'evapore'];
const STATES: State[] = ['solide', 'liquide', 'gaz'];

export default definePlugin<'mcq', Params, Data>('mcq', {
  id: 'qlm.matiere.change-etat',
  version: 1,
  title: 'L’eau change d’état',
  description: 'La glace fond, l’eau gèle, la flaque s’évapore.',
  icon: '♨️',
  notions: ['qlm.matiere.etats-eau'],
  expectedLevel: 2,
  minVariety: SITUATIONS.length,
  levels: defineLevels<Params>([
    { label: 'Fondre, geler, s’évaporer', grade: 'CE1', params: { ask: 'verb' } },
    { label: 'Solide, liquide ou gazeuse', grade: 'CE1', params: { ask: 'state' } },
  ]),

  generate({ rng, params }) {
    const situation = rng.pick(SITUATIONS);
    if (params.ask === 'verb')
      return {
        widget: 'mcq',
        instruction: 'LIS et COCHE ce qui se passe.',
        text: situation.text,
        prompt: `${situation.subject}…`,
        choices: CHANGES.map((c) => ({ id: c, label: CHANGE_LABEL[c] })),
        multiple: false,
        layout: 'grid',
        data: { change: situation.change, answer: situation.change },
      };
    const result = CHANGE_RESULT[situation.change];
    return {
      widget: 'mcq',
      instruction: 'LIS et COCHE ce que devient l’eau.',
      text: `${situation.text} ${situation.subject} ${CHANGE_LABEL[situation.change]}.`,
      prompt: 'Alors l’eau devient…',
      choices: STATES.map((s) => ({ id: s, label: STATE_LABEL[s], icon: STATE_ICON[s] })),
      multiple: false,
      layout: 'grid',
      data: { change: situation.change, answer: result },
    };
  },

  solve: (q) => ({ selected: [q.data.answer] }),

  explain: (q) => CHANGE_RULE[q.data.change],

  signature: (q) => `${q.text}`,
});
