import type { Rng } from '@app/core';

/** Nombre au hasard qui a exactement `digits` chiffres (1 à 9 pour un chiffre). */
export function randomWithDigits(rng: Rng, digits: number): number {
  return digits === 1 ? rng.int(1, 9) : rng.int(10 ** (digits - 1), 10 ** digits - 1);
}

export function digitCount(n: number): number {
  return String(Math.abs(n)).length;
}

/** Chiffre d'un rang : 0 = unités, 1 = dizaines, 2 = centaines… */
export function digitAt(n: number, place: number): number {
  return Math.floor(Math.abs(n) / 10 ** place) % 10;
}

export { PLACE_NAMES } from '@app/core';

/**
 * Essaie `make` jusqu'à obtenir une valeur acceptée. Les générateurs procèdent par tirage
 * puis rejet : c'est simple et le test de contrat vérifie que ça termine.
 */
export function retry<T>(make: () => T, accept: (value: T) => boolean, attempts = 2000): T {
  for (let i = 0; i < attempts; i++) {
    const value = make();
    if (accept(value)) return value;
  }
  throw new Error(`aucune valeur acceptable après ${attempts} essais`);
}
