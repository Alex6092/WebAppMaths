import { clockText, dialHour, onDial, type Rng } from '@app/core';

/** Les niveaux de l'heure, du plus simple au plus difficile. */
export type ClockLevel = 'pile' | 'demie' | 'quart' | 'cinq' | 'minute' | 'apres-midi';

export interface ClockParams {
  kind: ClockLevel;
}

/** Pas de la grande aiguille à chaque niveau, en minutes. */
export const CLOCK_STEP: Record<ClockLevel, number> = {
  pile: 60,
  demie: 30,
  quart: 15,
  cinq: 5,
  minute: 1,
  'apres-midi': 5,
};

/** Les minutes sont écrites autour du cadran dès qu'on les lit de 5 en 5. */
export const withMinuteLabels = (kind: ClockLevel) =>
  kind === 'cinq' || kind === 'minute' || kind === 'apres-midi';

export const CLOCK_LEVELS = [
  { label: 'Les heures pile', grade: 'CE1', params: { kind: 'pile' } },
  { label: 'Et demie', grade: 'CE1', params: { kind: 'demie' } },
  { label: 'Et quart, moins le quart', grade: 'CE1', params: { kind: 'quart' } },
  { label: 'De 5 en 5 minutes', grade: 'CE1', params: { kind: 'cinq' } },
  { label: 'À la minute près', grade: 'CE2', params: { kind: 'minute' } },
  { label: 'L’après-midi (13 h à 23 h)', grade: 'CE2', params: { kind: 'apres-midi' } },
] as const satisfies readonly { label: string; grade: string; params: ClockParams }[];

/**
 * Une heure du niveau, en minutes depuis 12 h. Le plus souvent, c'est la nouveauté du niveau
 * (la demie au niveau « et demie », un quart au niveau « et quart »…).
 */
export function randomTime(rng: Rng, kind: ClockLevel): number {
  const hour = rng.int(0, 11);
  const step = CLOCK_STEP[kind];
  const fresh = rng.chance(0.7);
  let minute: number;
  switch (kind) {
    case 'pile':
      minute = 0;
      break;
    case 'demie':
      minute = fresh ? 30 : rng.pick([0, 30]);
      break;
    case 'quart':
      minute = fresh ? rng.pick([15, 45]) : rng.pick([0, 15, 30, 45]);
      break;
    case 'cinq':
    case 'apres-midi':
      minute = fresh ? rng.pick([5, 10, 20, 25, 35, 40, 50, 55]) : rng.int(0, 11) * 5;
      break;
    case 'minute':
      minute = fresh ? rng.int(0, 59) : rng.int(0, 11) * 5;
      if (fresh && minute % 5 === 0) minute = (minute + rng.int(1, 4)) % 60;
      break;
  }
  return onDial(hour * 60 + Math.round(minute / step) * step);
}

/** L'après-midi, l'heure du cadran n'est jamais 12 (on lit de 13 h à 23 h). */
export function randomAfternoon(rng: Rng): number {
  return onDial(rng.int(1, 11) * 60 + rng.int(0, 11) * 5);
}

/** Le nombre montré par la grande aiguille (12 pour 0 minute). */
const minuteNumber = (minute: number) => minute / 5 || 12;

/** Ce que montrent les deux aiguilles, pour l'explication. */
export function readingExplanation(minutes: number, afternoon = false): string {
  const m = onDial(minutes) % 60;
  const hour = dialHour(minutes);
  const next = (hour % 12) + 1;
  const small =
    m === 0
      ? `la petite aiguille est sur le ${hour}`
      : `la petite aiguille est entre le ${hour} et le ${next}`;
  const big =
    m === 0
      ? 'la grande aiguille est sur le 12'
      : m % 5 === 0
        ? `la grande aiguille est sur le ${minuteNumber(m)} : ${m} minutes`
        : `la grande aiguille montre ${m} minute${m > 1 ? 's' : ''}`;
  const after = afternoon ? ' C’est l’après-midi : on ajoute 12 heures.' : '';
  return `${capitalized(small)}, ${big}.${after} Il est ${clockText(minutes, afternoon)}.`;
}

const capitalized = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const HOUR_WORDS = [
  '',
  'une',
  'deux',
  'trois',
  'quatre',
  'cinq',
  'six',
  'sept',
  'huit',
  'neuf',
  'dix',
  'onze',
  'douze',
];

/** « trois heures », « une heure ». */
export const hoursInWords = (hour: number) => `${HOUR_WORDS[hour]} heure${hour > 1 ? 's' : ''}`;

/**
 * L'heure dite avec des mots, comme à l'oral : « trois heures et quart », « quatre heures moins
 * le quart ». Seulement pour les heures pile, les demies et les quarts.
 */
export function timeInWords(minutes: number): string {
  const m = onDial(minutes) % 60;
  const hour = dialHour(minutes);
  switch (m) {
    case 0:
      return `${hoursInWords(hour)} pile`;
    case 15:
      return `${hoursInWords(hour)} et quart`;
    case 30:
      return `${hoursInWords(hour)} et demie`;
    case 45:
      return `${hoursInWords((hour % 12) + 1)} moins le quart`;
    default:
      throw new Error(`${m} minutes ne se disent pas avec quart ou demie`);
  }
}
