import { defineLevels, definePlugin } from '@app/core';
import { conjugate, type Person } from '../../lib/conjugaison';
import { DICTEE_7_NOTION } from '../../lib/lettre-a';
import { ALLER_NOTION } from '../../lib/premier-groupe';

// Dictée 7, exercice 3 : « ENTOURE le bon verbe conjugué. » La classe ( va / vont ) en voyage
// scolaire. Puis toutes les personnes du verbe aller au présent.

interface Params {
  persons: Person[];
}

interface Data {
  subject: string;
  person: Person;
  answer: string;
}

const SUBJECTS: Record<Person, readonly string[]> = {
  0: ['Je'],
  1: ['Tu'],
  // « La classe », « Le groupe » : un seul groupe, donc va.
  2: ['Lila', 'Tao', 'La classe', 'Le maître', 'Mon frère', 'Il', 'Elle', 'On', 'Le groupe'],
  3: ['Nous', 'Tao et moi'],
  4: ['Vous', 'Lila et toi'],
  5: ['Tao et Lila', 'Les enfants', 'Ils', 'Elles', 'Les élèves', 'Mes parents', 'Les touristes'],
};

const PLACES = [
  'en voyage scolaire',
  'en Asie en avion',
  'au Tibet voir l’Everest',
  'visiter ce musée',
  'découvrir des œuvres',
  'à la piscine',
  'au marché à pied',
  'chez Mamie',
  'au parc',
  'à la plage',
];

const FORMS = ([0, 1, 2, 3, 4, 5] as const).map((p) => conjugate('aller', 'present', p));

export default definePlugin<'fill-blank', Params, Data>('fill-blank', {
  id: 'francais.conjugaison.va-vont',
  version: 1,
  title: 'Le verbe aller au présent',
  description: 'La classe va, les enfants vont : je choisis selon le sujet.',
  icon: '🚌',
  notions: [ALLER_NOTION, DICTEE_7_NOTION],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'va ou vont', grade: 'CE1', params: { persons: [2, 5] } },
    { label: 'Toutes les personnes', grade: 'CE1', params: { persons: [0, 1, 2, 3, 4, 5] } },
  ]),
  minVariety: 15,

  generate({ rng, params }) {
    const person = rng.pick(params.persons);
    const subject = rng.pick(SUBJECTS[person]);
    const options = params.persons.map((p) => FORMS[p]!);
    return {
      widget: 'fill-blank',
      instruction: 'CHOISIS le bon verbe conjugué.',
      prompt: `${subject} {0} ${rng.pick(PLACES)}.`,
      blanks: [{ kind: 'choice', options }],
      data: { subject, person, answer: FORMS[person]! },
    };
  },

  solve: (q) => ({ values: [q.data.answer] }),

  explain(q) {
    const { subject, person, answer } = q.data;
    const pronoun = ['je', 'tu', 'il, elle ou on', 'nous', 'vous', 'ils ou elles'][person]!;
    const lower = /^(Je|Tu|Il|Elle|On|Nous|Vous|Ils|Elles)$/.test(subject);
    const replaced = lower ? '' : ` « ${subject} », c’est ${pronoun}.`;
    const sentence = q.prompt.replace('{0}', answer);
    return `${sentence}${replaced} Avec ${pronoun}, aller s’écrit « ${answer} ».`;
  },

  signature: (q) => q.prompt,
});
