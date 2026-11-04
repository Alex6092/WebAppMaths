import type { Rng } from '@app/core';
import { retry } from '../../lib/numbers';
import { commonPart, FAMILIES, familyWords } from './familles';

/** Une série de mots d'une même famille et son radical (« monter – montagne → mont »). */
export interface RadicalSeries {
  base: string;
  radical: string;
  words: string[];
  /** De faux radicaux : un peu trop courts ou un peu trop longs (mon, monta). */
  decoys: string[];
}

/** Les faux radicaux : une lettre de moins, deux de moins, ou une lettre de plus prise d'un mot. */
function decoysOf(radical: string, words: readonly string[]): { short: string[]; long: string[] } {
  const short = [radical.slice(0, -1), radical.slice(0, -2)].filter((s) => s.length >= 2);
  const long = new Set<string>();
  for (const w of words) {
    const at = w.indexOf(radical);
    const next = w[at + radical.length];
    if (next) long.add(radical + next);
  }
  return { short, long: [...long] };
}

/**
 * Tire `size` mots d'une famille dont la plus grande partie commune est bien son radical
 * (« historien, historique » sans « histoire » donnerait « histori »), avec `decoys` faux
 * radicaux : toujours un trop court et un trop long.
 */
export function radicalSeries(rng: Rng, size: number, decoys = 0): RadicalSeries {
  return retry(
    () => {
      const family = rng.pick(FAMILIES.filter((f) => f.radical && familyWords(f).length >= size));
      const words = rng.sample(familyWords(family), size);
      const radical = family.radical!;
      const { short, long } = decoysOf(radical, words);
      const first = [short[0], long.length ? rng.pick(long) : undefined].filter(
        (d): d is string => !!d,
      );
      const rest = rng.shuffle([...short, ...long].filter((d) => !first.includes(d)));
      return {
        base: family.base,
        radical,
        words,
        decoys: [...first, ...rest].slice(0, decoys),
      };
    },
    (s) => commonPart(s.words) === s.radical && s.decoys.length === decoys,
  );
}

export const seriesText = (s: RadicalSeries) => s.words.join(' – ');

export const explainRadical = (s: { radical: string; words: readonly string[] }) =>
  `« ${s.radical} » est dans tous les mots : ${s.words.join(', ')}. C’est la plus grande partie commune : le radical.`;
