import { totalBeats, type StaffItem } from '@app/core';

/**
 * Des groupes de figures qui durent un nombre entier de temps : une noire, deux croches reliées,
 * une noire pointée et sa croche… Les exercices de rythme les enchaînent.
 */
export type Group = StaffItem[];

export const GROUPS: Record<string, Group> = {
  ronde: [{ dur: 'w' }],
  blanche: [{ dur: 'h' }],
  noire: [{ dur: 'q' }],
  croches: [{ dur: 'e', beam: true }, { dur: 'e' }],
  croche: [{ dur: 'e' }],
  pause: [{ dur: 'w', rest: true }],
  demiPause: [{ dur: 'h', rest: true }],
  soupir: [{ dur: 'q', rest: true }],
  demiSoupirCroche: [{ dur: 'e', rest: true }, { dur: 'e' }],
  blanchePointee: [{ dur: 'h', dot: true }],
  noirePointeeCroche: [{ dur: 'q', dot: true }, { dur: 'e' }],
  doubles: [
    { dur: 's', beam: true },
    { dur: 's', beam: true },
    { dur: 's', beam: true },
    { dur: 's' },
  ],
};

export const groupBeats = (g: Group) => totalBeats(g);

/** Des groupes tirés au hasard, jusqu'à faire exactement `beats` temps. */
export function fillBeats(
  rng: { pick<T>(items: readonly T[]): T },
  pool: readonly Group[],
  beats: number,
): Group[] {
  for (let tries = 0; tries < 50; tries++) {
    const groups: Group[] = [];
    let left = beats;
    while (left > 0) {
      const fits = pool.filter((g) => groupBeats(g) <= left);
      if (fits.length === 0) break;
      const g = rng.pick(fits);
      groups.push(g);
      left -= groupBeats(g);
    }
    if (left === 0) return groups;
  }
  // Toujours possible avec des noires (et une croche pour le demi-temps).
  const groups: Group[] = Array.from({ length: Math.floor(beats) }, () => GROUPS.noire!);
  if (beats % 1) groups.push(GROUPS.croche!);
  return groups;
}
