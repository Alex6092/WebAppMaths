import type { Rng } from '@app/core';

/**
 * Les sommes égales à 10, 11, 12 et 13 (« la maison du 10 », « la maison du 11 »…) : les additions
 * de deux nombres à connaître par cœur pour calculer vite et passer par 10.
 */

export type House = 10 | 11 | 12 | 13;

/** Les maisons de la première notion, et celles de la suivante. */
export const HOUSES: readonly House[] = [10, 11];
export const BIG_HOUSES: readonly House[] = [12, 13];

/** Les additions de la maison, de 0 + 10 à 5 + 5 (ou 5 + 6, 6 + 6, 6 + 7) : sans les retournées. */
export const housePairs = (house: House): [number, number][] =>
  Array.from({ length: Math.floor(house / 2) + 1 }, (_, a) => [a, house - a]);

/** Une addition de la maison, dans un sens ou dans l'autre. */
export function pickPair(rng: Rng, house: House): [number, number] {
  const [a, b] = rng.pick(housePairs(house));
  return rng.chance(0.5) ? [a, b] : [b, a];
}

/** Ce qui aide à retrouver l'addition : le double, le presque double, ou la maison d'avant + 1. */
export function houseTip(a: number, b: number): string {
  const sum = a + b;
  const [small, big] = a <= b ? [a, b] : [b, a];
  if (small === 0) return `Ajouter 0 ne change rien : 0 + ${big} = ${big}.`;
  if (small === big) return `${small} + ${small} = ${sum} : c’est le double de ${small}.`;
  if ((sum === 11 || sum === 13) && big - small === 1)
    return `${small} + ${big}, c’est presque le double de ${small} : ${small} + ${small} + 1 = ${sum}.`;
  if (sum === 11)
    return `${small} + ${big - 1} = 10 dans la maison du 10, alors ${small} + ${big} = 11 : un de plus.`;
  if (sum === 12 || sum === 13) {
    if (big === 10) return `10 + ${small} = ${sum} : le 10, puis ${small} de plus.`;
    if (sum === 13)
      return `${small} + ${big - 1} = 12 dans la maison du 12, alors ${small} + ${big} = 13 : un de plus.`;
    if (big > 10) return `${big} + ${small} = 12 : ${small} de plus que ${big}.`;
    const toTen = 10 - big;
    return `${big} + ${toTen} = 10, et il reste ${small - toTen} : ${small} + ${big} = 10 + ${small - toTen} = 12.`;
  }
  return `${small} et ${big} vont ensemble dans la maison du 10 : à savoir par cœur.`;
}
