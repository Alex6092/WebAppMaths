import { compareBlanks, defineLevels, definePlugin } from '@app/core';
import { DICTEE_6_NOTION } from '../../lib/lettre-p';

const GROUPS = [
  ['une belle photo', 'de belles photos', 'de loups'],
  ['un petit loup', 'de petits loups', ''],
  ['un grand groupe', 'de grands groupes', 'd’élèves'],
  ['une jolie nappe', 'de jolies nappes', 'à carreaux'],
  ['un album rouge', 'des albums rouges', 'de photos'],
  ['une petite boîte', 'de petites boîtes', 'à crayons'],
  ['un nouveau jeu', 'de nouveaux jeux', 'de cartes'],
  ['un vieux phare', 'de vieux phares', 'de Bretagne'],
  ['une grande affiche', 'de grandes affiches', 'de cinéma'],
  ['un chapeau bleu', 'des chapeaux bleus', 'de pluie'],
  ['une fleur blanche', 'des fleurs blanches', 'du jardin'],
  ['un bon gâteau', 'de bons gâteaux', 'au chocolat'],
] as const;

export default definePlugin('fill-blank', {
  id: 'francais.orthographe.pluriel-groupe',
  version: 1,
  title: 'Écris le groupe nominal au pluriel',
  description: 'Accorde le nom et son adjectif. Garde les mots qui complètent le nom.',
  icon: '✏️',
  notions: ['francais.orthographe.accord', DICTEE_6_NOTION],
  expectedLevel: 1,
  levels: defineLevels([{ label: 'Avec un adjectif', grade: 'CE1', params: {} }]),

  generate({ rng }) {
    const [singular, plural, complement] = rng.pick(GROUPS);
    const suffix = complement ? ` ${complement}` : '';
    const answer = plural + suffix;
    const accepted = [...new Set([answer, answer.replace(/^de /, 'des ')])];
    return {
      widget: 'fill-blank',
      instruction: 'ÉCRIS le groupe nominal entier au pluriel.',
      prompt: `${singular}${suffix} → {0}`,
      blanks: [{ kind: 'text', size: 28 }],
      data: { answer, accepted },
    };
  },

  solve: (q) => ({ values: [q.data.answer] }),
  check: (q, answer) => compareBlanks(q, [q.data.accepted], answer),
  explain: (q) =>
    `Au pluriel, on peut écrire « ${q.data.answer} ». Les mots qui complètent le nom restent tels quels.`,
  signature: (q) => q.data.answer,
});
