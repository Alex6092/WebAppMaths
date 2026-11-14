import { compareBlanks, defineLevels, definePlugin } from '@app/core';
import { P_NOTION } from '../../lib/lettre-p';

const RIDDLES = [
  ['Je suis la femelle du coq.', 'poule'],
  ['Je suis une tour lumineuse qui guide les bateaux.', 'phare'],
  ['Je suis un grand animal gris avec une trompe.', 'éléphant'],
  ['On me pose sur la table avant de mettre les assiettes.', 'nappe'],
  ['Je suis un appareil qui sert à appeler quelqu’un.', 'téléphone'],
  ['On me fait avec un appareil et on peut me mettre dans un album.', 'photo', 'photographie'],
  ['Je suis un instrument avec des touches blanches et noires.', 'piano'],
  ['Je brille au plafond quand on appuie sur l’interrupteur.', 'ampoule', 'lampe'],
  ['Je suis un oiseau noir et blanc qui jacasse.', 'pie'],
  ['Je suis un animal à huit bras que l’on trouve dans la mer.', 'poulpe', 'pieuvre'],
  ['Je suis un liquide épais et sucré, parfois à la menthe.', 'sirop'],
  ['On me remet au vainqueur d’une compétition.', 'trophée', 'coupe'],
  ['Je suis un animal de la mer très joueur, qui saute hors de l’eau.', 'dauphin'],
  ['On glisse une lettre dans moi avant de la poster.', 'enveloppe'],
  ['Je suis le nombre qui vient juste après six.', 'sept'],
  ['Je suis un animal sauvage qui hurle à la lune.', 'loup'],
  ['Je suis un panneau rouge : la voiture doit s’arrêter.', 'stop'],
] as const;

export default definePlugin('fill-blank', {
  id: 'francais.orthographe.lettre-p-devinettes',
  version: 2,
  title: 'Devinettes avec la lettre p',
  description: 'Trouve et écris un mot qui contient la lettre p.',
  icon: '🔍',
  notions: [P_NOTION],
  expectedLevel: 1,
  levels: defineLevels([{ label: 'Des mots avec p', grade: 'CE1', params: {} }]),

  generate({ rng }) {
    const [clue, word, ...alternatives] = rng.pick(RIDDLES);
    return {
      widget: 'fill-blank',
      instruction: 'LIS la devinette et ÉCRIS le mot sans déterminant.',
      text: clue,
      prompt: '{0}',
      blanks: [{ kind: 'text', size: 12 }],
      data: { word, alternatives },
    };
  },

  solve: (q) => ({ values: [q.data.word] }),
  check: (q, answer) => compareBlanks(q, [[q.data.word, ...q.data.alternatives]], answer),
  explain: (q) => `Le mot de la devinette s’écrit « ${q.data.word} ».`,
  signature: (q) => q.data.word,
});
