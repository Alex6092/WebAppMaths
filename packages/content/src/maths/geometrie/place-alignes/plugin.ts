import {
  checkGeometry,
  defineLevels,
  definePlugin,
  distance,
  distanceToLine,
  roundCm,
  type GeoTool,
  type GeometryAnswer,
  type PluginQuestion,
  type Pt,
} from '@app/core';
import { retry } from '../../../lib/numbers';
import { angleOf, lerp, sideOf, spreadAlong } from '../../lib/geometrie';

// GEOM 1, exercice 3 : « PLACE 2 points D et E qui doivent être alignés avec les 3 points
// A, B et C. »

interface Params {
  /** guide : la droite est déjà tracée en pointillés ; draw : l'enfant la trace ; ruler : à la règle. */
  help: 'guide' | 'draw' | 'ruler';
}

interface Data {
  /** Une position possible pour D et E (pour le corrigé). */
  spots: [Pt, Pt];
}

const WIDTH = 16;
const HEIGHT = 6;
/** Écart permis à la droite (cm), et distance minimale aux autres points. */
const TOLERANCE = 0.3;
const MIN_GAP = 0.6;

function solve(q: PluginQuestion<'geometry', Data>): GeometryAnswer {
  return {
    picked: [],
    drawn: q.tools[0]?.kind === 'draw' ? [[q.figure.points[0]!.id, q.figure.points[1]!.id]] : [],
    placed: [
      { id: 'D', ...q.data.spots[0] },
      { id: 'E', ...q.data.spots[1] },
    ],
  };
}

export default definePlugin<'geometry', Params, Data>('geometry', {
  id: 'maths.geometrie.place-alignes',
  version: 1,
  title: 'Place des points alignés',
  description: 'Place deux nouveaux points sur la même droite que A, B et C.',
  icon: '📍',
  notions: ['maths.geometrie.alignes-placer'],
  expectedLevel: 3,
  levels: defineLevels<Params>([
    { label: 'La droite est tracée', grade: 'CE1', params: { help: 'guide' } },
    { label: 'Je trace la droite', grade: 'CE1', params: { help: 'draw' } },
    { label: 'Avec la règle', grade: 'CE1', params: { help: 'ruler' } },
  ]),

  generate({ rng, params }) {
    const a = { x: roundCm(2.5 + rng.next() * 2), y: roundCm(1 + rng.next() * 4) };
    const b = { x: roundCm(11.5 + rng.next() * 2), y: roundCm(1 + rng.next() * 4) };
    const angle = angleOf(a, b);
    // Positions sur la droite (0 en A, 1 en B) : C, puis deux places libres pour D et E.
    const spread = retry(
      () => spreadAlong(rng, 3, -0.12, 1.12, 0.14),
      (ts) => ts.every((t) => Math.abs(t) >= 0.14 && Math.abs(t - 1) >= 0.14),
    );
    const [t1, t2, t3] = rng.shuffle(spread);
    const c = lerp(a, b, t1!);
    const names = rng.shuffle(['A', 'B', 'C']);
    const points = [a, b, c].map((p, i) => ({
      id: names[i]!,
      label: names[i]!,
      ...p,
      labelAt: sideOf(angle),
    }));
    const tools: GeoTool[] =
      params.help === 'draw'
        ? [
            { kind: 'draw', as: 'line', help: true },
            { kind: 'place', labels: ['D', 'E'] },
          ]
        : [{ kind: 'place', labels: ['D', 'E'] }];
    return {
      widget: 'geometry',
      instruction: 'PLACE 2 points D et E alignés avec les points A, B et C.',
      figure: {
        width: WIDTH,
        height: HEIGHT,
        points,
        ...(params.help === 'guide'
          ? { segments: [{ from: names[0]!, to: names[1]!, kind: 'line' as const, dashed: true }] }
          : {}),
        ...(params.help === 'ruler' ? { ruler: true } : {}),
      },
      tools,
      tolerance: TOLERANCE,
      data: { spots: [lerp(a, b, t2!), lerp(a, b, t3!)] },
    };
  },

  solve,

  check(q, answer) {
    const [a, b] = q.figure.points;
    return checkGeometry(q, solve(q), answer, {
      placed: (p, all) =>
        distanceToLine(p, a!, b!) <= TOLERANCE &&
        [...q.figure.points, ...all.placed.filter((o) => o.id !== p.id)].every(
          (o) => distance(o, p) >= MIN_GAP,
        ),
    });
  },

  explain: () =>
    'Pose ta règle sur A, B et C, trace la droite, puis place D et E sur ce trait, ' +
    'un peu loin des autres points.',

  invariants(q) {
    const [a, b, c] = q.figure.points;
    if (distanceToLine(c!, a!, b!) > 0.05) return 'C pas aligné';
    for (const s of q.data.spots) {
      if (s.x < 0.4 || s.x > WIDTH - 0.4 || s.y < 0.4 || s.y > HEIGHT - 0.4)
        return 'place hors figure';
    }
    return undefined;
  },
});
