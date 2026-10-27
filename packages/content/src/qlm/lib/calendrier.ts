import { daysInMonth, MONTHS, weekdayOf, WEEKDAYS, type Rng } from '@app/core';

/** Une page de calendrier tirée au hasard, entre 2025 et 2028. */
export interface Page {
  year: number;
  month: number;
}

export function randomPage(rng: Rng): Page {
  return { year: rng.int(2025, 2028), month: rng.int(1, 12) };
}

/** « mardi 12 mai » */
export function dateText(page: Page, day: number): string {
  return `${WEEKDAYS[weekdayOf(page.year, page.month, day)]} ${day === 1 ? '1er' : day} ${MONTHS[page.month - 1]}`;
}

/** Les jours du mois qui tombent un certain jour de la semaine (0 pour lundi). */
export function daysOn(page: Page, weekday: number): number[] {
  return Array.from({ length: daysInMonth(page.year, page.month) }, (_, i) => i + 1).filter(
    (d) => weekdayOf(page.year, page.month, d) === weekday,
  );
}

/** « mercredis », « samedis » */
export const plural = (weekday: number) => `${WEEKDAYS[weekday]}s`;

export const ORDINALS = ['premier', 'deuxième', 'troisième', 'quatrième'];
