import { ledgerLines, staffPosition, type Clef, type StaffItem } from '@app/core';

/**
 * Mise en page d'une portée, en unités du dessin : 10 entre deux lignes, la 1re ligne en y = 0,
 * la 5e en y = −40. Dans un grand système, la portée de clé de sol est au-dessus, décalée de
 * TREBLE_SHIFT.
 */
export const HALF = 5;
export const TREBLE_SHIFT = -70;
const CLEF_WIDTH = 38;
const TIME_WIDTH = 20;
const NOTE_WIDTH = 34;
const BAR_WIDTH = 14;
const ACC_WIDTH = 12;

export type StaffKind = Clef | 'grand' | 'rhythm';

export interface PlacedItem {
  item: StaffItem;
  x: number;
  /** Place sur la portée (demi-interlignes au-dessus de la 1re ligne de sa portée). */
  position: number;
  /** Hauteur dans le dessin. */
  y: number;
  /** Sur la portée du bas d'un grand système. */
  low: boolean;
  /** Hampe vers le haut. */
  up: boolean;
}

export interface StaffLayout {
  width: number;
  top: number;
  bottom: number;
  items: PlacedItem[];
  /** Abscisse où se termine la clé (et le chiffrage). */
  start: number;
  /** Les portées dessinées : le décalage vertical et la clé de chacune. */
  staves: { shift: number; clef: Clef | 'rhythm' }[];
}

/** Hauteur d'une place sur une portée décalée de shift. */
export const yOf = (position: number, shift = 0) => shift - position * HALF;

/** La clé de la portée où va une note. */
function clefOf(kind: StaffKind, item: StaffItem): Clef | 'rhythm' {
  if (kind === 'grand') return item.low ? 'bass' : 'treble';
  return kind;
}

/**
 * Place les éléments de gauche à droite. range élargit la hauteur du dessin (les places qu'on
 * peut toucher pour poser une note) ; slots réserve de la place pour des notes à venir.
 */
export function layoutStaff(
  kind: StaffKind,
  items: readonly StaffItem[],
  options: { time?: number; range?: [number, number]; slots?: number } = {},
): StaffLayout {
  const staves =
    kind === 'grand'
      ? [
          { shift: TREBLE_SHIFT, clef: 'treble' as const },
          { shift: 0, clef: 'bass' as const },
        ]
      : [{ shift: 0, clef: kind }];
  let x = kind === 'rhythm' ? 14 : CLEF_WIDTH + 8;
  if (options.time) x += TIME_WIDTH;
  const start = x;
  let lowest = kind === 'rhythm' ? 2 : 0;
  let highest = kind === 'rhythm' ? 6 : 8;
  if (options.range) {
    lowest = Math.min(lowest, options.range[0]);
    highest = Math.max(highest, options.range[1]);
  }

  const placed: PlacedItem[] = [];
  for (const item of items) {
    if (item.bar) {
      placed.push({ item, x: x + 2, position: 0, y: 0, low: false, up: true });
      x += BAR_WIDTH;
      continue;
    }
    const clef = clefOf(kind, item);
    const low = kind === 'grand' && !!item.low;
    const shift = kind === 'grand' && !low ? TREBLE_SHIFT : 0;
    const position = item.note && clef !== 'rhythm' ? staffPosition(item.note.d, clef) : 4;
    if (item.note?.acc) x += ACC_WIDTH;
    x += NOTE_WIDTH / 2;
    placed.push({
      item,
      x,
      position,
      y: yOf(position, shift),
      low,
      up: clef === 'rhythm' || position < 4,
    });
    if (kind !== 'grand') {
      lowest = Math.min(lowest, position);
      highest = Math.max(highest, position);
    }
    x += NOTE_WIDTH / 2 + (item.dot ? 6 : 0);
  }
  x += (options.slots ?? 0) * NOTE_WIDTH;

  // De la place pour les hampes (7 demi-interlignes) et les clés, au-dessus et en dessous.
  const stems = items.some((i) => !i.bar && !i.rest && i.dur && i.dur !== 'w');
  const margin = stems ? 7 : 4;
  // La clé de sol dépasse de la portée : de la 11e place à la −4e.
  const clefTop = kind === 'rhythm' ? 0 : 11;
  const clefBottom = kind === 'rhythm' ? 8 : -4;
  const top = kind === 'grand' ? yOf(14, TREBLE_SHIFT) : yOf(Math.max(highest + margin, clefTop));
  const bottom = kind === 'grand' ? yOf(-6) : yOf(Math.min(lowest - margin, clefBottom));
  return { width: x + 12, top, bottom, items: placed, start, staves };
}

export { ledgerLines };
