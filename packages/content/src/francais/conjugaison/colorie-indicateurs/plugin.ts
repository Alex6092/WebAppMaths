import { defineLevels, definePlugin } from '@app/core';
import { MOMENTS, type Moment } from '../../lib/conjugaison';
import { MOMENT_PICKS } from '../../lib/couleurs';
import { indicatorsOf } from '../../lib/indicateurs';

// CONJ 2, exercice 3 : « COLORIE les indicateurs de temps » (passé bleu, présent orange, futur vert).

interface Params {
  size: number;
  lessonOnly: boolean;
}

interface Data {
  moments: Moment[];
}

export default definePlugin<'word-select', Params, Data>('word-select', {
  id: 'francais.conjugaison.colorie-indicateurs',
  version: 1,
  title: 'Colorie les indicateurs de temps',
  description: 'Le passé en bleu, le présent en orange, le futur en vert.',
  icon: '🎨',
  notions: ['francais.conjugaison.indicateurs-temps'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: '6 indicateurs de la leçon', grade: 'CE1', params: { size: 6, lessonOnly: true } },
    { label: '9 indicateurs de la leçon', grade: 'CE1', params: { size: 9, lessonOnly: true } },
    {
      label: '12 indicateurs (et d’autres)',
      grade: 'CE1',
      params: { size: 12, lessonOnly: false },
    },
  ]),

  generate({ rng, params }) {
    // Autant de chaque moment (le présent n'a que 4 indicateurs dans la leçon).
    const perMoment = params.size / 3;
    const items = rng.shuffle(
      MOMENTS.flatMap((m) =>
        rng.sample(
          indicatorsOf(m, params.lessonOnly),
          Math.min(perMoment, indicatorsOf(m, params.lessonOnly).length),
        ),
      ),
    );
    return {
      widget: 'word-select',
      instruction: 'COLORIE les indicateurs de temps.',
      layout: 'grid',
      mark: 'color',
      tokens: items.map((i) => ({ text: i.text })),
      colors: MOMENT_PICKS,
      data: { moments: items.map((i) => i.moment) },
    };
  },

  solve: (q) => ({ picks: [...q.data.moments] }),

  explain: () =>
    'Passé : hier, autrefois… Présent : maintenant, en ce moment… Futur : demain, dans 2 jours…',

  signature: (q) => q.tokens.map((t) => t.text).join('|'),
});
