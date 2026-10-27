import { defineLevels, definePlugin } from '@app/core';
import { ALPHABET_WORDS, alphabetical, commonStart } from '../../lib/vocabulaire';

// L'alphabet et le dictionnaire : la lettre qui suit, et un mot avant ou après un autre.

interface Params {
  /** letter : la lettre d'après ; words : deux mots ; close : deux mots qui commencent pareil. */
  mode: 'letter' | 'words' | 'close';
}

interface Data {
  answer: string;
  explanation: string;
}

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

/** Deux mots qui ont `shared` lettres communes au début. */
const pairsSharing = (shared: number) =>
  ALPHABET_WORDS.flatMap((a) =>
    ALPHABET_WORDS.filter((b) => a < b && commonStart(a, b) === shared).map(
      (b) => [a, b] as [string, string],
    ),
  );
const FAR_PAIRS = pairsSharing(0);
const CLOSE_PAIRS = pairsSharing(1);

export default definePlugin<'mcq', Params, Data>('mcq', {
  id: 'francais.vocabulaire.avant-apres',
  version: 1,
  title: 'Avant ou après ?',
  description: 'La lettre qui suit, et la place d’un mot dans le dictionnaire.',
  icon: '📖',
  notions: ['francais.vocabulaire.ordre-alphabetique'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'La lettre d’après', grade: 'CE1', params: { mode: 'letter' } },
    { label: 'Deux mots', grade: 'CE1', params: { mode: 'words' } },
    { label: 'Deux mots qui commencent pareil', grade: 'CE1', params: { mode: 'close' } },
  ]),

  generate({ rng, params }) {
    if (params.mode === 'letter') {
      const i = rng.int(0, ALPHABET.length - 2);
      const letter = ALPHABET[i]!;
      const next = ALPHABET[i + 1]!;
      // Le piège : la lettre d'avant (s'il y en a une).
      const before = i > 0 ? ALPHABET[i - 1]! : null;
      const pool = [...ALPHABET].filter((l) => ![letter, next, before].includes(l));
      const wrong = before ? [before, rng.pick(pool)] : rng.sample(pool, 2);
      const choices = rng.shuffle([next, ...wrong]);
      return {
        widget: 'mcq',
        instruction: `COCHE la lettre qui vient juste après « ${letter} » dans l’alphabet.`,
        choices: choices.map((l) => ({ id: l, label: l })),
        multiple: false,
        layout: 'row',
        data: { answer: next, explanation: `Dans l’alphabet : ${letter}, ${next}.` },
      };
    }
    const close = params.mode === 'close';
    const [x, y] = rng.shuffle(rng.pick(close ? CLOSE_PAIRS : FAR_PAIRS));
    const answer = alphabetical(x, y) < 0 ? 'avant' : 'après';
    return {
      widget: 'mcq',
      instruction: `Dans le dictionnaire, le mot « ${x} » est-il AVANT ou APRÈS le mot « ${y} » ?`,
      choices: [
        { id: 'avant', label: 'avant' },
        { id: 'après', label: 'après' },
      ],
      multiple: false,
      layout: 'row',
      data: {
        answer,
        explanation: close
          ? `« ${x} » et « ${y} » commencent par la même lettre : je regarde la 2e lettre. « ${x} » est ${answer} « ${y} ».`
          : `Je regarde la 1re lettre : « ${x} » est ${answer} « ${y} ».`,
      },
    };
  },

  solve: (q) => ({ selected: [q.data.answer] }),

  explain: (q) => q.data.explanation,

  signature: (q) => q.instruction,
});
