/**
 * Le calendrier, comme celui de la classe : la semaine commence le lundi.
 * Les mois sont numérotés de 1 (janvier) à 12 (décembre).
 */

export const WEEKDAYS = [
  'lundi',
  'mardi',
  'mercredi',
  'jeudi',
  'vendredi',
  'samedi',
  'dimanche',
] as const;

export const MONTHS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
] as const;

/** Le nombre de jours du mois. */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Le jour de la semaine d'une date : 0 pour lundi, 6 pour dimanche. */
export function weekdayOf(year: number, month: number, day: number): number {
  return (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
}

/** Les semaines du mois, du lundi au dimanche ; null pour les cases hors du mois. */
export function calendarWeeks(year: number, month: number): (number | null)[][] {
  const cells: (number | null)[] = [
    ...Array<null>(weekdayOf(year, month, 1)).fill(null),
    ...Array.from({ length: daysInMonth(year, month) }, (_, i) => i + 1),
  ];
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
}
