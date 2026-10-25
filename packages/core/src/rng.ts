/**
 * Générateur pseudo-aléatoire à graine (sfc32, graine étendue par splitmix32).
 * Une même graine donne toujours la même suite : une question se rejoue à l'identique
 * à partir de (plugin, niveau, graine).
 */
export interface Rng {
  readonly seed: number;
  /** Réel dans [0, 1[. */
  next(): number;
  /** Entier dans [min, max] (bornes incluses). */
  int(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
  shuffle<T>(items: readonly T[]): T[];
  /** `count` éléments distincts, dans un ordre aléatoire. */
  sample<T>(items: readonly T[], count: number): T[];
  chance(probability: number): boolean;
}

function splitmix32(state: number): () => number {
  return () => {
    state = (state + 0x9e3779b9) | 0;
    let t = state ^ (state >>> 16);
    t = Math.imul(t, 0x21f0aaad);
    t ^= t >>> 15;
    t = Math.imul(t, 0x735a2d97);
    return (t ^ (t >>> 15)) >>> 0;
  };
}

export function createRng(seed: number): Rng {
  const expand = splitmix32(seed >>> 0);
  let a = expand();
  let b = expand();
  let c = expand();
  let d = expand();

  const next = (): number => {
    const t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
  for (let i = 0; i < 12; i++) next();

  const int = (min: number, max: number): number => {
    if (max < min) throw new Error(`rng.int: intervalle vide [${min}, ${max}]`);
    return min + Math.floor(next() * (max - min + 1));
  };

  const shuffle = <T>(items: readonly T[]): T[] => {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
      const j = int(0, i);
      [out[i], out[j]] = [out[j]!, out[i]!];
    }
    return out;
  };

  return {
    seed: seed >>> 0,
    next,
    int,
    pick: (items) => {
      if (items.length === 0) throw new Error('rng.pick: liste vide');
      return items[int(0, items.length - 1)]!;
    },
    shuffle,
    sample: (items, count) => {
      if (count > items.length) throw new Error('rng.sample: pas assez d’éléments');
      return shuffle(items).slice(0, count);
    },
    chance: (probability) => next() < probability,
  };
}

/** Graine aléatoire 32 bits (navigateur et Node). */
export function randomSeed(): number {
  return globalThis.crypto.getRandomValues(new Uint32Array(1))[0]!;
}
