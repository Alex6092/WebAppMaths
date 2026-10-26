/**
 * L'heure sur une horloge à aiguilles. Une heure se compte en minutes depuis 12 h : de 0 à 719
 * (le cadran ne fait pas la différence entre le matin et l'après-midi).
 */

export const CLOCK_MINUTES = 720;

/** Ramène un nombre de minutes sur le cadran (de 0 à 719). */
export function onDial(minutes: number): number {
  return ((minutes % CLOCK_MINUTES) + CLOCK_MINUTES) % CLOCK_MINUTES;
}

/** L'heure du cadran, de 1 à 12. */
export function dialHour(minutes: number): number {
  return Math.floor(onDial(minutes) / 60) || 12;
}

/**
 * L'heure écrite comme à l'école : « 3 h », « 3 h 05 », « 12 h 30 ». Avec afternoon, l'heure de
 * l'après-midi : « 15 h 05 ».
 */
export function clockText(minutes: number, afternoon = false): string {
  const hour = dialHour(minutes);
  const shown = afternoon && hour < 12 ? hour + 12 : hour;
  const min = onDial(minutes) % 60;
  return min === 0 ? `${shown} h` : `${shown} h ${String(min).padStart(2, '0')}`;
}

/** Angles des aiguilles en degrés, depuis le 12, dans le sens des aiguilles d'une montre. */
export function handAngles(minutes: number): { hour: number; minute: number } {
  const m = onDial(minutes);
  return { hour: (m / CLOCK_MINUTES) * 360, minute: ((m % 60) / 60) * 360 };
}
