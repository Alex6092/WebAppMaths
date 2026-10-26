import {
  ALIGN_EPSILON,
  defineLevels,
  definePlugin,
  distanceToLine,
  type FigPoint,
} from '@app/core';
import {
  awayFrom,
  angleOf,
  lerp,
  listFr,
  nextLetters,
  scatter,
  sideOf,
  spreadAlong,
} from '../../lib/geometrie';

// GEOM 1, exercice 1 : « TRACE le segment [AB]. Quels sont les points alignés avec A et B ? »

interface Params {
  aligned: number;
  others: number;
  /** Écart des autres points au segment (cm) : petit = pièges presque alignés. */
  offset: [number, number];
  /** Pente maximale de [AB] (écart de hauteur entre A et B, en cm). */
  tilt: number;
}

interface Data {
  aligned: string[];
}

const WIDTH = 16;
const HEIGHT = 7;

export default definePlugin<'geometry', Params, Data>('geometry', {
  id: 'maths.geometrie.trace-alignes',
  version: 1,
  title: 'Trace et trouve les points alignés',
  description: 'Trace le segment [AB], puis entoure les points qui sont dessus.',
  icon: '📏',
  notions: ['maths.geometrie.alignes-identifier'],
  expectedLevel: 3,
  levels: defineLevels<Params>([
    {
      label: '2 points alignés',
      grade: 'CE1',
      params: { aligned: 2, others: 3, offset: [1.3, 3], tilt: 2 },
    },
    {
      label: '3 points alignés',
      grade: 'CE1',
      params: { aligned: 3, others: 4, offset: [0.9, 2.5], tilt: 4 },
    },
    {
      label: 'Des points presque alignés',
      grade: 'CE1',
      params: { aligned: 4, others: 4, offset: [0.45, 1.4], tilt: 4.5 },
    },
  ]),

  generate({ rng, params }) {
    const yA = 1 + rng.next() * (HEIGHT - 2);
    const yB = Math.max(1, Math.min(HEIGHT - 1, yA + (rng.next() * 2 - 1) * params.tilt));
    const flip = rng.chance(0.5);
    const a = { x: flip ? 14.8 : 1.2, y: Math.round(yA * 100) / 100 };
    const b = { x: flip ? 1.2 : 14.8, y: Math.round(yB * 100) / 100 };
    const angle = angleOf(a, b);

    const onLine = spreadAlong(rng, params.aligned, 0.12, 0.88, 1.3 / 13.6).map((t) =>
      lerp(a, b, t),
    );
    const [lo, hi] = params.offset;
    const off = scatter(
      rng,
      params.others,
      { x0: 2, y0: 0.6, x1: WIDTH - 2, y1: HEIGHT - 0.6 },
      [a, b, ...onLine],
      (p) => {
        const d = distanceToLine(p, a, b);
        return d >= lo && d <= hi;
      },
    );

    const names = rng.shuffle(nextLetters(params.aligned + params.others, ['A', 'B']));
    const alignedNames = names.slice(0, params.aligned);
    const points: FigPoint[] = [
      { id: 'A', label: 'A', ...a, labelAt: sideOf(angle, true) },
      { id: 'B', label: 'B', ...b, labelAt: sideOf(angle, true) },
      ...onLine.map((p, i) => ({
        id: alignedNames[i]!,
        label: alignedNames[i]!,
        ...p,
        labelAt: sideOf(angle, rng.chance(0.5)),
      })),
      ...off.map((p, i) => {
        const id = names[params.aligned + i]!;
        return { id, label: id, ...p, labelAt: awayFrom(p, a, b) };
      }),
    ];

    return {
      widget: 'geometry',
      instruction: 'TRACE le segment [AB], puis ENTOURE les points alignés avec A et B.',
      figure: { width: WIDTH, height: HEIGHT, points },
      tools: [
        { kind: 'draw', as: 'segment' },
        { kind: 'pick', targets: names },
      ],
      data: { aligned: [...alignedNames].sort() },
    };
  },

  solve: (q) => ({ picked: q.data.aligned, drawn: [['A', 'B']], placed: [] }),

  explain: (q) =>
    `Les points ${listFr(q.data.aligned)} sont sur le segment [AB] : ils sont alignés avec A et B.`,

  invariants(q, { params }) {
    const a = q.figure.points.find((p) => p.id === 'A')!;
    const b = q.figure.points.find((p) => p.id === 'B')!;
    for (const p of q.figure.points) {
      const d = distanceToLine(p, a, b);
      const aligned = p.id === 'A' || p.id === 'B' || q.data.aligned.includes(p.id);
      if (aligned && d > ALIGN_EPSILON) return `${p.id} devrait être aligné`;
      if (!aligned && d < params.offset[0] - 0.01) return `${p.id} trop près du segment`;
    }
    return undefined;
  },
});
