import { defineLevels, definePlugin } from '@app/core';
import { conjugate, PRONOUNS, startsWithVowel, type Person } from '../../lib/conjugaison';
import { capitalize } from '../../lib/indicateurs';
import { endingOf, PRESENT_ER_NOTION, radicalOf, SOFT_ER } from '../../lib/premier-groupe';

// CONJ 3 : « Je fais attention au son quand je conjugue les verbes en -ger ; -cer. »
// nous mangeons (le e garde le son [j]), nous commençons (le ç garde le son [s]) ;
// mais il lance, sans ç devant e.

interface Params {
  /** Aussi je, tu, il, ils : le ç n'y sert à rien (il lance, pas « il lançe »). */
  allPersons: boolean;
}

interface Data {
  inf: string;
  person: Person;
  answer: string;
  wrong: string;
}

const CER = SOFT_ER.filter((v) => v.inf.endsWith('cer'));

/** L'erreur à éviter : oublier le e ou le ç devant -ons, ou mettre un ç devant e. */
function mistake(inf: string, person: Person): string {
  const radical = radicalOf(inf);
  if (person === 3) return radical + 'ons';
  return radical.slice(0, -1) + 'ç' + endingOf(person);
}

export default definePlugin<'mcq', Params, Data>('mcq', {
  id: 'francais.conjugaison.nous-ger-cer',
  version: 1,
  title: 'Nous mangeons, nous commençons',
  description: 'Les verbes en -ger et -cer : je fais attention au son.',
  icon: '👂',
  notions: [PRESENT_ER_NOTION],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'Avec « nous »', grade: 'CE1', params: { allPersons: false } },
    { label: 'Avec toutes les personnes', grade: 'CE1', params: { allPersons: true } },
  ]),
  minVariety: 10,

  generate({ rng, params }) {
    const withNous = !params.allPersons || rng.chance(0.5);
    const verb = rng.pick(withNous ? SOFT_ER : CER);
    // Pas de « vous » : vous mangez, vous lancez s'écrivent sans piège.
    const persons: Person[] = withNous ? [3] : startsWithVowel(verb.inf) ? [1, 2, 5] : [0, 1, 2, 5];
    const person = rng.pick(persons);
    const pronoun = rng.pick(PRONOUNS[person].filter((p) => p !== 'on'));
    const answer = conjugate(verb.inf, 'present', person);
    const wrong = mistake(verb.inf, person);
    const choices = rng.shuffle([answer, wrong]).map((form) => ({ id: form, label: form }));
    return {
      widget: 'mcq',
      instruction: 'CHOISIS le verbe bien écrit. Je fais attention au son !',
      prompt: `${capitalize(pronoun)} {?} ${rng.pick(verb.compl)}.`,
      choices,
      multiple: false,
      layout: 'row',
      data: { inf: verb.inf, person, answer, wrong },
    };
  },

  solve: (q) => ({ selected: [q.data.answer] }),

  explain(q) {
    const { inf, person, answer } = q.data;
    const ger = inf.endsWith('ger');
    if (person === 3)
      return ger
        ? `nous ${answer} : sans le e, on lirait [g] comme dans « gomme ». Le e garde le son [j] comme dans « je ».`
        : `nous ${answer} : sans la cédille, on lirait [k] comme dans « flacon ». Le ç garde le son [s] de ${inf}.`;
    return `${answer} : devant e, le c fait déjà [s], pas besoin de cédille.`;
  },

  invariants: (q) => (q.data.answer === q.data.wrong ? 'les deux choix sont pareils' : undefined),

  signature: (q) => `${q.data.inf}-${q.data.person}`,
});
