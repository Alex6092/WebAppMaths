import { defineLevels, definePlugin } from '@app/core';
import { MOMENT_LABEL, MOMENTS, type Moment } from '../../lib/conjugaison';
import { MOMENT_CATEGORIES } from '../../lib/couleurs';
import { indicatorsOf } from '../../lib/indicateurs';

// Variante de CONJ 2, exercice 3 : ranger les indicateurs dans le tableau de la leçon.

interface Params {
  perMoment: number;
  lessonOnly: boolean;
}

interface Data {
  moments: Moment[];
}

export default definePlugin<'classify', Params, Data>('classify', {
  id: 'francais.conjugaison.range-indicateurs',
  version: 1,
  title: 'Range les indicateurs de temps',
  description: 'Glisse chaque étiquette dans la bonne colonne.',
  icon: '🗂️',
  notions: ['francais.conjugaison.indicateurs-temps'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: '6 étiquettes de la leçon', grade: 'CE1', params: { perMoment: 2, lessonOnly: true } },
    { label: '9 étiquettes', grade: 'CE1', params: { perMoment: 3, lessonOnly: false } },
  ]),

  generate({ rng, params }) {
    const items = rng.shuffle(
      MOMENTS.flatMap((m) => rng.sample(indicatorsOf(m, params.lessonOnly), params.perMoment)),
    );
    return {
      widget: 'classify',
      instruction: 'RANGE les indicateurs de temps dans le tableau.',
      layout: 'columns',
      items: items.map((i) => ({ text: i.text })),
      categories: MOMENT_CATEGORIES,
      data: { moments: items.map((i) => i.moment) },
    };
  },

  solve: (q) => ({ placed: [...q.data.moments] }),

  explain: (q) =>
    MOMENTS.map(
      (m) =>
        `${MOMENT_LABEL[m]} : ${q.items
          .filter((_, i) => q.data.moments[i] === m)
          .map((i) => i.text)
          .join(', ')}`,
    ).join(' — '),

  signature: (q) => q.items.map((i) => i.text).join('|'),
});
