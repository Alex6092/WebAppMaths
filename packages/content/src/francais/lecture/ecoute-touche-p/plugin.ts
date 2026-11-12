import { defineLevels, definePlugin } from '@app/core';
import { P_NOTION } from '../../lib/lettre-p';

// Les choix d’une même banque ont des prononciations distinctes.
const BANKS = {
  simple: ['pa', 'pi', 'pé', 'pou', 'pon'],
  complex: [
    'pur',
    'pra',
    'pal',
    'pif',
    'pla',
    'phé',
    'pour',
    'paf',
    'pho',
    'hippo',
    'appa',
    'prou',
    'phou',
    'preu',
    'pire',
    'phi',
  ],
  words: [
    'le pou',
    'le loup',
    'apporter',
    'un groupe',
    'le passé',
    'papa',
    'le repos',
    's’appeler',
    'des pommes',
    'une photo',
    'repasser',
    'un phare',
    'un poulpe',
    'une pie',
    'attraper',
    'Paris',
    'des espèces',
    'un hémisphère',
    'l’alphabet',
    'un trophée',
    'la pharmacie',
    'présent',
    'une publicité',
    'une éponge',
    'le professeur',
    'une pelouse',
    'un triomphe',
    'un paquet',
    'important',
    'échapper',
    'presque',
    'un parapluie',
  ],
} as const;

export default definePlugin('mcq', {
  id: 'francais.lecture.ecoute-touche-p',
  version: 1,
  title: 'Écoute et touche · La lettre p',
  description: 'Retrouve la syllabe ou le mot que tu entends.',
  icon: '👂',
  notions: ['francais.lecture.decoder', P_NOTION],
  expectedLevel: 3,
  levels: defineLevels<{ bank: keyof typeof BANKS }>([
    { label: 'Syllabes simples', grade: 'CE1', params: { bank: 'simple' } },
    { label: 'Syllabes avec p, pp et ph', grade: 'CE1', params: { bank: 'complex' } },
    { label: 'Les mots de la fiche', grade: 'CE1', params: { bank: 'words' } },
  ]),
  minVariety: BANKS.simple.length,

  generate({ rng, params }) {
    const bank: readonly string[] = BANKS[params.bank];
    const choices = rng.sample(bank, 4).map((label, index) => ({ id: String(index), label }));
    const answer = rng.pick(choices);
    return {
      widget: 'mcq',
      instruction: 'ÉCOUTE et TOUCHE ce que tu entends.',
      speech: 'Écoute, et touche ce que tu entends.',
      listen: answer.label,
      choices,
      multiple: false,
      layout: params.bank === 'words' ? 'list' : 'grid',
      data: { answer },
    };
  },

  solve: (q) => ({ selected: [q.data.answer.id] }),
  explain: (q) => `On entendait « ${q.data.answer.label} ».`,
  signature: (q) => q.data.answer.label,
});
