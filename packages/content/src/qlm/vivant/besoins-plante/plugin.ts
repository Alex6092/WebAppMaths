import { defineLevels, definePlugin } from '@app/core';
import { EXPERIMENTS, NEED_ICON, NEED_LABEL, PLANT_FACTS, type Need } from '../../lib/vivant';

// Les besoins des plantes : VRAI ou FAUX, puis « De quoi manque-t-elle ? » après une expérience.

interface Params {
  ask: 'fact' | 'experiment';
}

interface Data {
  answer: string;
  text: string;
}

const NEEDS: Need[] = ['eau', 'lumiere', 'chaleur'];

export default definePlugin<'mcq', Params, Data>('mcq', {
  id: 'qlm.vivant.besoins-plante',
  version: 1,
  title: 'Ce dont la plante a besoin',
  description: 'De l’eau, de la lumière, de la chaleur : vrai ou faux, et les expériences.',
  icon: '🪴',
  notions: ['qlm.vivant.plantes'],
  expectedLevel: 2,
  minVariety: EXPERIMENTS.length,
  levels: defineLevels<Params>([
    { label: 'Vrai ou faux', grade: 'CE1', params: { ask: 'fact' } },
    { label: 'Que lui manque-t-il ?', grade: 'CE1', params: { ask: 'experiment' } },
  ]),

  generate({ rng, params }) {
    if (params.ask === 'fact') {
      const fact = rng.pick(PLANT_FACTS);
      return {
        widget: 'mcq',
        instruction: 'COCHE VRAI ou FAUX.',
        prompt: fact.text,
        choices: [
          { id: 'vrai', label: 'VRAI' },
          { id: 'faux', label: 'FAUX' },
        ],
        multiple: false,
        layout: 'row',
        data: { answer: fact.right ? 'vrai' : 'faux', text: fact.text },
      };
    }
    const experiment = rng.pick(EXPERIMENTS);
    return {
      widget: 'mcq',
      instruction: 'LIS l’expérience et COCHE ce qui manque.',
      text: experiment.text,
      prompt: 'Il lui manque…',
      choices: NEEDS.map((n) => ({ id: n, label: NEED_LABEL[n], icon: NEED_ICON[n] })),
      multiple: false,
      layout: 'grid',
      data: { answer: experiment.need, text: experiment.text },
    };
  },

  solve: (q) => ({ selected: [q.data.answer] }),

  explain: (q) =>
    q.data.answer === 'vrai' || q.data.answer === 'faux'
      ? `« ${q.data.text} » : c’est ${q.data.answer}. Une plante a besoin d’eau, de lumière et de chaleur pour vivre et grandir.`
      : `Il lui manque ${NEED_LABEL[q.data.answer as Need]}. Une plante a besoin d’eau, de lumière et de chaleur.`,

  signature: (q) => q.data.text,
});
