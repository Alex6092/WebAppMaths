import { defineLevels, definePlugin, type Rng } from '@app/core';
import { ALPHABET_WORDS, alphabetical } from '../../lib/vocabulaire';

// « RANGE les mots dans l'ordre alphabétique » : la 1re lettre, puis la 2e.

interface Params {
  count: number;
  /** different : toutes les 1res lettres différentes ; some : deux mots commencent pareil ;
   * same : tous commencent par la même lettre. */
  start: 'different' | 'some' | 'same';
}

interface Data {
  /** Les numéros des étiquettes, dans l'ordre du dictionnaire. */
  order: number[];
}

/** La première lettre, sans accent : « é » se range avec « e ». */
const first = (w: string) => w.normalize('NFD').charAt(0);

function pickWords(rng: Rng, params: Params): string[] {
  const byLetter = new Map<string, string[]>();
  for (const w of ALPHABET_WORDS) byLetter.set(first(w), [...(byLetter.get(first(w)) ?? []), w]);
  const letters = [...byLetter.keys()];
  const oneOf = (letter: string) => rng.pick(byLetter.get(letter)!);
  if (params.start === 'same') {
    const letter = rng.pick(letters.filter((l) => byLetter.get(l)!.length >= params.count));
    return rng.sample(byLetter.get(letter)!, params.count);
  }
  if (params.start === 'some') {
    const letter = rng.pick(letters.filter((l) => byLetter.get(l)!.length >= 2));
    const others = rng.sample(
      letters.filter((l) => l !== letter),
      params.count - 2,
    );
    return [...rng.sample(byLetter.get(letter)!, 2), ...others.map(oneOf)];
  }
  return rng.sample(letters, params.count).map(oneOf);
}

export default definePlugin<'order', Params, Data>('order', {
  id: 'francais.vocabulaire.range-alphabetique',
  version: 1,
  title: 'L’ordre alphabétique',
  description: 'Range les mots comme dans le dictionnaire.',
  icon: '🔤',
  notions: ['francais.vocabulaire.ordre-alphabetique'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    {
      label: 'Des 1res lettres différentes',
      grade: 'CE1',
      params: { count: 4, start: 'different' },
    },
    { label: 'Regarder la 2e lettre', grade: 'CE1', params: { count: 5, start: 'some' } },
    { label: 'Tous avec la même lettre', grade: 'CE1', params: { count: 4, start: 'same' } },
  ]),

  generate({ rng, params }) {
    const words = rng.shuffle(pickWords(rng, params));
    const order = words.map((_, i) => i).sort((a, b) => alphabetical(words[a]!, words[b]!));
    return {
      widget: 'order',
      instruction: 'RANGE les mots dans l’ordre alphabétique.',
      tiles: words.map((text) => ({ text })),
      list: true,
      data: { order },
    };
  },

  solve: (q) => ({ order: [...q.data.order] }),

  explain: (q) => {
    const sorted = q.data.order.map((i) => q.tiles[i]!.text).join(', ');
    return `Dans l’ordre du dictionnaire : ${sorted}. Si la 1re lettre est la même, je regarde la 2e.`;
  },
});
