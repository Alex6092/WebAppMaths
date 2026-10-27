import { defineLevels, definePlugin } from '@app/core';
import { SENSE_ACTIONS, SENSES } from '../../lib/vivant';

// « Pour sentir le parfum d'une rose, j'utilise… » : le sens, puis l'organe.

interface Params {
  ask: 'sense' | 'organ';
}

interface Data {
  action: string;
  answer: string;
}

export default definePlugin<'mcq', Params, Data>('mcq', {
  id: 'qlm.vivant.quel-sens',
  version: 1,
  title: 'Quel sens ?',
  description: 'La vue, l’ouïe, l’odorat, le goût, le toucher : lequel j’utilise ?',
  icon: '👃',
  notions: ['qlm.vivant.sens'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'Le sens', grade: 'CE1', params: { ask: 'sense' } },
    { label: 'L’organe', grade: 'CE1', params: { ask: 'organ' } },
  ]),

  generate({ rng, params }) {
    const action = rng.pick(SENSE_ACTIONS);
    const sense = params.ask === 'sense';
    return {
      widget: 'mcq',
      instruction: sense
        ? 'COCHE le sens que j’utilise.'
        : 'COCHE la partie du corps que j’utilise.',
      prompt: `${action.icon} Pour ${action.text}, j’utilise…`,
      choices: SENSES.map((s) => ({ id: s.id, label: sense ? s.sense : s.organ, icon: s.icon })),
      multiple: false,
      layout: 'grid',
      data: { action: action.text, answer: action.sense },
    };
  },

  solve: (q) => ({ selected: [q.data.answer] }),

  explain: (q) => {
    const s = SENSES.find((x) => x.id === q.data.answer)!;
    return `Pour ${q.data.action}, j’utilise ${s.sense} : avec ${s.organ}.`;
  },

  signature: (q) => q.data.action,
});
