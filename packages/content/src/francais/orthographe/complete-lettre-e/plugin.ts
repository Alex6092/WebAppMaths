import { defineLevels, definePlugin } from '@app/core';
import { E_NOTION } from '../../lib/lettre-e';

// ORTHO 8 : les écritures du son [é] (é, er, ez), du son [è] (è, ê, ei, et) et du son [an]
// avec la lettre e (en, em).

type Bank = 'accents' | 'son-é' | 'son-è' | 'en-em';

const BANKS: Record<Bank, readonly (readonly [string, string])[]> = {
  accents: [
    ['le march_', 'é'],
    ['un v_lo', 'é'],
    ['un caf_', 'é'],
    ['un pr_', 'é'],
    ['l’_cole', 'é'],
    ['_couter', 'é'],
    ['la f_ve', 'è'],
    ['une r_gle', 'è'],
    ['la m_re', 'è'],
    ['le p_re', 'è'],
    ['une ch_vre', 'è'],
    ['une fl_che', 'è'],
    ['un z_bre', 'è'],
    ['la f_te', 'ê'],
    ['la t_te', 'ê'],
    ['une fen_tre', 'ê'],
    ['une for_t', 'ê'],
    ['une b_te', 'ê'],
  ],
  'son-é': [
    ['le march_', 'é'],
    ['le caf_', 'é'],
    ['l’ét_', 'é'],
    ['la cl_', 'é'],
    ['un d_', 'é'],
    ['une poup_e', 'é'],
    ['ch_', 'ez'],
    ['le n_', 'ez'],
    ['ass_', 'ez'],
    ['vous chant_', 'ez'],
    ['vous dans_', 'ez'],
    ['vous mang_', 'ez'],
    ['il faut chant_', 'er'],
    ['il va jou_', 'er'],
    ['aim_ lire', 'er'],
    ['un pani_', 'er'],
    ['un boulang_', 'er'],
    ['un cahi_', 'er'],
    ['un roch_', 'er'],
  ],
  'son-è': [
    ['la n_ge', 'ei'],
    ['une bal_ne', 'ei'],
    ['s_ze', 'ei'],
    ['tr_ze', 'ei'],
    ['le robin_', 'et'],
    ['un jou_', 'et'],
    ['un poul_', 'et'],
    ['un bonn_', 'et'],
    ['un siffl_', 'et'],
    ['la f_ve', 'è'],
    ['une ch_vre', 'è'],
    ['la m_re', 'è'],
    ['un z_bre', 'è'],
    ['la f_te', 'ê'],
    ['la t_te', 'ê'],
    ['une fen_tre', 'ê'],
    ['une for_t', 'ê'],
  ],
  'en-em': [
    ['l_t', 'en'],
    ['la d_t', 'en'],
    ['le v_t', 'en'],
    ['souv_t', 'en'],
    ['p_dant', 'en'],
    ['un _fant', 'en'],
    ['_semble', 'en'],
    ['une _veloppe', 'en'],
    ['_baller', 'em'],
    ['le t_ps', 'em'],
    ['_mener', 'em'],
    ['_porter', 'em'],
    ['_brasser', 'em'],
    ['_pêcher', 'em'],
    ['déc_bre', 'em'],
    ['nov_bre', 'em'],
  ],
};

const OPTIONS: Record<Bank, string[]> = {
  accents: ['é', 'è', 'ê'],
  'son-é': ['é', 'er', 'ez'],
  'son-è': ['ei', 'et', 'è', 'ê'],
  'en-em': ['en', 'em'],
};

/** L'astuce, selon ce qu'il fallait écrire. */
const TIP: Record<string, string> = {
  er: ' Après « il faut », « il va » ou devant un autre verbe, le verbe est à l’infinitif : -er.',
  ez: ' Avec « vous », le verbe finit par -ez.',
  em: ' Devant m, b et p, on écrit em.',
  et: ' À la fin du mot, et fait souvent [è] : un robinet, un jouet.',
};

export default definePlugin('fill-blank', {
  id: 'francais.orthographe.complete-lettre-e',
  version: 1,
  title: 'Complète les sons de la lettre e',
  description: 'é, è ou ê ? é, er ou ez ? ei ou et ? en ou em ?',
  icon: '✏️',
  notions: [E_NOTION],
  expectedLevel: 4,
  levels: defineLevels<{ bank: Bank }>([
    { label: 'é, è ou ê', grade: 'CE1', params: { bank: 'accents' } },
    { label: '[é] : é, er ou ez', grade: 'CE1', params: { bank: 'son-é' } },
    { label: '[è] : ei, et, è ou ê', grade: 'CE1', params: { bank: 'son-è' } },
    { label: '[an] : en ou em', grade: 'CE1', params: { bank: 'en-em' } },
  ]),

  generate({ rng, params }) {
    const [text, letters] = rng.pick(BANKS[params.bank]);
    const options = OPTIONS[params.bank];
    return {
      widget: 'fill-blank',
      instruction: `COMPLÈTE avec ${options.slice(0, -1).join(', ')} ou ${options.at(-1)}.`,
      prompt: text.replace('_', '{0}'),
      blanks: [{ kind: 'choice', options: [...options] }],
      data: { text, letters },
    };
  },

  solve: (q) => ({ values: [q.data.letters] }),

  explain: (q) => {
    const { text, letters } = q.data;
    // Les astuces de -ez et -er ne valent que pour les verbes (pas pour chez, un panier).
    const verb = /^(vous|il |aim_)/.test(text);
    const tip = (letters === 'ez' || letters === 'er') && !verb ? '' : TIP[letters];
    return `On écrit « ${text.replace('_', letters)} ».${tip ?? ''}`;
  },

  signature: (q) => q.data.text,
});
