import { compareBlanks, defineLevels, definePlugin, normalizeText } from '@app/core';
import {
  conjugate,
  startsWithVowel,
  verbGroup,
  verbKind,
  withSubject,
  type Person,
} from '../../lib/conjugaison';
import { VERBS } from '../../lib/verbes';

// Dictée 5, exercice 3 : « CONJUGUE les verbes au présent » (donner → je donne, adorer → j'adore),
// puis les autres personnes.

interface Params {
  persons: Person[];
  /** Aussi manger (nous mangeons) et commencer (nous commençons). */
  soft: boolean;
}

interface Data {
  inf: string;
  person: Person;
  pronoun: string;
  /** Ce qu'il faut écrire : « je donne », « j’adore », ou le verbe seul après tu, il… */
  answer: string;
}

// Les verbes de la fiche, puis ceux de la banque de phrases.
const CLASS_VERBS = ['donner', 'douter', 'adorer', 'bavarder', 'demander', 'danser'];
const isSoft = (inf: string) => /[cg]er$/.test(inf) && verbKind(inf) === 'spelling';
const POOL = [
  ...new Set([
    ...CLASS_VERBS,
    ...VERBS.filter((v) => v.compl.length > 0 && verbGroup(v.inf) === 1).map((v) => v.inf),
  ]),
].filter((inf) => verbKind(inf) === 'regular' || isSoft(inf));

const PRONOUNS: Record<Person, readonly string[]> = {
  0: ['je'],
  1: ['tu'],
  2: ['il', 'elle'],
  3: ['nous'],
  4: ['vous'],
  5: ['ils', 'elles'],
};

const ELISION_HINT = 'Devant une voyelle, « je » devient « j’ » : j’adore. ✏️';
const PRONOUN_HINT = 'N’oublie pas d’écrire « je » devant le verbe. ✏️';

export default definePlugin<'fill-blank', Params, Data>('fill-blank', {
  id: 'francais.conjugaison.conjugue-present',
  version: 1,
  title: 'Conjugue au présent',
  description: 'Donner → je donne, adorer → j’adore : les verbes en -er au présent.',
  icon: '🗣️',
  notions: ['francais.conjugaison.present-er', 'francais.orthographe.dictee-5'],
  // La classe en est à « je » (dictée 5) : à relever quand la leçon du présent arrivera.
  expectedLevel: 1,
  levels: defineLevels<Params>([
    { label: 'Avec « je »', grade: 'CE1', params: { persons: [0], soft: false } },
    { label: 'je, tu, il, elle', grade: 'CE1', params: { persons: [0, 1, 2], soft: false } },
    {
      label: 'Toutes les personnes',
      grade: 'CE1',
      params: { persons: [0, 1, 2, 3, 4, 5], soft: true },
    },
  ]),

  generate({ rng, params }) {
    const person = rng.pick(params.persons);
    // Un verbe de la fiche une fois sur trois ; manger, commencer surtout avec « nous ».
    const pool = POOL.filter((inf) => params.soft || !isSoft(inf));
    const inf = rng.chance(0.3) ? rng.pick(CLASS_VERBS) : rng.pick(pool);
    const pronoun = rng.pick(PRONOUNS[person]);
    const form = conjugate(inf, 'present', person);
    const whole = person === 0;
    const answer = whole ? withSubject('je', form).replace("'", '’') : form;
    return {
      widget: 'fill-blank',
      instruction: whole
        ? 'CONJUGUE le verbe au présent : écris « je » et le verbe.'
        : 'CONJUGUE le verbe au présent.',
      prompt: whole ? `${inf} → {0}` : `${inf} → ${pronoun} {0}`,
      blanks: [{ kind: 'text', size: Math.max(8, answer.length + 3) }],
      data: { inf, person, pronoun, answer },
    };
  },

  solve: (q) => ({ values: [q.data.answer] }),

  check(q, answer) {
    const result = compareBlanks(q, [[q.data.answer]], answer);
    if (result.correct || q.data.person !== 0) return result;
    const given = normalizeText(answer.values[0] ?? '');
    const form = conjugate(q.data.inf, 'present', 0);
    if (startsWithVowel(form) && given === `je ${form}`)
      return { ...result, feedback: ELISION_HINT };
    if (given === form) return { ...result, feedback: PRONOUN_HINT };
    return result;
  },

  explain(q) {
    const { inf, person, pronoun, answer } = q.data;
    const written = person === 0 ? answer : `${pronoun} ${answer}`;
    const ending = conjugate('chanter', 'present', person).slice('chant'.length);
    const rule = `${inf} → ${written} : avec « ${pronoun} », le verbe finit par -${ending}.`;
    if (person === 3 && isSoft(inf))
      return `${rule} Avec ${inf}, on garde le son doux : ${inf.endsWith('ger') ? 'un e' : 'un ç'} devant -ons.`;
    return rule;
  },

  signature: (q) => `${q.data.inf}-${q.data.pronoun}`,
});
