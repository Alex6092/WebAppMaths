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

// ORTHO 6 : p, pp ou ph, et le p muet qu'il ne faut pas oublier (compter, beaucoup).
const LESSON = [
  ['une _oule', 'p'],
  ['_ouvoir', 'p'],
  ['un ser_ent', 'p'],
  ['sim_le', 'p'],
  ['un sli_', 'p'],
  ['sto_', 'p'],
  ['s’a_eler', 'pp'],
  ['une envelo_e', 'pp'],
  ['a_orter', 'pp'],
  ['une na_e', 'pp'],
  ['un hi_opotame', 'pp'],
  ['une _oto', 'ph'],
  ['un _are', 'ph'],
  ['un télé_one', 'ph'],
  ['un dau_in', 'ph'],
  ['un élé_ant', 'ph'],
  ['com_ter', 'p'],
  ['se_t', 'p'],
  ['dom_ter', 'p'],
  ['un lou_', 'p'],
  ['beaucou_', 'p'],
  ['tro_', 'p'],
] as const;

type Bank = 'p-ph' | 'mixed' | 'lesson';

const BANKS: Record<Bank, readonly (readonly [string, string])[]> = {
  'p-ph': SPELLINGS,
  mixed: LETTERS,
  lesson: LESSON,
};

const OPTIONS: Record<Bank, string[]> = {
  'p-ph': ['p', 'ph'],
  mixed: ['t', 'd', 'p'],
  lesson: ['p', 'pp', 'ph'],
};

export default definePlugin('fill-blank', {
  id: 'francais.orthographe.complete-lettre-p',
  version: 1,
  title: 'Complète avec p, ph, t ou d',
  description: 'Choisis les lettres qui manquent dans les mots.',
  icon: '✏️',
  notions: [P_NOTION, DICTEE_6_NOTION],
  expectedLevel: 3,
  levels: defineLevels<{ bank: Bank }>([
    { label: 'p ou ph', grade: 'CE1', params: { bank: 'p-ph' } },
    { label: 't, d ou p', grade: 'CE1', params: { bank: 'mixed' } },
    { label: 'p, pp ou ph', grade: 'CE1', params: { bank: 'lesson' } },
  ]),

  generate({ rng, params }) {
    const [text, letter] = rng.pick(BANKS[params.bank]);
    const options = OPTIONS[params.bank];
    return {
      widget: 'fill-blank',
      instruction: `COMPLÈTE avec ${options.slice(0, -1).join(', ')} ou ${options.at(-1)}.`,
      prompt: text.replace('_', '{0}'),
      blanks: [{ kind: 'choice', options }],
      data: { text, letter },
    };
  },

  solve: (q) => ({ values: [q.data.letter] }),
  explain: (q) => `On écrit « ${q.data.text.replace('_', q.data.letter)} ».`,
  signature: (q) => q.data.text,
});
