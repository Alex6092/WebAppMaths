/** Rangs d'un nombre : centaines, dizaines, unités. */
export type Place = 'c' | 'd' | 'u';

/** Une couleur par rang, pour le matériel de numération et les tableaux C D U. */
export const PLACE_COLORS: Record<Place, { fill: string; ink: string }> = {
  c: { fill: '#c5e1a5', ink: '#33691e' },
  d: { fill: '#ffcdd2', ink: '#b71c1c' },
  u: { fill: '#bbdefb', ink: '#0d47a1' },
};
