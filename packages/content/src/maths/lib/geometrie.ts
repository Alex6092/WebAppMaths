/**
 * Fabrique de figures pour la géométrie de CE1 (GEOM 1 : points alignés, GEOM 2 : segment et
 * milieu). Coordonnées en centimètres, origine en haut à gauche, comme une feuille.
 */
import {
  distance,
  distanceToLine,
  roundCm,
  type FigPoint,
  type FigText,
  type McqChoice,
  type Pt,
  type Rng,
} from '@app/core';

/** Lettres des points : ni O (confondu avec zéro) ni X (confondu avec la croix). */
export const POINT_LETTERS = 'ABCDEFGHIJKLMNPRSTUVYZ'.split('');

/** Les lettres qui suivent A et B, dans l'ordre : C, D, E… */
export const nextLetters = (count: number, skip: string[] = []): string[] =>
  POINT_LETTERS.filter((l) => !skip.includes(l)).slice(0, count);

/** Les lettres qui suivent `letter` (en recommençant à A), sauf celles de `skip`. */
export function lettersAfter(letter: string, count: number, skip: string[] = []): string[] {
  const i = POINT_LETTERS.indexOf(letter);
  const ring = [...POINT_LETTERS.slice(i + 1), ...POINT_LETTERS.slice(0, i)];
  return ring.filter((l) => !skip.includes(l)).slice(0, count);
}

/** Deux lettres qui se suivent, pour nommer un segment : [KL], [ST]… (sans M, gardé au milieu). */
export function segmentLetters(rng: Rng): [string, string] {
  const starts = POINT_LETTERS.filter((l, i) => {
    const next = POINT_LETTERS[i + 1];
    return next !== undefined && l !== 'M' && next !== 'M';
  });
  const first = rng.pick(starts);
  return [first, POINT_LETTERS[POINT_LETTERS.indexOf(first) + 1]!];
}

export const YES_NO: McqChoice[] = [
  { id: 'oui', label: 'OUI' },
  { id: 'non', label: 'NON' },
];

const rad = (degrees: number) => (degrees * Math.PI) / 180;

/** Le point à la distance d de p, dans la direction angle (degrés, sens des aiguilles). */
export function towards(p: Pt, angle: number, d: number): Pt {
  return { x: roundCm(p.x + d * Math.cos(rad(angle))), y: roundCm(p.y + d * Math.sin(rad(angle))) };
}

export const angleOf = (a: Pt, b: Pt): number => (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;

/** Côté où écrire le nom d'un point posé sur un trait : dessus (ou à droite si le trait est raide). */
export function sideOf(angle: number, flip = false): FigPoint['labelAt'] {
  const a = ((angle % 180) + 180) % 180;
  const steep = a > 55 && a < 125;
  if (steep) return flip ? 'w' : 'e';
  return flip ? 's' : 'n';
}

/** Côté d'un point hors d'une droite : on écrit son nom du côté opposé à la droite. */
export function awayFrom(p: Pt, a: Pt, b: Pt): FigPoint['labelAt'] {
  const cross = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
  return sideOf(angleOf(a, b), cross > 0);
}

/** La longueur écrite sous le segment [ab] (« 3 cm »). */
export function lengthText(a: Pt, b: Pt, text: string): FigText {
  const angle = rad(angleOf(a, b));
  return {
    x: roundCm((a.x + b.x) / 2 - 0.6 * Math.sin(angle)),
    y: roundCm((a.y + b.y) / 2 + 0.75 * Math.cos(angle)),
    text,
  };
}

/** Le plus petit écart à l'alignement entre trois points (0 : parfaitement alignés). */
export function alignmentGap(p: Pt, q: Pt, r: Pt): number {
  return Math.min(distanceToLine(p, q, r), distanceToLine(q, p, r), distanceToLine(r, p, q));
}

/** p ne forme un trio presque aligné avec aucune paire de `others` (sauf les paires de `skip`). */
export function alignsWithNone(p: Pt, others: Pt[], minGap: number, skip: Set<Pt>): boolean {
  for (let i = 0; i < others.length; i++) {
    for (let j = i + 1; j < others.length; j++) {
      if (skip.has(others[i]!) && skip.has(others[j]!)) continue;
      if (alignmentGap(p, others[i]!, others[j]!) < minGap) return false;
    }
  }
  return true;
}

/** Aucun trio de points n'est presque aligné, sauf ceux de la liste « aligned ». */
export function noOtherAlignment(points: Pt[], aligned: Set<Pt>, minGap: number): boolean {
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      for (let k = j + 1; k < points.length; k++) {
        const trio = [points[i]!, points[j]!, points[k]!];
        if (trio.every((p) => aligned.has(p))) continue;
        if (alignmentGap(trio[0]!, trio[1]!, trio[2]!) < minGap) return false;
      }
    }
  }
  return true;
}

export interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/**
 * Tire des points dans le cadre, à distance les uns des autres et des points déjà là.
 * `accept` écarte les positions interdites (trop près d'une droite…).
 */
export function scatter(
  rng: Rng,
  count: number,
  box: Box,
  taken: Pt[],
  accept: (p: Pt, others: Pt[]) => boolean = () => true,
  minGap = 1.2,
): Pt[] {
  const out: Pt[] = [];
  for (let n = 0; n < count; n++) {
    let found: Pt | null = null;
    for (let attempt = 0; attempt < 400 && !found; attempt++) {
      const p = {
        x: roundCm(box.x0 + rng.next() * (box.x1 - box.x0)),
        y: roundCm(box.y0 + rng.next() * (box.y1 - box.y0)),
      };
      const others = [...taken, ...out];
      if (others.every((q) => distance(p, q) >= minGap) && accept(p, others)) found = p;
    }
    if (!found) throw new Error('scatter : pas de place pour un point');
    out.push(found);
  }
  return out;
}

/** Positions (de 0 à 1) le long d'un segment, espacées d'au moins `gap` (en fraction). */
export function spreadAlong(rng: Rng, count: number, from: number, to: number, gap: number) {
  for (let attempt = 0; attempt < 400; attempt++) {
    const ts = Array.from({ length: count }, () => from + rng.next() * (to - from)).sort(
      (a, b) => a - b,
    );
    if (ts.every((t, i) => i === 0 || t - ts[i - 1]! >= gap)) return ts;
  }
  throw new Error('spreadAlong : pas de place');
}

export const lerp = (a: Pt, b: Pt, t: number): Pt => ({
  x: roundCm(a.x + (b.x - a.x) * t),
  y: roundCm(a.y + (b.y - a.y) * t),
});

/** Une liste lisible : « C, E et F ». */
export function listFr(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} et ${items[items.length - 1]}`;
}
