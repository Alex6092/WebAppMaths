import { ALIGN_EPSILON, defineLevels, definePlugin, distanceToLine, type Pt } from '@app/core';
import {
  alignsWithNone,
  awayFrom,
  lerp,
  listFr,
  nextLetters,
  noOtherAlignment,
  scatter,
  sideOf,
  spreadAlong,
  towards,
} from '../../lib/geometrie';
import { retry } from '../../../lib/numbers';

// GEOM 1, exercice 2 : « Dans chaque case, RETROUVE les 4 points alignés. RELIE-LES en traçant
// une droite. »

interface Params {
  aligned: number;
  others: number;
  /** Distance minimale des autres points à la droite (cm). */
  offset: number;
}

interface Data {
  aligned: string[];
}

const SIZE = 9;
const MARGIN = 0.8;
/** Écart minimal à l'alignement pour les trios qui ne sont pas la réponse (cm). */
const GAP = 0.3;

interface Layout {
  line: Pt[];
  others: Pt[];
  angle: number;
}

export default definePlugin<'geometry', Params, Data>('geometry', {
  id: 'maths.geometrie.relie-alignes',
  version: 1,
  title: 'Relie les points alignés',
  description: 'Retrouve les points alignés et trace la droite qui passe par eux.',
  icon: '✏️',
  notions: ['maths.geometrie.alignes-identifier'],
  expectedLevel: 3,
  levels: defineLevels<Params>([
    {
      label: '3 points alignés parmi 6',
      grade: 'CE1',
      params: { aligned: 3, others: 3, offset: 1.2 },
    },
    {
      label: '4 points alignés parmi 9',
      grade: 'CE1',
      params: { aligned: 4, others: 5, offset: 0.8 },
    },
    {
      label: '4 points alignés parmi 11',
      grade: 'CE1',
      params: { aligned: 4, others: 7, offset: 0.6 },
    },
  ]),

  generate({ rng, params }) {
    const layout = retry(
      (): Layout | null => {
        // Une droite qui traverse la case : un centre et une direction.
        const angle = rng.int(15, 165);
        const center = { x: 3 + rng.next() * 3, y: 3 + rng.next() * 3 };
        const reach = 3.6;
        const from = towards(center, angle, -reach);
        const to = towards(center, angle, reach);
        const inside = (p: Pt) =>
          p.x > MARGIN && p.x < SIZE - MARGIN && p.y > MARGIN && p.y < SIZE - MARGIN;
        if (!inside(from) || !inside(to)) return null;
        const line = spreadAlong(rng, params.aligned, 0, 1, 1.4 / (2 * reach)).map((t) =>
          lerp(from, to, t),
        );
        try {
          const others = scatter(
            rng,
            params.others,
            { x0: MARGIN, y0: MARGIN, x1: SIZE - MARGIN, y1: SIZE - MARGIN },
            line,
            (p, others) =>
              distanceToLine(p, from, to) >= params.offset &&
              alignsWithNone(p, others, GAP, new Set(line)),
          );
          return { line, others, angle };
        } catch {
          return null;
        }
      },
      (layout) =>
        layout !== null &&
        noOtherAlignment([...layout.line, ...layout.others], new Set(layout.line), GAP),
    )!;

    const names = rng.shuffle(nextLetters(params.aligned + params.others));
    const [a, b] = [layout.line[0]!, layout.line[layout.line.length - 1]!];
    return {
      widget: 'geometry',
      instruction: `RETROUVE les ${params.aligned} points alignés. RELIE-LES en traçant une droite.`,
      figure: {
        width: SIZE,
        height: SIZE,
        frame: true,
        points: [
          ...layout.line.map((p, i) => ({
            id: names[i]!,
            label: names[i]!,
            ...p,
            labelAt: sideOf(layout.angle, i % 2 === 1),
          })),
          ...layout.others.map((p, i) => {
            const id = names[params.aligned + i]!;
            return { id, label: id, ...p, labelAt: awayFrom(p, a, b) };
          }),
        ],
      },
      tools: [{ kind: 'draw', as: 'line' }],
      data: { aligned: names.slice(0, params.aligned).sort() },
    };
  },

  solve: (q) => ({ picked: [], drawn: [[q.data.aligned[0]!, q.data.aligned[1]!]], placed: [] }),

  explain: (q) =>
    `Les points ${listFr(q.data.aligned)} sont sur une même droite : ils sont alignés.`,

  invariants(q) {
    const [a, b] = q.data.aligned.map((id) => q.figure.points.find((p) => p.id === id)!);
    for (const id of q.data.aligned) {
      const p = q.figure.points.find((p) => p.id === id)!;
      if (distanceToLine(p, a!, b!) > ALIGN_EPSILON) return `${id} n'est pas aligné`;
    }
    return undefined;
  },
});
