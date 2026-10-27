import { compareBlanks, defineLevels, definePlugin } from '@app/core';
import { determiner, group, nounsOf, RULE_TEXT, type PluralRule } from '../../lib/pluriel';

// « ÉCRIS au pluriel » : un chat → des chats, un gâteau → des gâteaux, une souris → des souris.

interface Params {
  rules: PluralRule[];
}

interface Data {
  sing: string;
  plur: string;
  rule: PluralRule;
}

export default definePlugin<'fill-blank', Params, Data>('fill-blank', {
  id: 'francais.orthographe.ecris-pluriel',
  version: 1,
  title: 'Écris au pluriel',
  description: 'Un chat → des chats, un gâteau → des gâteaux.',
  icon: '🐱',
  notions: ['francais.orthographe.pluriel'],
  expectedLevel: 3,
  levels: defineLevels<Params>([
    { label: 'On ajoute un s', grade: 'CE1', params: { rules: ['s'] } },
    { label: 'eau, au, eu : un x', grade: 'CE1', params: { rules: ['s', 'x'] } },
    { label: 'Les mots en s, x, z', grade: 'CE1', params: { rules: ['s', 'x', 'same'] } },
    {
      label: 'al → aux, bijou → bijoux',
      grade: 'CE2',
      params: { rules: ['s', 'x', 'same', 'aux', 'oux'] },
    },
  ]),

  generate({ rng, params }) {
    // Les règles nouvelles du niveau reviennent plus souvent.
    const rule = rng.chance(0.5) ? params.rules[params.rules.length - 1]! : rng.pick(params.rules);
    const noun = rng.pick(nounsOf([rule]));
    const one = determiner(rng, noun, false);
    const many = rng.pick(['des', 'les', 'mes']);
    return {
      widget: 'fill-blank',
      instruction: 'ÉCRIS le mot au pluriel.',
      prompt: `${group(one, noun.sing)} → ${many} {0}`,
      blanks: [{ kind: 'text', size: 10 }],
      ...(noun.icon
        ? { picture: { kind: 'icons' as const, icons: [noun.icon, noun.icon, noun.icon] } }
        : {}),
      data: { sing: noun.sing, plur: noun.plur, rule: noun.rule },
    };
  },

  solve: (q) => ({ values: [q.data.plur] }),

  // Le mot laissé au singulier : on rappelle qu'il y en a plusieurs.
  check(q, answer) {
    const result = compareBlanks(q, [[q.data.plur]], answer);
    if (!result.correct && answer.values[0]?.trim().toLowerCase() === q.data.sing)
      return { ...result, feedback: 'Il y en a plusieurs : le mot change au pluriel ! ✏️' };
    return result;
  },

  explain: (q) => `${RULE_TEXT[q.data.rule].replace(/\*\*/g, '')} ${q.data.sing} → ${q.data.plur}`,

  signature: (q) => q.data.sing,
});
