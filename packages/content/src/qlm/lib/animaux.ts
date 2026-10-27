/**
 * Les animaux du CE1 : comment ils sont couverts, comment ils se déplacent, leurs petits.
 * Seulement des cas nets : la poule vole un peu, la grenouille saute et nage, le hérisson a
 * des piquants… ils sont gardés pour les petits ou laissés de côté.
 */

export type Cover = 'poils' | 'plumes' | 'ecailles';
export type Move = 'marche' | 'vole' | 'nage' | 'rampe';

export interface Animal {
  /** Avec son article : « le chat ». */
  name: string;
  icon: string;
  cover?: Cover;
  move?: Move;
}

export const ANIMALS: Animal[] = [
  { name: 'le chien', icon: '🐕', cover: 'poils', move: 'marche' },
  { name: 'le chat', icon: '🐈', cover: 'poils', move: 'marche' },
  { name: 'la vache', icon: '🐄', cover: 'poils', move: 'marche' },
  { name: 'le cheval', icon: '🐎', cover: 'poils', move: 'marche' },
  { name: 'le lion', icon: '🦁', cover: 'poils', move: 'marche' },
  { name: 'l’ours', icon: '🐻', cover: 'poils', move: 'marche' },
  { name: 'la girafe', icon: '🦒', cover: 'poils', move: 'marche' },
  { name: 'l’éléphant', icon: '🐘', move: 'marche' },
  { name: 'le renard', icon: '🦊', cover: 'poils', move: 'marche' },
  { name: 'le mouton', icon: '🐑', cover: 'poils', move: 'marche' },
  { name: 'le zèbre', icon: '🦓', cover: 'poils', move: 'marche' },
  { name: 'la souris', icon: '🐁', cover: 'poils', move: 'marche' },
  { name: 'le lapin', icon: '🐇', cover: 'poils' },
  { name: 'la chauve-souris', icon: '🦇', cover: 'poils', move: 'vole' },
  { name: 'la poule', icon: '🐔', cover: 'plumes' },
  { name: 'le canard', icon: '🦆', cover: 'plumes' },
  { name: 'le hibou', icon: '🦉', cover: 'plumes', move: 'vole' },
  { name: 'l’aigle', icon: '🦅', cover: 'plumes', move: 'vole' },
  { name: 'le perroquet', icon: '🦜', cover: 'plumes', move: 'vole' },
  { name: 'le paon', icon: '🦚', cover: 'plumes' },
  { name: 'le cygne', icon: '🦢', cover: 'plumes' },
  { name: 'le manchot', icon: '🐧', cover: 'plumes' },
  { name: 'le flamant rose', icon: '🦩', cover: 'plumes' },
  { name: 'le poisson', icon: '🐟', cover: 'ecailles', move: 'nage' },
  { name: 'le serpent', icon: '🐍', cover: 'ecailles', move: 'rampe' },
  { name: 'le lézard', icon: '🦎', cover: 'ecailles' },
  { name: 'le crocodile', icon: '🐊', cover: 'ecailles' },
  { name: 'le poisson-clown', icon: '🐠', cover: 'ecailles', move: 'nage' },
  { name: 'la baleine', icon: '🐳', move: 'nage' },
  { name: 'le dauphin', icon: '🐬', move: 'nage' },
  { name: 'la pieuvre', icon: '🐙', move: 'nage' },
  { name: 'le requin', icon: '🦈', move: 'nage' },
  { name: 'le papillon', icon: '🦋', move: 'vole' },
  { name: 'l’abeille', icon: '🐝', move: 'vole' },
  { name: 'la coccinelle', icon: '🐞', move: 'vole' },
  { name: 'l’escargot', icon: '🐌', move: 'rampe' },
  { name: 'le ver de terre', icon: '🪱', move: 'rampe' },
];

export const COVER_LABEL: Record<Cover, string> = {
  poils: 'des poils',
  plumes: 'des plumes',
  ecailles: 'des écailles',
};

export const MOVE_LABEL: Record<Move, string> = {
  marche: 'il marche',
  vole: 'il vole',
  nage: 'il nage',
  rampe: 'il rampe',
};

/** Les petits des animaux : le parent, son petit. */
export const BABIES: { parent: string; icon: string; baby: string }[] = [
  { parent: 'la vache', icon: '🐄', baby: 'le veau' },
  { parent: 'la poule', icon: '🐔', baby: 'le poussin' },
  { parent: 'la brebis', icon: '🐑', baby: 'l’agneau' },
  { parent: 'la chatte', icon: '🐈', baby: 'le chaton' },
  { parent: 'la chienne', icon: '🐕', baby: 'le chiot' },
  { parent: 'la jument', icon: '🐎', baby: 'le poulain' },
  { parent: 'la lapine', icon: '🐇', baby: 'le lapereau' },
  { parent: 'la truie', icon: '🐖', baby: 'le porcelet' },
  { parent: 'la cane', icon: '🦆', baby: 'le caneton' },
  { parent: 'la chèvre', icon: '🐐', baby: 'le chevreau' },
  { parent: 'l’ourse', icon: '🐻', baby: 'l’ourson' },
  { parent: 'la lionne', icon: '🦁', baby: 'le lionceau' },
  { parent: 'la grenouille', icon: '🐸', baby: 'le têtard' },
];

/** Les étapes de la vie de quelques animaux et d'une plante, dans l'ordre. */
export const LIFE_CYCLES: { title: string; icon: string; steps: string[] }[] = [
  {
    title: 'la poule',
    icon: '🐔',
    steps: ['🥚 l’œuf', '🐣 le poussin sort de l’œuf', '🐥 le poussin grandit', '🐔 la poule'],
  },
  {
    title: 'le papillon',
    icon: '🦋',
    steps: ['🥚 l’œuf', '🐛 la chenille', 'la chrysalide', '🦋 le papillon'],
  },
  {
    title: 'la grenouille',
    icon: '🐸',
    steps: ['🫧 les œufs dans l’eau', 'le têtard', 'le têtard a des pattes', '🐸 la grenouille'],
  },
  {
    title: 'le haricot',
    icon: '🫘',
    steps: [
      '🫘 la graine',
      '🌱 la graine germe',
      '🌿 la plante grandit',
      '🌼 la plante fleurit',
      '🫛 les fruits : les gousses',
    ],
  },
];
