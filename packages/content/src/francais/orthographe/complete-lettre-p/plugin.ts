import { defineLevels, definePlugin } from '@app/core';
import { DICTEE_6_NOTION, P_NOTION } from '../../lib/lettre-p';

const SPELLINGS = [
  ['_etit', 'p'],
  ['tro_', 'p'],
  ['la _armacie', 'ph'],
  ['une es_èce', 'p'],
  ['une com_tine', 'p'],
  ['un hémis_ère', 'ph'],
  ['une _roie', 'p'],
  ['l’orthogra_e', 'ph'],
  ['un _are', 'ph'],
  ['un _iano', 'p'],
  ['un tro_ée', 'ph'],
  ['un _anier', 'p'],
] as const;

const LETTERS = [
  ['se re_oser après le sport', 'p'],
  ['une es_èce de loup', 'p'],
  ['un con_inent sur la carte', 't'],
  ['un ca_eau pour son anniversaire', 'd'],
  ['une _our très haute', 't'],
  ['é_onner ses amis', 't'],
  ['_écouvrir un trésor', 'd'],
  ['une _hoto de la classe', 'p'],
  ['_ormir toute la nuit', 'd'],
  ['un pe_it chat', 't'],
  ['un _rapeau qui flotte', 'd'],
  ['une _oule dans le poulailler', 'p'],
] as const;

export default definePlugin('fill-blank', {
  id: 'francais.orthographe.complete-lettre-p',
  version: 1,
  title: 'Complète avec p, ph, t ou d',
  description: 'Choisis les lettres qui manquent dans les mots.',
  icon: '✏️',
  notions: [P_NOTION, DICTEE_6_NOTION],
  expectedLevel: 2,
  levels: defineLevels([
    { label: 'p ou ph', grade: 'CE1', params: { mixed: false } },
    { label: 't, d ou p', grade: 'CE1', params: { mixed: true } },
  ]),

  generate({ rng, params }) {
    const bank: readonly (readonly [string, string])[] = params.mixed ? LETTERS : SPELLINGS;
    const [text, letter] = rng.pick(bank);
    return {
      widget: 'fill-blank',
      instruction: params.mixed ? 'COMPLÈTE avec t, d ou p.' : 'COMPLÈTE avec p ou ph.',
      prompt: text.replace('_', '{0}'),
      blanks: [{ kind: 'choice', options: params.mixed ? ['t', 'd', 'p'] : ['p', 'ph'] }],
      data: { text, letter },
    };
  },

  solve: (q) => ({ values: [q.data.letter] }),
  explain: (q) => `On écrit « ${q.data.text.replace('_', q.data.letter)} ».`,
  signature: (q) => q.data.text,
});
