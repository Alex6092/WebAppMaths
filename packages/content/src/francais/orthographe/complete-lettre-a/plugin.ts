import { defineLevels, definePlugin } from '@app/core';
import { A_NOTION, DICTEE_7_NOTION } from '../../lib/lettre-a';

// Dictée 7, exercice 2 : « COMPLÈTE avec a, ai ou an » (l'enf_nt, jam_s, mainten_t…), puis
// les accents de la fiche ORTHO 7 (un âne, déjà) et le m devant m, b, p (une ampoule).

type Bank = 'a-ai-an' | 'accents' | 'an-am';

const BANKS: Record<Bank, readonly (readonly [string, string])[]> = {
  'a-ai-an': [
    ['l’enf_nt', 'an'],
    ['jam_s', 'ai'],
    ['le gr_d-père', 'an'],
    ['un ren_rd', 'a'],
    ['une ch_ne', 'ai'],
    ['mainten_t', 'an'],
    ['une gr_ne', 'ai'],
    ['tr_vailler', 'a'],
    ['un f_tôme', 'an'],
    ['la v_sselle', 'ai'],
    ['mam_n', 'an'],
    ['une c_rte', 'a'],
    ['du l_t', 'ai'],
    ['un g_t', 'an'],
    ['une m_son', 'ai'],
    ['un c_nard', 'a'],
    ['bl_c', 'an'],
    ['une fr_se', 'ai'],
    ['un l_c', 'a'],
    ['une ch_se', 'ai'],
    ['un cart_ble', 'a'],
  ],
  accents: [
    ['un _ne', 'â'],
    ['un m_t', 'â'],
    ['_gé', 'â'],
    ['déj_', 'à'],
    ['l_-bas', 'à'],
    ['une p_te à crêpes', 'â'],
    ['un ch_teau', 'â'],
    ['voil_', 'à'],
    ['un g_teau', 'â'],
    ['un b_ton', 'â'],
    ['Il est _ l’école.', 'à'],
    ['un cart_ble', 'a'],
    ['la cl_sse', 'a'],
    ['m_rcher', 'a'],
    ['le l_ma', 'a'],
    ['un r_t', 'a'],
  ],
  'an-am': [
    ['une _poule', 'am'],
    ['m_ger', 'an'],
    ['bl_c', 'an'],
    ['une l_pe', 'am'],
    ['un ch_p', 'am'],
    ['une j_be', 'am'],
    ['un g_t', 'an'],
    ['une ch_bre', 'am'],
    ['gr_d', 'an'],
    ['un c_p', 'am'],
    ['un fl_', 'an'],
    ['tr_quille', 'an'],
    ['un t_bour', 'am'],
    ['ch_ter', 'an'],
    ['une br_che', 'an'],
    ['ass_bler', 'am'],
  ],
};

const OPTIONS: Record<Bank, string[]> = {
  'a-ai-an': ['a', 'ai', 'an'],
  accents: ['a', 'â', 'à'],
  'an-am': ['an', 'am'],
};

const RULE: Record<Bank, string> = {
  'a-ai-an': '',
  accents: ' Le mot s’écrit avec un accent : je dois le retenir.',
  'an-am': ' Devant m, b et p, on écrit am : une ampoule, une jambe, une lampe.',
};

export default definePlugin('fill-blank', {
  id: 'francais.orthographe.complete-lettre-a',
  version: 1,
  title: 'Complète avec a, ai ou an',
  description: 'La lettre a toute seule, avec un accent, ou avec d’autres lettres.',
  icon: '✏️',
  notions: [A_NOTION, DICTEE_7_NOTION],
  expectedLevel: 3,
  levels: defineLevels<{ bank: Bank }>([
    { label: 'a, ai ou an', grade: 'CE1', params: { bank: 'a-ai-an' } },
    { label: 'a, â ou à', grade: 'CE1', params: { bank: 'accents' } },
    { label: 'an ou am', grade: 'CE1', params: { bank: 'an-am' } },
  ]),

  generate({ rng, params }) {
    const [text, letters] = rng.pick(BANKS[params.bank]);
    const options = OPTIONS[params.bank];
    return {
      widget: 'fill-blank',
      instruction: `COMPLÈTE avec ${options.slice(0, -1).join(', ')} ou ${options.at(-1)}.`,
      prompt: text.replace('_', '{0}'),
      blanks: [{ kind: 'choice', options: [...options] }],
      data: { text, letters, bank: params.bank },
    };
  },

  solve: (q) => ({ values: [q.data.letters] }),

  explain: (q) => {
    const word = q.data.text.replace('_', q.data.letters);
    const rule = q.data.letters === 'am' || q.data.letters === 'â' ? RULE[q.data.bank] : '';
    return `On écrit « ${word} ».${rule}`;
  },

  signature: (q) => q.data.text,
});
