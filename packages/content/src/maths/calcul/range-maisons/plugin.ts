import { defineLevels, definePlugin, type ClassifyCategory } from '@app/core';
import { houseTip } from '../../lib/maisons';

// Les sommes égales à 10 et 11 : RANGE chaque addition dans sa maison (et, au niveau 2, celles
// qui ne vont dans aucune : 4 + 5, 6 + 6).

type Place = '10' | '11' | 'autre';

interface Params {
  /** Additions de chaque sorte. */
  each: number;
  /** Aussi des additions qui font 9 ou 12. */
  others: boolean;
}

interface Data {
  placed: Place[];
}

const CATEGORIES: ClassifyCategory[] = [
  { id: '10', label: '🏠 la maison du 10', color: '#e3f2fd' },
  { id: '11', label: '🏠 la maison du 11', color: '#fff3e0' },
  { id: 'autre', label: 'ni 10, ni 11', color: '#eeeeee' },
];

/** Toutes les additions de deux nombres (0 à 11) qui font sum, dans les deux sens. */
const sums = (sum: number, withZero = true) =>
  Array.from({ length: sum + 1 }, (_, a) => [a, sum - a] as const).filter(
    ([a, b]) => withZero || (a > 0 && b > 0 && a <= 10 && b <= 10),
  );

export default definePlugin<'classify', Params, Data>('classify', {
  id: 'maths.calcul.range-maisons',
  version: 1,
  title: 'Range les additions dans leur maison',
  description: '3 + 7 va dans la maison du 10, 5 + 6 dans celle du 11.',
  icon: '🗂️',
  notions: ['maths.calcul.sommes-10-11'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'Six additions', grade: 'CE1', params: { each: 3, others: false } },
    { label: 'Avec des pièges', grade: 'CE1', params: { each: 3, others: true } },
  ]),

  generate({ rng, params }) {
    const pick = (place: Place) =>
      (place === 'autre'
        ? rng.sample([...sums(9, false), ...sums(12, false)], params.each)
        : rng.sample(sums(Number(place)), params.each)
      ).map(([a, b]) => ({ text: `${a} + ${b}`, place }));
    const places: Place[] = params.others ? ['10', '11', 'autre'] : ['10', '11'];
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
    const i = q.data.placed.findIndex((p, k) => answer.placed[k] !== p);
    const item = q.items[Math.max(0, i)]!.text;
    const [a, b] = item.split(' + ').map(Number) as [number, number];
    if (q.data.placed[Math.max(0, i)] === 'autre')
      return `${item} = ${a + b} : ce n’est ni 10 ni 11.`;
    return `${item} = ${a + b}. ${houseTip(a, b)}`;
  },
});
