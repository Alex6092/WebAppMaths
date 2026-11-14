import { defineLevels, definePlugin } from '@app/core';
import { conjugate, PRONOUNS, withSubject, type Person } from '../../lib/conjugaison';
import {
  ENDING_CHOICES,
  endingOf,
  LESSON_VERBS,
  RADICAL_NOTION,
  radicalOf,
  REGULAR_ER,
} from '../../lib/premier-groupe';

// CONJ 3 : « Pour conjuguer un verbe, j'identifie le radical puis j'ajoute la terminaison. »
// jouer → jou / er → nous jouons.

interface Params {
  /** Couper un verbe conjugué en radical + terminaison (sinon : l'infinitif). */
  conjugated: boolean;
}

interface Data {
  inf: string;
  person: Person;
  /** « nous jouons », « j’aime » (niveau 2). */
  written: string;
}

export default definePlugin<'fill-blank', Params, Data>('fill-blank', {
  id: 'francais.conjugaison.radical-terminaison',
  version: 1,
  title: 'Le radical et la terminaison',
  description: 'jouer → jou / er : trouve le radical du verbe, puis sa terminaison.',
  icon: '✂️',
  notions: [RADICAL_NOTION],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'Le radical de l’infinitif', grade: 'CE1', params: { conjugated: false } },
    { label: 'Radical + terminaison', grade: 'CE1', params: { conjugated: true } },
  ]),
  minVariety: 20,

  generate({ rng, params }) {
    const inf = rng.chance(0.25) ? rng.pick(LESSON_VERBS) : rng.pick(REGULAR_ER);
    const radical = radicalOf(inf);
    if (!params.conjugated) {
      return {
        widget: 'fill-blank',
        instruction: 'ÉCRIS le radical du verbe : j’enlève -er à la fin de l’infinitif.',
        prompt: `${inf} → {0} / er`,
        blanks: [{ kind: 'text', size: radical.length + 3 }],
        data: { inf, person: 0, written: '' },
      };
    }
    const person = rng.int(0, 5) as Person;
    const pronoun = rng.pick(PRONOUNS[person].filter((p) => p !== 'on'));
    const written = withSubject(pronoun, conjugate(inf, 'present', person)).replace("'", '’');
    return {
      widget: 'fill-blank',
      instruction: 'SÉPARE le verbe : ÉCRIS son radical, puis CHOISIS sa terminaison.',
      prompt: `${written} (${inf})\nradical : {0}\nterminaison : {1}`,
      blanks: [
        { kind: 'text', size: radical.length + 3 },
        { kind: 'choice', options: [...ENDING_CHOICES] },
      ],
      data: { inf, person, written },
    };
  },

  solve: (q) =>
    q.blanks.length === 1
      ? { values: [radicalOf(q.data.inf)] }
      : { values: [radicalOf(q.data.inf), endingOf(q.data.person)] },

  explain(q) {
    const { inf, person, written } = q.data;
    const radical = radicalOf(inf);
    if (q.blanks.length === 1) return `${inf} → ${radical} / er : le radical est « ${radical} ».`;
    return `${written} → ${radical} + ${endingOf(person)} : le radical de ${inf} est « ${radical} », et la terminaison est « ${endingOf(person)} ».`;
  },

  signature: (q) => q.prompt,
});
