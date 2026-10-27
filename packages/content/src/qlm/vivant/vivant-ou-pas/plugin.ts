import { defineLevels, definePlugin } from '@app/core';
import { THINGS } from '../../lib/vivant';

// « RANGE : vivant ou non vivant ? », puis avec les pièges (le robot bouge, la graine non).

interface Params {
  tricky: boolean;
}

interface Data {
  placed: ('vivant' | 'non-vivant')[];
}

export default definePlugin<'classify', Params, Data>('classify', {
  id: 'qlm.vivant.vivant-ou-pas',
  version: 1,
  title: 'Vivant ou non vivant ?',
  description: 'Le chat, l’arbre, la graine sont vivants ; le caillou, le robot ne le sont pas.',
  icon: '🌳',
  notions: ['qlm.vivant.vivant-non-vivant'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'Six images', grade: 'CE1', params: { tricky: false } },
    { label: 'Avec des pièges', grade: 'CE1', params: { tricky: true } },
  ]),

  generate({ rng, params }) {
    const pool = (alive: boolean) => THINGS.filter((t) => t.alive === alive);
    const pick = (alive: boolean) => {
      if (!params.tricky)
        return rng.sample(
          pool(alive).filter((t) => !t.tricky),
          3,
        );
      // Deux pièges et deux évidents de chaque côté.
      return [
        ...rng.sample(
          pool(alive).filter((t) => t.tricky),
          2,
        ),
        ...rng.sample(
          pool(alive).filter((t) => !t.tricky),
          2,
        ),
      ];
    };
    const items = rng.shuffle([...pick(true), ...pick(false)]);
    return {
      widget: 'classify',
      instruction: 'RANGE : est-ce vivant ou non vivant ?',
      layout: 'columns',
      items: items.map((t) => ({ text: t.name, icon: t.icon })),
      categories: [
        { id: 'vivant', label: 'vivant', color: '#e8f5e9' },
        { id: 'non-vivant', label: 'non vivant', color: '#eceff1' },
      ],
      data: { placed: items.map((t) => (t.alive ? 'vivant' : 'non-vivant')) },
    };
  },

  solve: (q) => ({ placed: [...q.data.placed] }),

  explain: () =>
    'Un être vivant naît, se nourrit, grandit, se reproduit et meurt. Une voiture ou un robot bougent, mais ils ne grandissent pas : ils ne sont pas vivants.',
});
