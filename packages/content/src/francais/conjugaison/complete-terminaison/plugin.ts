import { defineLevels, definePlugin } from '@app/core';
import { PERSONS, PRONOUNS, withSubject, type Person } from '../../lib/conjugaison';
import { buildSentence, promptWithBlanks } from '../../lib/phrases';
import {
  ENDING_CHOICES,
  endingOf,
  LESSON_VERBS,
  PRESENT_ER_NOTION,
  radicalOf,
  REGULAR_ER,
} from '../../lib/premier-groupe';
import { VERBS } from '../../lib/verbes';

// CONJ 3 : les terminaisons du présent des verbes du 1er groupe (e, es, e, ons, ez, ent),
// à ajouter au radical : tu prépar-es, nous donn-ons, ils conjugu-ent.

type Mode = 'pronoun' | 'sentence' | 'table';

interface Params {
  mode: Mode;
}

interface Data {
  inf: string;
  persons: Person[];
  /** La phrase complète et son sujet, pour l'explication (niveau 2). */
  sentence?: string;
  subject?: string;
}

const SENTENCE_VERBS = VERBS.filter((v) => REGULAR_ER.includes(v.inf));
const choice = () => ({ kind: 'choice' as const, options: [...ENDING_CHOICES] });

/** « je jou{0} », « j’aim{0} » : le pronom, le radical et le trou. */
function line(pronoun: string, inf: string, blank: number): string {
  return withSubject(pronoun, `${radicalOf(inf)}{${blank}}`).replace("'", '’');
}

export default definePlugin<'fill-blank', Params, Data>('fill-blank', {
  id: 'francais.conjugaison.complete-terminaison',
  version: 1,
  title: 'Ajoute la terminaison',
  description: 'Au présent : je -e, tu -es, il -e, nous -ons, vous -ez, ils -ent.',
  icon: '🧩',
  notions: [PRESENT_ER_NOTION],
  expectedLevel: 3,
  levels: defineLevels<Params>([
    { label: 'Avec un pronom', grade: 'CE1', params: { mode: 'pronoun' } },
    { label: 'Dans une phrase', grade: 'CE1', params: { mode: 'sentence' } },
    { label: 'Tout le verbe', grade: 'CE1', params: { mode: 'table' } },
  ]),
  minVariety: 20,

  generate({ rng, params }) {
    const instruction = 'COMPLÈTE avec la bonne terminaison du présent.';
    if (params.mode === 'sentence') {
      const s = buildSentence(rng, { verbs: SENTENCE_VERBS, moment: 'present' });
      const prompt = promptWithBlanks(s.pieces, { form: `${radicalOf(s.verb.inf)}{0}` });
      return {
        widget: 'fill-blank',
        instruction,
        prompt: `${prompt.replace("'", '’')} (${s.verb.inf})`,
        blanks: [choice()],
        data: {
          inf: s.verb.inf,
          persons: [s.person],
          sentence: s.text.replace("'", '’'),
          ...(s.subject.kind === 'pronoun' ? {} : { subject: s.subject.text }),
        },
      };
    }
    const inf = rng.chance(0.3) ? rng.pick(LESSON_VERBS) : rng.pick(REGULAR_ER);
    if (params.mode === 'table') {
      const lines = PERSONS.map((p, i) =>
        line(rng.pick(PRONOUNS[p].filter((x) => x !== 'on')), inf, i),
      );
      return {
        widget: 'fill-blank',
        instruction: `CONJUGUE le verbe ${inf} au présent : COMPLÈTE les terminaisons.`,
        prompt: lines.join('\n'),
        blanks: PERSONS.map(choice),
        data: { inf, persons: [...PERSONS] },
      };
    }
    const person = rng.int(0, 5) as Person;
    const pronoun = rng.pick(PRONOUNS[person].filter((p) => p !== 'on'));
    return {
      widget: 'fill-blank',
      instruction,
      prompt: `${inf} → ${line(pronoun, inf, 0)}`,
      blanks: [choice()],
      data: { inf, persons: [person] },
    };
  },

  solve: (q) => ({ values: q.data.persons.map(endingOf) }),

  explain(q) {
    const { inf, persons, sentence, subject } = q.data;
    if (persons.length > 1) {
      const forms = persons.map((p) =>
        withSubject(PRONOUNS[p][0]!, radicalOf(inf) + endingOf(p)).replace("'", '’'),
      );
      return `${inf} au présent : ${forms.join(', ')}.`;
    }
    const person = persons[0]!;
    const who = PRONOUNS[person].join(' ou ').replace(/ ou (?=.* ou )/, ', ');
    const rule = `Avec ${who}, la terminaison est -${endingOf(person)}`;
    if (!sentence) return `${rule} : ${radicalOf(inf)}${endingOf(person)}.`;
    const replaced = subject ? ` « ${subject} », je peux le remplacer par ${who}.` : '';
    return `${sentence}${replaced} ${rule}.`;
  },

  signature: (q) => q.prompt,
});
