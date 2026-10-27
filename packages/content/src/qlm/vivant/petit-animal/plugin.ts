import { defineLevels, definePlugin } from '@app/core';
import { BABIES } from '../../lib/animaux';

// « Le petit de la vache s'appelle… » : le veau, le poussin, l'agneau…

interface Data {
  answer: number;
}

const capitalized = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** « de la vache », « de l’ourse », « du papillon » */
const of = (parent: string) =>
  parent.startsWith('le ') ? `du ${parent.slice(3)}` : `de ${parent}`;

export default definePlugin<'mcq', Record<string, never>, Data>('mcq', {
  id: 'qlm.vivant.petit-animal',
  version: 1,
  title: 'Les petits des animaux',
  description: 'Le petit de la vache est le veau ; celui de la poule, le poussin.',
  icon: '🐣',
  notions: ['qlm.vivant.cycles'],
  levels: defineLevels<Record<string, never>>([
    { label: 'Le nom du petit', grade: 'CE1', params: {} },
  ]),

  generate({ rng }) {
    const answer = rng.int(0, BABIES.length - 1);
    const others = rng.sample(
      BABIES.map((_, i) => i).filter((i) => i !== answer),
      3,
    );
    const { parent, icon } = BABIES[answer]!;
    return {
      widget: 'mcq',
      instruction: 'COCHE le nom du petit.',
      prompt: `${icon} Le petit ${of(parent)} s’appelle…`,
      choices: rng
        .shuffle([answer, ...others])
        .map((i) => ({ id: String(i), label: BABIES[i]!.baby })),
      multiple: false,
      layout: 'grid',
      data: { answer },
    };
  },

  solve: (q) => ({ selected: [String(q.data.answer)] }),

  explain: (q) => {
    const { parent, baby } = BABIES[q.data.answer]!;
    return `${capitalized(baby)} est le petit ${of(parent)}.`;
  },
});
