import { defineLevels, definePlugin, type Blank } from '@app/core';
import { ADJECTIVES, determiner, nounsOf, type PluralRule } from '../../lib/pluriel';

// L'accord dans le groupe nominal : des ballons rouges, une petite fleur, les jolies robes.

interface Params {
  rules: PluralRule[];
  /** Avec un adjectif à accorder aussi. */
  adjective: boolean;
}

interface Data {
  values: string[];
  plural: boolean;
  group: string;
}

export default definePlugin<'fill-blank', Params, Data>('fill-blank', {
  id: 'francais.orthographe.accorde',
  version: 1,
  title: 'Accorde le groupe de mots',
  description: 'Des ballons rouges : le nom et l’adjectif s’accordent.',
  icon: '🎈',
  notions: ['francais.orthographe.accord'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'Le nom', grade: 'CE1', params: { rules: ['s', 'x'], adjective: false } },
    { label: 'Le nom et l’adjectif', grade: 'CE1', params: { rules: ['s', 'x'], adjective: true } },
    {
      label: 'Avec les mots qui ne changent pas',
      grade: 'CE1',
      params: { rules: ['s', 'x', 'same'], adjective: true },
    },
  ]),

  generate({ rng, params }) {
    const noun = rng.pick(nounsOf(params.rules));
    const plural = rng.chance(0.6);
    // Pour un mot qui ne change pas, le piège est le s en trop (des souriss).
    const choice = (sing: string, plur: string): Blank => ({
      kind: 'choice',
      options: rng.shuffle([sing, plur === sing ? `${sing}s` : plur]),
    });
    const nounBlank = choice(noun.sing, noun.plur);
    const nounValue = plural ? noun.plur : noun.sing;
    if (!params.adjective) {
      const det = determiner(rng, noun, plural);
      const joined = det.endsWith('’');
      return {
        widget: 'fill-blank',
        instruction: 'CHOISIS le mot bien écrit.',
        prompt: `${det}${joined ? '' : ' '}{0}`,
        blanks: [nounBlank],
        data: { values: [nounValue], plural, group: `${det}${joined ? '' : ' '}${nounValue}` },
      };
    }
    const a = rng.pick(ADJECTIVES);
    const base = noun.f ? a.f : a.m;
    const adjValue = plural ? `${base}s` : base;
    const adjBlank = choice(base, `${base}s`);
    const det = determiner(rng, noun, plural, a.before ? base : noun.sing);
    const joined = det.endsWith('’');
    const head = `${det}${joined ? '' : ' '}`;
    const values = a.before ? [adjValue, nounValue] : [nounValue, adjValue];
    return {
      widget: 'fill-blank',
      instruction: 'CHOISIS les mots bien écrits.',
      prompt: `${head}{0} {1}`,
      blanks: a.before ? [adjBlank, nounBlank] : [nounBlank, adjBlank],
      data: { values, plural, group: `${head}${values.join(' ')}` },
    };
  },

  solve: (q) => ({ values: [...q.data.values] }),

  explain: (q) =>
    q.data.plural
      ? `Il y en a plusieurs : tous les mots du groupe sont au pluriel. « ${q.data.group} »`
      : `Il n’y en a qu’un : les mots restent au singulier. « ${q.data.group} »`,

  // Le même groupe de mots, quel que soit l'ordre des étiquettes.
  signature: (q) => q.data.group,
});
