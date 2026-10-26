import { describe, expect, it } from 'vitest';
import { evaluationCode } from './evaluation';

describe('évaluation blanche', () => {
  it('donne le code de l’école d’après le barème', () => {
    expect(evaluationCode(4, 4)).toBe('A');
    expect(evaluationCode(3, 4)).toBe('A');
    expect(evaluationCode(2, 4)).toBe('ECA');
    expect(evaluationCode(1, 4)).toBe('NA');
    expect(evaluationCode(2, 3)).toBe('ECA');
    expect(evaluationCode(4, 5)).toBe('A');
    expect(evaluationCode(2, 5)).toBe('NA');
    expect(evaluationCode(0, 0)).toBe('NA');
  });
});
