import { ALIGN_EPSILON, distanceToSegment, type FigPoint, type Figure, type Pt } from '@app/core';

/** Taille d'un centimètre de figure à l'écran, au plus (px). */
export const PX_PER_CM = 46;

/**
 * Place un texte en (x, y) cm. Le texte est écrit à l'échelle 1/20 (10px → 0,5 cm) :
 * certains navigateurs grossissent les polices de moins de 1px.
 */
export const textAt = (x: number, y: number): string => `translate(${x} ${y}) scale(0.05)`;

/** Position du pointeur en centimètres de figure. */
export function toFigure(svg: SVGSVGElement, event: { clientX: number; clientY: number }): Pt {
  const matrix = svg.getScreenCTM();
  if (!matrix) return { x: 0, y: 0 };
  const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
  return { x: p.x, y: p.y };
}

/** Les deux bouts visibles de la droite (ab), coupée aux bords de la figure. */
export function clipLine(a: Pt, b: Pt, width: number, height: number): [Pt, Pt] {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  let t0 = -Infinity;
  let t1 = Infinity;
  for (const [p, d, max] of [
    [a.x, dx, width],
    [a.y, dy, height],
  ] as const) {
    if (d === 0) continue;
    const ta = (0 - p) / d;
    const tb = (max - p) / d;
    t0 = Math.max(t0, Math.min(ta, tb));
    t1 = Math.min(t1, Math.max(ta, tb));
  }
  if (!Number.isFinite(t0) || !Number.isFinite(t1)) return [a, b];
  return [
    { x: a.x + t0 * dx, y: a.y + t0 * dy },
    { x: a.x + t1 * dx, y: a.y + t1 * dy },
  ];
}

const LABEL_OFFSETS: Record<NonNullable<FigPoint['labelAt']>, [number, number, string]> = {
  n: [0, -0.38, 'middle'],
  s: [0, 0.72, 'middle'],
  e: [0.32, 0.18, 'start'],
  w: [-0.32, 0.18, 'end'],
  ne: [0.22, -0.28, 'start'],
  nw: [-0.22, -0.28, 'end'],
  se: [0.22, 0.62, 'start'],
  sw: [-0.22, 0.62, 'end'],
};

/** Où écrire le nom d'un point : décalage et ancrage du texte. */
export function labelOffset(at: FigPoint['labelAt']): { dx: number; dy: number; anchor: string } {
  const [dx, dy, anchor] = LABEL_OFFSETS[at ?? 'n'];
  return { dx, dy, anchor };
}

/** Chemin SVG passant par les points ; courbe lissée (Catmull-Rom) si smooth. */
export function pathData(points: [number, number][], smooth = false): string {
  if (points.length === 0) return '';
  const [first, ...rest] = points;
  if (!smooth || points.length < 3) {
    return `M${first![0]},${first![1]}` + rest.map(([x, y]) => ` L${x},${y}`).join('');
  }
  let d = `M${first![0]},${first![1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
  }
  return d;
}

/** Rectangle qui entoure un trait libre. */
export function bounds(points: [number, number][]): { x: number; y: number; w: number; h: number } {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

/** Direction (vecteur unitaire) du segment de la figure qui passe par ce point, s'il y en a un. */
export function segmentDirection(figure: Figure, point: Pt): Pt | null {
  for (const s of figure.segments ?? []) {
    const a = figure.points.find((p) => p.id === s.from);
    const b = figure.points.find((p) => p.id === s.to);
    if (!a || !b || distanceToSegment(point, a, b) > ALIGN_EPSILON) continue;
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    if (length > 0) return { x: (b.x - a.x) / length, y: (b.y - a.y) / length };
  }
  return null;
}
