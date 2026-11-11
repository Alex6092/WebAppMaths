import { describe, expect, it } from 'vitest';
import { BIG_HOUSES, housePairs, houseTip } from './maisons';

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

  it('liste les additions des maisons du 12 et du 13', () => {
    expect(BIG_HOUSES).toEqual([12, 13]);
    expect(housePairs(12).map(([a, b]) => `${a} + ${b}`)).toEqual([
      '0 + 12',
      '1 + 11',
      '2 + 10',
      '3 + 9',
      '4 + 8',
      '5 + 7',
      '6 + 6',
    ]);
    expect(housePairs(13).map(([a, b]) => `${a} + ${b}`)).toEqual([
      '0 + 13',
      '1 + 12',
      '2 + 11',
      '3 + 10',
      '4 + 9',
      '5 + 8',
      '6 + 7',
    ]);
  });

  it('donne la bonne astuce pour 12 et 13', () => {
    expect(houseTip(6, 6)).toContain('double de 6');
    expect(houseTip(7, 6)).toContain('presque le double de 6');
    expect(houseTip(9, 3)).toContain('9 + 1 = 10, et il reste 2');
    expect(houseTip(2, 10)).toContain('10 + 2 = 12');
    expect(houseTip(11, 1)).toContain('1 de plus que 11');
    expect(houseTip(9, 4)).toContain('4 + 8 = 12');
    expect(houseTip(13, 0)).toContain('Ajouter 0');
  });
});
