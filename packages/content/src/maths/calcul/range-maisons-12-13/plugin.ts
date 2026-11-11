import { defineLevels, definePlugin, type ClassifyCategory } from '@app/core';
import { houseTip } from '../../lib/maisons';

// Les sommes égales à 12 et 13 : RANGE chaque addition dans sa maison (et, au niveau 2, celles
// qui ne vont dans aucune : 5 + 6, 7 + 7).

type Place = '12' | '13' | 'autre';

interface Params {
  /** Additions de chaque sorte. */
  each: number;
  /** Aussi des additions qui font 11 ou 14. */
  others: boolean;
}

interface Data {
  placed: Place[];
}

const CATEGORIES: ClassifyCategory[] = [
  { id: '12', label: '🏡 la maison du 12', color: '#e8f5e9' },
  { id: '13', label: '🏡 la maison du 13', color: '#f3e5f5' },
  { id: 'autre', label: 'ni 12, ni 13', color: '#eeeeee' },
];

/** Toutes les additions de deux nombres (de 1 à 12) qui font sum, dans les deux sens. */
const sums = (sum: number) =>
  Array.from({ length: sum + 1 }, (_, a) => [a, sum - a] as const).filter(
    ([a, b]) => a > 0 && b > 0 && a <= 12 && b <= 12,
  );

export default definePlugin<'classify', Params, Data>('classify', {
  id: 'maths.calcul.range-maisons-12-13',
  version: 1,
  title: 'Range les additions dans la maison du 12 ou du 13',
  description: '5 + 7 va dans la maison du 12, 6 + 7 dans celle du 13.',
  icon: '🗃️',
  notions: ['maths.calcul.sommes-12-13'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'Six additions', grade: 'CE1', params: { each: 3, others: false } },
    { label: 'Avec des pièges', grade: 'CE1', params: { each: 3, others: true } },
  ]),

  generate({ rng, params }) {
    const pick = (place: Place) =>
      (place === 'autre'
        ? rng.sample([...sums(11), ...sums(14)], params.each)
        : rng.sample(sums(Number(place)), params.each)
      ).map(([a, b]) => ({ text: `${a} + ${b}`, place }));
    const places: Place[] = params.others ? ['12', '13', 'autre'] : ['12', '13'];
    const items = rng.shuffle(places.flatMap(pick));
    return {
      widget: 'classify',
      instruction: 'CALCULE et RANGE chaque addition dans sa maison.',
      layout: 'columns',
      items: items.map((i) => ({ text: i.text })),
      categories: CATEGORIES.filter((c) => places.includes(c.id as Place)),
      data: { placed: items.map((i) => i.place) },
    };
  },

  solve: (q) => ({ placed: [...q.data.placed] }),

  explain(q, answer) {
    // L'explication porte sur la première addition mal rangée.
    const i = Math.max(
      0,
      q.data.placed.findIndex((p, k) => answer.placed[k] !== p),
    );
    const item = q.items[i]!.text;
    const [a, b] = item.split(' + ').map(Number) as [number, number];
    if (q.data.placed[i] === 'autre') return `${item} = ${a + b} : ce n’est ni 12 ni 13.`;
    return `${item} = ${a + b}. ${houseTip(a, b)}`;
  },
});
