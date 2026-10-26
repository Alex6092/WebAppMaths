/** Défi du jour et série de jours : partagés par le serveur (qui compte) et l'interface. */

/** Nombre de questions du défi du jour. */
export const DAILY_LENGTH = 10;
/** Pièces gagnées en plus quand le défi du jour est terminé. */
export const DAILY_BONUS = 20;
/** Les jours se comptent à l'heure de la famille (France). */
export const DAILY_TIME_ZONE = 'Europe/Paris';

/** Le jour (AAAA-MM-JJ) d'un instant, dans le fuseau donné. */
export function dayKey(date: Date, timeZone = DAILY_TIME_ZONE): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

/** Le jour d'avant (AAAA-MM-JJ). */
export function previousDay(day: string): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export interface Streak {
  /** Jours de suite jusqu'à aujourd'hui (ou hier, si le défi d'aujourd'hui reste à faire). */
  current: number;
  best: number;
  doneToday: boolean;
}

/** La série à partir des jours où le défi a été réussi. */
export function streakOf(days: Iterable<string>, today: string): Streak {
  const done = new Set(days);
  const doneToday = done.has(today);
  let current = 0;
  for (let d = doneToday ? today : previousDay(today); done.has(d); d = previousDay(d)) current++;

  let best = 0;
  for (const day of done) {
    // On ne compte qu'à partir du premier jour de chaque série.
    if (done.has(previousDay(day))) continue;
    let length = 0;
    for (let d = day; done.has(d); d = nextDay(d)) length++;
    best = Math.max(best, length);
  }
  return { current, best, doneToday };
}

function nextDay(day: string): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
