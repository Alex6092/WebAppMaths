/**
 * La dictée : des mots courants du CE1 rangés par son, chacun avec un petit groupe de mots pour
 * l'entendre en contexte (« une maison »), et des phrases courtes faites avec ces mots.
 * Les listes de mots de la classe pourront s'ajouter ici.
 */

export interface DictationWord {
  word: string;
  /** Le mot dans un petit groupe, pour bien l'entendre : « une maison ». */
  context: string;
  icon?: string;
}

export interface Sound {
  id: string;
  /** Comme on l'écrit au tableau : [ou], [on], [an]… */
  label: string;
  words: DictationWord[];
}

const w = (word: string, context: string, icon?: string): DictationWord => ({
  word,
  context,
  ...(icon ? { icon } : {}),
});

export const SOUNDS: readonly Sound[] = [
  {
    id: 'ou',
    label: 'ou',
    words: [
      w('loup', 'un loup', '🐺'),
      w('poule', 'une poule', '🐔'),
      w('bouche', 'une bouche', '👄'),
      w('mouton', 'un mouton', '🐑'),
      w('souris', 'une souris', '🐭'),
      w('hibou', 'un hibou', '🦉'),
      w('roue', 'une roue'),
      w('jour', 'un jour'),
      w('rouge', 'un ballon rouge'),
      w('genou', 'un genou'),
    ],
  },
  {
    id: 'on',
    label: 'on',
    words: [
      w('ballon', 'un ballon', '🎈'),
      w('bonbon', 'un bonbon', '🍬'),
      w('maison', 'une maison', '🏠'),
      w('lion', 'un lion', '🦁'),
      w('cochon', 'un cochon', '🐷'),
      w('avion', 'un avion', '✈️'),
      w('camion', 'un camion', '🚚'),
      w('citron', 'un citron', '🍋'),
      w('pont', 'un pont'),
      w('long', 'un long chemin'),
    ],
  },
  {
    id: 'an',
    label: 'an, en',
    words: [
      w('maman', 'ma maman'),
      w('enfant', 'un enfant', '🧒'),
      w('dent', 'une dent', '🦷'),
      w('vent', 'le vent', '🌬️'),
      w('éléphant', 'un éléphant', '🐘'),
      w('banane', 'une banane', '🍌'),
      w('orange', 'une orange', '🍊'),
      w('serpent', 'un serpent', '🐍'),
      w('tente', 'une tente', '⛺'),
      w('grand', 'un grand arbre'),
    ],
  },
  {
    id: 'in',
    label: 'in, ain',
    words: [
      w('lapin', 'un lapin', '🐰'),
      w('sapin', 'un sapin', '🎄'),
      w('main', 'une main', '✋'),
      w('pain', 'du pain', '🍞'),
      w('train', 'un train', '🚂'),
      w('raisin', 'du raisin', '🍇'),
      w('poussin', 'un poussin', '🐥'),
      w('dauphin', 'un dauphin', '🐬'),
      w('jardin', 'un jardin'),
      w('matin', 'le matin'),
    ],
  },
  {
    id: 'oi',
    label: 'oi',
    words: [
      w('roi', 'un roi', '🤴'),
      w('étoile', 'une étoile', '⭐'),
      w('poire', 'une poire', '🍐'),
      w('voiture', 'une voiture', '🚗'),
      w('oiseau', 'un oiseau', '🐦'),
      w('noix', 'une noix'),
      w('bois', 'le bois'),
      w('doigt', 'un doigt'),
      w('soir', 'le soir'),
      w('moi', 'avec moi'),
    ],
  },
  {
    id: 'eu',
    label: 'eu, eur',
    words: [
      w('feu', 'un feu', '🔥'),
      w('fleur', 'une fleur', '🌸'),
      w('cœur', 'un cœur', '❤️'),
      w('beurre', 'du beurre', '🧈'),
      w('bleu', 'un ciel bleu'),
      w('jeu', 'un jeu', '🎲'),
      w('heure', 'une heure'),
      w('peur', 'avoir peur'),
      w('neuf', 'neuf billes'),
      w('jeudi', 'jeudi'),
    ],
  },
  {
    id: 'o',
    label: 'au, eau',
    words: [
      w('chapeau', 'un chapeau', '🎩'),
      w('gâteau', 'un gâteau', '🎂'),
      w('bateau', 'un bateau', '⛵'),
      w('château', 'un château', '🏰'),
      w('cadeau', 'un cadeau', '🎁'),
      w('eau', 'de l’eau', '💧'),
      w('jaune', 'un citron jaune'),
      w('chaud', 'il fait chaud'),
      w('beau', 'un beau dessin'),
      w('auto', 'une auto'),
    ],
  },
  {
    id: 'e',
    label: 'é',
    words: [
      w('école', 'une école', '🏫'),
      w('bébé', 'un bébé', '👶'),
      w('café', 'un café', '☕'),
      w('vélo', 'un vélo', '🚲'),
      w('fusée', 'une fusée', '🚀'),
      w('été', 'l’été'),
      w('télé', 'la télé', '📺'),
      w('épée', 'une épée'),
      w('cinéma', 'le cinéma'),
      w('fée', 'une fée', '🧚'),
    ],
  },
  {
    id: 'ai',
    label: 'è, ê, ai',
    words: [
      w('fête', 'une fête', '🎉'),
      w('forêt', 'une forêt', '🌲'),
      w('fenêtre', 'une fenêtre', '🪟'),
      w('chèvre', 'une chèvre', '🐐'),
      w('zèbre', 'un zèbre', '🦓'),
      w('mère', 'ma mère'),
      w('frère', 'mon frère'),
      w('tête', 'la tête'),
      w('lait', 'du lait', '🥛'),
      w('reine', 'une reine', '👸'),
    ],
  },
  {
    id: 'ch',
    label: 'ch',
    words: [
      w('chat', 'un chat', '🐱'),
      w('chien', 'un chien', '🐶'),
      w('cheval', 'un cheval', '🐴'),
      w('vache', 'une vache', '🐄'),
      w('cloche', 'une cloche', '🔔'),
      w('chocolat', 'du chocolat', '🍫'),
      w('chaussure', 'une chaussure', '👟'),
      w('niche', 'une niche'),
      w('poche', 'une poche'),
      w('riche', 'un roi riche'),
    ],
  },
  {
    id: 'ill',
    label: 'ill, eil',
    words: [
      w('fille', 'une fille', '👧'),
      w('bille', 'une bille'),
      w('feuille', 'une feuille', '🍁'),
      w('papillon', 'un papillon', '🦋'),
      w('abeille', 'une abeille', '🐝'),
      w('chenille', 'une chenille', '🐛'),
      w('oreille', 'une oreille', '👂'),
      w('soleil', 'le soleil', '☀️'),
      w('grenouille', 'une grenouille', '🐸'),
      w('coquillage', 'un coquillage', '🐚'),
    ],
  },
  {
    id: 'gn',
    label: 'gn',
    words: [
      w('montagne', 'une montagne', '⛰️'),
      w('champignon', 'un champignon', '🍄'),
      w('araignée', 'une araignée', '🕷️'),
      w('cygne', 'un cygne', '🦢'),
      w('ligne', 'une ligne'),
      w('peigne', 'un peigne'),
      w('campagne', 'la campagne'),
      w('signe', 'un signe'),
      w('gagner', 'gagner un match'),
      w('agneau', 'un agneau'),
    ],
  },
];

/** Des phrases courtes avec les mots de la dictée. */
export const SENTENCES: readonly string[] = [
  'Le lapin mange une carotte.',
  'Le chat dort sur le lit.',
  'Ma maman fait un gâteau.',
  'Le loup a peur du feu.',
  'Le bateau est sur l’eau.',
  'Le roi a une belle étoile.',
  'Mon frère joue au ballon.',
  'La poule cherche du pain.',
  'Le soleil brille ce matin.',
  'La vache est dans le pré.',
  'Le bébé boit du lait.',
  'Il fait chaud en été.',
  'Le train part le soir.',
  'Une abeille vole sur la fleur.',
  'Le chien court dans le jardin.',
  'Le papillon est jaune et bleu.',
  'Mon vélo est rouge.',
  'La fille a un chapeau.',
  'Le cheval mange du foin.',
  'Le sapin est dans la forêt.',
  'Le lion dort sous un arbre.',
  'Le hibou chante la nuit.',
  'Le poussin est tout petit.',
  'Il y a un cadeau pour toi.',
  'La souris a une longue queue.',
  'Le dauphin saute dans la mer.',
  'Mon chat aime le poisson.',
  'Le cochon est tout rose.',
  'La grenouille saute dans la mare.',
  'Le vent souffle sur la montagne.',
];

/** Les mots d'une phrase (« l’eau » en un seul), et le point à part. */
export function sentenceWords(sentence: string): { words: string[]; end: string } {
  return { words: sentence.slice(0, -1).split(' '), end: sentence.slice(-1) };
}
