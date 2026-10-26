import { ALIGN_EPSILON, distance, distanceToLine, figurePoint } from '../geometry';
import type { CheckResult, GeometryAnswer, GeometryQuestion, Mark, PlacedPoint } from '../question';
import type { WidgetDef } from './types';

const MAX_DRAWN = 12;
export const DEFAULT_TOLERANCE = 0.3;

/** Deux tracés sont-ils le même ? Deux droites sont égales si leurs quatre points sont alignés. */
export function sameDrawing(
  q: GeometryQuestion,
  a: [string, string],
  b: [string, string],
  as: 'segment' | 'line',
): boolean {
  if ((a[0] === b[0] && a[1] === b[1]) || (a[0] === b[1] && a[1] === b[0])) return true;
  if (as === 'segment') return false;
  const [p, r, s, t] = [a[0], a[1], b[0], b[1]].map((id) => figurePoint(q.figure, id));
  if (!p || !r || !s || !t) return false;
  return distanceToLine(s, p, r) < ALIGN_EPSILON && distanceToLine(t, p, r) < ALIGN_EPSILON;
}

export interface GeometryRules {
  /** Un point placé est-il juste ? Par défaut : assez près du point de la solution. */
  placed?: (point: PlacedPoint, answer: GeometryAnswer) => boolean;
}

/**
 * Correction d'une figure : points entourés, traits tracés, points placés.
 * Marques : « p:<id> » (entouré), « d:<n> » (tracé n), « l:<nom> » (point placé).
 */
export function checkGeometry(
  q: GeometryQuestion,
  expected: GeometryAnswer,
  given: GeometryAnswer,
  rules: GeometryRules = {},
): CheckResult {
  const marks: Record<string, Mark> = {};
  let good = 0;
  let bad = 0;
  let total = 0;
  const tolerance = q.tolerance ?? DEFAULT_TOLERANCE;

  for (const tool of q.tools) {
    if (tool.kind === 'pick') {
      const want = new Set(expected.picked);
      const got = new Set(given.picked);
      total += want.size;
      for (const id of tool.targets) {
        if (got.has(id) && want.has(id)) {
          marks[`p:${id}`] = 'ok';
          good++;
        } else if (got.has(id)) {
          marks[`p:${id}`] = 'wrong';
          bad++;
        } else if (want.has(id)) marks[`p:${id}`] = 'missing';
      }
    } else if (tool.kind === 'draw' && !tool.help) {
      total += expected.drawn.length;
      const found = new Set<number>();
      given.drawn.forEach((line, i) => {
        const match = expected.drawn.findIndex(
          (e, j) => !found.has(j) && sameDrawing(q, e, line, tool.as),
        );
        if (match === -1) {
          marks[`d:${i}`] = 'wrong';
          bad++;
        } else {
          found.add(match);
          marks[`d:${i}`] = 'ok';
          good++;
        }
      });
    } else if (tool.kind === 'place') {
      for (const label of tool.labels) {
        total++;
        const point = given.placed.find((p) => p.id === label);
        const target = expected.placed.find((p) => p.id === label);
        const ok =
          point !== undefined &&
          (rules.placed
            ? rules.placed(point, given)
            : target !== undefined && distance(point, target) <= tolerance);
        marks[`l:${label}`] = ok ? 'ok' : point ? 'wrong' : 'missing';
        if (ok) good++;
        else if (point) bad++;
      }
    }
  }

  return {
    correct: bad === 0 && good === total,
    score: Math.max(0, good - bad) / Math.max(1, total),
    marks,
  };
}

function isPair(value: unknown, ids: Set<string>): value is [string, string] {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    value[0] !== value[1] &&
    value.every((id) => typeof id === 'string' && ids.has(id))
  );
}

function isPlaced(value: unknown, labels: Set<string>, q: GeometryQuestion): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const { id, x, y } = value as Partial<PlacedPoint>;
  const { width, height } = q.figure;
  return (
    typeof id === 'string' &&
    labels.has(id) &&
    typeof x === 'number' &&
    typeof y === 'number' &&
    x >= -1 &&
    x <= width + 1 &&
    y >= -1 &&
    y <= height + 1
  );
}

export const geometryWidget: WidgetDef<'geometry'> = {
  id: 'geometry',

  emptyAnswer: () => ({ picked: [], drawn: [], placed: [] }),

  validate(q, answer): answer is GeometryAnswer {
    if (typeof answer !== 'object' || answer === null) return false;
    const { picked, drawn, placed } = answer as Partial<GeometryAnswer>;
    const targets = new Set(q.tools.flatMap((t) => (t.kind === 'pick' ? t.targets : [])));
    const labels = new Set(q.tools.flatMap((t) => (t.kind === 'place' ? t.labels : [])));
    const pointIds = new Set(q.figure.points.map((p) => p.id));
    if (!Array.isArray(picked) || !Array.isArray(drawn) || !Array.isArray(placed)) return false;
    return (
      new Set(picked).size === picked.length &&
      picked.every((id) => targets.has(id)) &&
      drawn.length <= MAX_DRAWN &&
      drawn.every((pair) => isPair(pair, pointIds)) &&
      new Set(placed.map((p: PlacedPoint) => p?.id)).size === placed.length &&
      placed.every((p) => isPlaced(p, labels, q))
    );
  },

  isComplete: (q, answer) =>
    q.tools.every((tool) =>
      tool.kind === 'pick'
        ? answer.picked.length > 0
        : tool.kind === 'draw'
          ? tool.help === true || answer.drawn.length > 0
          : tool.labels.every((label) => answer.placed.some((p) => p.id === label)),
    ),

  compare: (q, expected, given) => checkGeometry(q, expected, given),

  retryAnswer(q, given, result) {
    // Les traits d'aide restent : ils ne sont pas corrigés.
    const help = q.tools.some((t) => t.kind === 'draw' && t.help);
    return {
      picked: given.picked.filter((id) => result.marks[`p:${id}`] === 'ok'),
      drawn: help ? given.drawn : given.drawn.filter((_, i) => result.marks[`d:${i}`] === 'ok'),
      placed: given.placed.filter((p) => result.marks[`l:${p.id}`] === 'ok'),
    };
  },

  // La figure se regarde : seule la consigne est lue.
  speech: () => '',
};
