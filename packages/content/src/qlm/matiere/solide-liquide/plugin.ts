import { defineLevels, definePlugin } from '@app/core';
import { STATE_ICON, WATERS } from '../../lib/eau';

// « RANGE : l'eau est-elle solide ou liquide ? » : le glaçon, la neige, la pluie, la mer…

interface Params {
  each: number;
}

interface Data {
  placed: ('solide' | 'liquide')[];
}

export default definePlugin<'classify', Params, Data>('classify', {
  id: 'qlm.matiere.solide-liquide',
  version: 1,
  title: 'L’eau solide ou liquide',
  description: 'Le glaçon et la neige sont de l’eau solide ; la pluie et la mer, de l’eau liquide.',
  icon: '🧊',
  notions: ['qlm.matiere.etats-eau'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'Quatre images', grade: 'CE1', params: { each: 2 } },
    { label: 'Six images', grade: 'CE1', params: { each: 3 } },
  ]),

  generate({ rng, params }) {
    const items = rng.shuffle(
      (['solide', 'liquide'] as const).flatMap((state) =>
        rng.sample(
          WATERS.filter((w) => w.state === state),
          params.each,
        ),
      ),
    );
    return {
      widget: 'classify',
      instruction: 'RANGE : cette eau est-elle solide ou liquide ?',
      layout: 'columns',
      items: items.map((w) => ({ text: w.name, icon: w.icon })),
      categories: [
        { id: 'solide', label: `${STATE_ICON.solide} eau solide`, color: '#e3f2fd' },
        { id: 'liquide', label: `${STATE_ICON.liquide} eau liquide`, color: '#e0f7fa' },
      ],
      data: { placed: items.map((w) => w.state) },
    };
  },

  solve: (q) => ({ placed: [...q.data.placed] }),

  explain: () =>
    'L’eau solide (la glace, la neige) garde sa forme : on peut la prendre dans la main. L’eau liquide coule et prend la forme de ce qui la contient.',
});
