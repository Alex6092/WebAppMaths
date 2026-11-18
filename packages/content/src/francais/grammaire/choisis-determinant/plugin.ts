import { defineLevels, definePlugin } from '@app/core';
import {
  definite,
  DETERMINANT_NOTION,
  indefinite,
  pickNoun,
  startsWithVowel,
  type Article,
} from '../../lib/nom-determinant';

// Leçon « Le déterminant » : le déterminant dit si le nom est masculin ou féminin, singulier ou
// pluriel ; devant une voyelle, « le » et « la » deviennent « l’ ».

type Bank = 'le-la' | 'un-une' | 'definis';

interface Params {
  set: Bank;
}

interface Data {
  noun: string;
  plural: boolean;
  female: boolean;
  answer: Article;
}

const OPTIONS: Record<Bank, Article[]> = {
  'le-la': ['le', 'la', 'l’'],
  'un-une': ['un', 'une'],
  definis: ['le', 'la', 'l’', 'les'],
};

export default definePlugin<'fill-blank', Params, Data>('fill-blank', {
  id: 'francais.grammaire.choisis-determinant',
  version: 1,
  title: 'Choisis le déterminant',
  description: 'Le, la ou l’ ? Un ou une ? Le déterminant va avec le nom.',
  icon: '🧩',
  notions: [DETERMINANT_NOTION],
  expectedLevel: 3,
  levels: defineLevels<Params>([
    { label: 'le, la ou l’', grade: 'CE1', params: { set: 'le-la' } },
    { label: 'un ou une', grade: 'CE1', params: { set: 'un-une' } },
    { label: 'le, la, l’ ou les', grade: 'CE1', params: { set: 'definis' } },
  ]),
  minVariety: 20,

  generate({ rng, params }) {
    const options = OPTIONS[params.set];
    // l’ une fois sur trois, pour qu'il revienne souvent sans tout remplir.
    const vowel = params.set !== 'un-une' && rng.chance(0.3);
    const female = rng.chance(0.5);
    const noun = pickNoun(
      rng,
      (n) => n.f === female && (params.set === 'un-une' || startsWithVowel(n.sing) === vowel),
    );
    const plural = params.set === 'definis' && !vowel && rng.chance(0.35);
    const answer = params.set === 'un-une' ? indefinite(noun, false) : definite(noun, plural);
    const word = plural ? noun.plur : noun.sing;
    return {
      widget: 'fill-blank',
      instruction: `COMPLÈTE avec ${options.slice(0, -1).join(', ')} ou ${options.at(-1)}.`,
      prompt: `{0} ${word}`,
      blanks: [{ kind: 'choice', options: [...options] }],
      data: { noun: word, plural, female: noun.f, answer },
    };
  },

  solve: (q) => ({ values: [q.data.answer] }),

  explain(q) {
    const { noun, plural, female, answer } = q.data;
    const written = answer === 'l’' ? `l’${noun}` : `${answer} ${noun}`;
    if (answer === 'l’')
      return `${written} : « ${noun} » commence par une voyelle, alors « le » ou « la » devient « l’ ».`;
    if (plural) return `${written} : il y en a plusieurs, le nom est au pluriel.`;
    return `${written} : « ${noun} » est ${female ? 'féminin' : 'masculin'}.`;
  },

  signature: (q) => `${q.data.answer}-${q.data.noun}`,
});
