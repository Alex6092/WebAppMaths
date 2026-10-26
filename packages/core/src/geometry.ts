/** Calculs sur les figures de géométrie (coordonnées en centimètres). */
import type { Figure, PlacedPoint } from './question';

export interface Pt {
  x: number;
  y: number;
}

/** En dessous de cet écart (cm), trois points sont considérés comme alignés. */
export const ALIGN_EPSILON = 0.05;

export const distance = (a: Pt, b: Pt): number => Math.hypot(a.x - b.x, a.y - b.y);

export const midpoint = (a: Pt, b: Pt): Pt => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

/** Distance du point p à la droite (ab). */
export function distanceToLine(p: Pt, a: Pt, b: Pt): number {
  const length = distance(a, b);
  if (length === 0) return distance(p, a);
  return Math.abs((b.x - a.x) * (a.y - p.y) - (a.x - p.x) * (b.y - a.y)) / length;
}

/** Projection de p sur la droite (ab), avec sa position t (0 en a, 1 en b). */
export function projectOnLine(p: Pt, a: Pt, b: Pt): Pt & { t: number } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length2 = dx * dx + dy * dy;
  const t = length2 === 0 ? 0 : ((p.x - a.x) * dx + (p.y - a.y) * dy) / length2;
  return { x: a.x + t * dx, y: a.y + t * dy, t };
}

/** Distance du point p au segment [ab]. */
export function distanceToSegment(p: Pt, a: Pt, b: Pt): number {
  const { t } = projectOnLine(p, a, b);
  const c = Math.max(0, Math.min(1, t));
  return distance(p, { x: a.x + c * (b.x - a.x), y: a.y + c * (b.y - a.y) });
}

/** Un point de la figure, ou un point placé par l'enfant. */
export function figurePoint(
  figure: Figure,
  id: string,
  placed: readonly PlacedPoint[] = [],
): Pt | undefined {
  return figure.points.find((p) => p.id === id) ?? placed.find((p) => p.id === id);
}

/** Arrondi au centième de cm : des questions JSON courtes et stables. */
export const roundCm = (value: number): number => Math.round(value * 100) / 100;
