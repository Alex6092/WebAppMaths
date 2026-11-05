import { describe, expect, it } from 'vitest';
import { housePairs, houseTip } from './maisons';

describe('maisons du 10 et du 11', () => {
  it('liste les additions de la fiche', () => {
    expect(housePairs(10)).toEqual([
      [0, 10],
      [1, 9],
      [2, 8],
      [3, 7],
      [4, 6],
      [5, 5],
    ]);
    expect(housePairs(11).map(([a, b]) => `${a} + ${b}`)).toEqual([
      '0 + 11',
      '1 + 10',
      '2 + 9',
      '3 + 8',
      '4 + 7',
      '5 + 6',
    ]);
  });

  it('donne la bonne astuce', () => {
    expect(houseTip(5, 5)).toContain('double de 5');
    expect(houseTip(6, 5)).toContain('presque le double de 5');
    expect(houseTip(8, 3)).toContain('3 + 7 = 10');
    expect(houseTip(11, 0)).toContain('Ajouter 0');
    expect(houseTip(7, 3)).toContain('maison du 10');
  });
});
