import { defineLevels, definePlugin, roundCm, type FigPath, type Rng } from '@app/core';
import { retry } from '../../../lib/numbers';

// GEOM 2, exercice 1 : « ENTOURE les segments. »

type Shape = 'segment' | 'curve' | 'zigzag' | 'wave' | 'bent';

interface Params {
  /** Les autres lignes proposées : bent = presque droite, avec un coude. */
  others: Shape[];
}

interface Data {
  segments: string[];
}

const CELL_W = 4.5;
const CELL_H = 3.4;
const COLUMNS = 3;
const IDS = ['a', 'b', 'c', 'd', 'e', 'f'];

type Points = [number, number][];

function shapePoints(rng: Rng, shape: Shape): { points: Points; smooth: boolean } {
  // Dans une case de 3,2 cm sur 1,6 cm, centrée en (0, 0).
  const w = 1.6;
  const h = 0.8;
  const r = (v: number) => roundCm(v);
  switch (shape) {
    case 'segment': {
      const tilt = (rng.next() * 2 - 1) * h;
      return {
        points: [
          [-w, r(tilt)],
          [w, r(-tilt)],
        ],
        smooth: false,
      };
    }
    case 'curve': {
      const bend = (rng.chance(0.5) ? 1 : -1) * (0.5 + rng.next() * 0.3);
      return {
        points: [
          [-w, r(bend / 2)],
          [-w / 2, r(-bend / 2)],
          [w / 2, r(-bend / 2)],
          [w, r(bend / 2)],
        ],
        smooth: true,
      };
    }
    case 'zigzag': {
      const n = rng.int(3, 4);
      const points: Points = Array.from({ length: n + 1 }, (_, i) => [
        r(-w + (2 * w * i) / n),
        r(i % 2 === 0 ? h : -h),
      ]);
      return { points, smooth: false };
    }
    case 'wave': {
      const points: Points = Array.from({ length: 5 }, (_, i) => [
        r(-w + (2 * w * i) / 4),
        r(i % 2 === 0 ? 0 : (i === 1 ? -h : h) * 0.8),
      ]);
      return { points, smooth: true };
    }
    case 'bent': {
      const corner = (rng.chance(0.5) ? 1 : -1) * (0.35 + rng.next() * 0.2);
      return {
        points: [
          [-w, r(h / 2)],
          [r(rng.next() * 0.8 - 0.4), r(corner)],
          [w, r(-h / 2)],
        ],
        smooth: false,
      };
    }
  }
}

export default definePlugin<'geometry', Params, Data>('geometry', {
  id: 'maths.geometrie.entoure-segments',
  version: 1,
  title: 'Reconnaître un segment',
  description: 'Entoure les traits droits qui s’arrêtent à deux points.',
  icon: '📐',
  notions: ['maths.geometrie.segment'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'Segments et courbes', grade: 'CE1', params: { others: ['curve', 'wave', 'zigzag'] } },
    {
      label: 'Attention aux coudes',
      grade: 'CE1',
      params: { others: ['curve', 'wave', 'zigzag', 'bent'] },
    },
  ]),

  generate({ rng, params }) {
    const count = rng.int(2, 3);
    const shapes = retry(
      () => [
        ...Array.from({ length: count }, (): Shape => 'segment'),
        ...Array.from({ length: 6 - count }, () => rng.pick(params.others)),
      ],
      // Au moins deux sortes de pièges différentes.
      (list) => new Set(list).size >= 3,
    );
    const order = rng.shuffle(shapes);
    const paths: FigPath[] = order.map((shape, i) => {
      const cx = CELL_W * (i % COLUMNS) + CELL_W / 2;
      const cy = CELL_H * Math.floor(i / COLUMNS) + 1.3;
      const { points, smooth } = shapePoints(rng, shape);
      return {
        id: IDS[i]!,
        points: points.map(([x, y]): [number, number] => [roundCm(cx + x), roundCm(cy + y)]),
        smooth,
        dots: true,
        caption: `${IDS[i]}/`,
      };
    });
    return {
      widget: 'geometry',
      instruction: 'ENTOURE les segments.',
      figure: { width: CELL_W * COLUMNS, height: CELL_H * 2, points: [], paths },
      tools: [{ kind: 'pick', targets: IDS }],
      data: { segments: IDS.filter((_, i) => order[i] === 'segment') },
    };
  },

  solve: (q) => ({ picked: q.data.segments, drawn: [], placed: [] }),

  explain: (q) =>
    `Un segment est un trait droit qui s’arrête à deux points. Ici : ${q.data.segments
      .map((id) => `${id}/`)
      .join(', ')}.`,

  signature: (q) => q.figure.paths!.map((p) => JSON.stringify(p.points)).join('|'),
});
