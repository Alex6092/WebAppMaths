import type { Rng } from '@app/core';

/**
 * Les sommes égales à 10 et 11 (« la maison du 10 », « la maison du 11 ») : les additions de deux
 * nombres à connaître par cœur pour calculer vite et passer par 10.
 */

export type House = 10 | 11;

export const HOUSES: readonly House[] = [10, 11];

/** Les additions de la maison, de 0 + 10 à 5 + 5 (ou 5 + 6) : sans les retournées. */
export const housePairs = (house: House): [number, number][] =>
  Array.from({ length: Math.floor(house / 2) + 1 }, (_, a) => [a, house - a]);

/** Une addition de la maison, dans un sens ou dans l'autre. */
export function pickPair(rng: Rng, house: House): [number, number] {
  const [a, b] = rng.pick(housePairs(house));
  return rng.chance(0.5) ? [a, b] : [b, a];
}

/** Ce qui aide à retrouver l'addition : le double, le presque double, ou la maison du 10 + 1. */
export function houseTip(a: number, b: number): string {
  const sum = a + b;
  const [small, big] = a <= b ? [a, b] : [b, a];
  if (small === 0) return `Ajouter 0 ne change rien : 0 + ${big} = ${big}.`;
  if (small === big) return `${small} + ${small} = ${sum} : c’est le double de ${small}.`;
  if (sum === 11 && big - small === 1)
    return `${small} + ${big}, c’est presque le double de ${small} : ${small} + ${small} + 1 = 11.`;
  if (sum === 11)
    return `${small} + ${big - 1} = 10 dans la maison du 10, alors ${small} + ${big} = 11 : un de plus.`;
  return `${small} et ${big} vont ensemble dans la maison du 10 : à savoir par cœur.`;
}
