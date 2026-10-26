/** Tirages de nombres partagés par les exercices de lecture et d'écriture des nombres. */
import { defineLevels, type Rng } from '@app/core';

export type NumberRange = 'below70' | 'seventies' | 'hundreds' | 'all';

/** Les nombres de chaque niveau : 70 à 99 et les centaines sont les pièges de l'écriture. */
export function pickNumber(rng: Rng, range: NumberRange): number {
  switch (range) {
    case 'below70':
      return rng.int(11, 69);
    case 'seventies':
      return rng.int(70, 99);
    case 'hundreds':
      // Centaines rondes, ou avec un zéro au milieu : 200, 305, 480…
      return rng.pick([
        rng.int(1, 9) * 100,
        rng.int(1, 9) * 100 + rng.int(1, 9),
        rng.int(1, 9) * 100 + rng.int(1, 9) * 10,
      ]);
    case 'all':
      return rng.int(100, 999);
  }
}

export const NUMBER_LEVELS = defineLevels<{ range: NumberRange }>([
  { label: 'Jusqu’à 69', grade: 'CP', params: { range: 'below70' } },
  { label: 'De 70 à 99', grade: 'CE1', params: { range: 'seventies' } },
  { label: 'Les centaines', grade: 'CE1', params: { range: 'hundreds' } },
  { label: 'Jusqu’à 999', grade: 'CE1', params: { range: 'all' } },
]);
