import { describe, expect, it } from 'vitest';
import { createRng, randomSeed } from './rng';

describe('createRng', () => {
  it('rejoue la même suite pour la même graine', () => {
    const a = createRng(42);
    const b = createRng(42);
    const seqA = Array.from({ length: 20 }, () => a.next());
    const seqB = Array.from({ length: 20 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it('donne des suites différentes pour des graines voisines', () => {
    expect(createRng(1).next()).not.toEqual(createRng(2).next());
  });

  it('reste dans les bornes de int (incluses)', () => {
    const rng = createRng(7);
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) {
      const n = rng.int(3, 6);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(6);
      seen.add(n);
    }
    expect([...seen].sort()).toEqual([3, 4, 5, 6]);
  });

  it('mélange sans perdre d’éléments', () => {
    const rng = createRng(3);
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    expect(rng.shuffle(items).sort()).toEqual(items);
    expect(rng.sample(items, 3)).toHaveLength(3);
    expect(new Set(rng.sample(items, 8)).size).toBe(8);
  });

  it('produit une graine 32 bits', () => {
    const seed = randomSeed();
    expect(Number.isInteger(seed)).toBe(true);
    expect(seed).toBeGreaterThanOrEqual(0);
    expect(seed).toBeLessThan(2 ** 32);
  });
});
