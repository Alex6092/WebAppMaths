import { defineLevels, definePlugin } from '@app/core';
import { conjugate } from '../../lib/conjugaison';
import { DICTEE_6_NOTION } from '../../lib/lettre-p';

const VERBS = ['montrer', 'apporter', 'chasser', 'trouver'];

export default definePlugin('fill-blank', {
  id: 'francais.conjugaison.present-ils-elles',
  version: 1,
  title: 'Conjugue au présent avec ils ou elles',
  description: 'Entraîne-toi à écrire la terminaison -ent des verbes en -er.',
  icon: '🗣️',
  notions: ['francais.conjugaison.present-er', DICTEE_6_NOTION],
  expectedLevel: 1,
  levels: defineLevels([{ label: 'Avec ils et elles', grade: 'CE1', params: {} }]),
  minVariety: VERBS.length * 2,

  generate({ rng }) {
    const infinitive = rng.pick(VERBS);
    const pronoun = rng.pick(['ils', 'elles']);
    return {
      widget: 'fill-blank',
      instruction: 'CONJUGUE le verbe au présent.',
      prompt: `${infinitive} → ${pronoun} {0}`,
      blanks: [{ kind: 'text', size: 12 }],
      data: { infinitive, pronoun, verb: conjugate(infinitive, 'present', 5) },
    };
  },

  solve: (q) => ({ values: [q.data.verb] }),
  explain: (q) =>
    `On écrit « ${q.data.pronoun} ${q.data.verb} ». Avec ils ou elles, ces verbes se terminent par -ent au présent.`,
  signature: (q) => `${q.data.infinitive}-${q.data.pronoun}`,
});
