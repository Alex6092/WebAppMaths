/** Le vivant au CE1 : vivant ou non vivant, les besoins des plantes, les cinq sens. */

export interface Thing {
  name: string;
  icon: string;
  alive: boolean;
  /** Un piège : il bouge sans être vivant, ou il est vivant sans bouger. */
  tricky?: boolean;
}

export const THINGS: Thing[] = [
  { name: 'le chat', icon: '🐈', alive: true },
  { name: 'l’arbre', icon: '🌳', alive: true },
  { name: 'la fleur', icon: '🌷', alive: true },
  { name: 'l’enfant', icon: '🧒', alive: true },
  { name: 'le poisson', icon: '🐟', alive: true },
  { name: 'l’oiseau', icon: '🐦', alive: true },
  { name: 'la fourmi', icon: '🐜', alive: true },
  { name: 'le cactus', icon: '🌵', alive: true },
  { name: 'le champignon', icon: '🍄', alive: true, tricky: true },
  { name: 'la graine', icon: '🌰', alive: true, tricky: true },
  { name: 'l’herbe', icon: '🌿', alive: true, tricky: true },
  { name: 'le caillou', icon: '🪨', alive: false },
  { name: 'le ballon', icon: '⚽', alive: false },
  { name: 'la chaise', icon: '🪑', alive: false },
  { name: 'le livre', icon: '📖', alive: false },
  { name: 'la montre', icon: '⌚', alive: false },
  { name: 'la voiture', icon: '🚗', alive: false, tricky: true },
  { name: 'le robot', icon: '🤖', alive: false, tricky: true },
  { name: 'le nuage', icon: '☁️', alive: false, tricky: true },
  { name: 'le feu', icon: '🔥', alive: false, tricky: true },
  { name: 'la peluche', icon: '🧸', alive: false, tricky: true },
];

export type Need = 'eau' | 'lumiere' | 'chaleur';

export const NEED_LABEL: Record<Need, string> = {
  eau: 'de l’eau',
  lumiere: 'de la lumière',
  chaleur: 'de la chaleur',
};

export const NEED_ICON: Record<Need, string> = { eau: '💧', lumiere: '☀️', chaleur: '🌡️' };

/** Des expériences de la classe : la plante ou la graine à qui il manque quelque chose. */
export const EXPERIMENTS: { text: string; need: Need }[] = [
  { text: 'La plante est restée dans un placard tout noir. Elle jaunit.', need: 'lumiere' },
  {
    text: 'Un seau est resté posé sur l’herbe pendant une semaine. Dessous, l’herbe est devenue jaune.',
    need: 'lumiere',
  },
  { text: 'Personne n’a arrosé la plante pendant les vacances. Elle s’est fanée.', need: 'eau' },
  { text: 'Les graines sont posées sur du coton tout sec. Elles ne germent pas.', need: 'eau' },
  { text: 'Les graines sont dans le réfrigérateur. Elles ne germent pas.', need: 'chaleur' },
  {
    text: 'En hiver, les graines semées dans le jardin gelé ne germent pas.',
    need: 'chaleur',
  },
];

/** Des phrases à dire vraies ou fausses. */
export const PLANT_FACTS: { text: string; right: boolean }[] = [
  { text: 'Une plante est un être vivant.', right: true },
  { text: 'Une plante a besoin d’eau pour vivre.', right: true },
  { text: 'Une plante peut vivre dans le noir tout le temps.', right: false },
  { text: 'Une graine a besoin de chaleur pour germer.', right: true },
  { text: 'Une graine germe mieux au réfrigérateur.', right: false },
  { text: 'Les racines puisent l’eau dans la terre.', right: true },
  { text: 'Les feuilles poussent sous la terre.', right: false },
  { text: 'Une plante grandit.', right: true },
  { text: 'La fleur devient un fruit.', right: true },
  { text: 'Les graines sont dans le fruit.', right: true },
  { text: 'La tige porte les feuilles et les fleurs.', right: true },
  { text: 'Une plante ne meurt jamais.', right: false },
];

/** Les parties d'une plante et leur rôle. */
export const PLANT_PARTS: { part: string; icon: string; role: string }[] = [
  { part: 'les racines', icon: '🥕', role: 'puisent l’eau dans la terre' },
  { part: 'la tige', icon: '🌿', role: 'porte les feuilles et les fleurs' },
  { part: 'les feuilles', icon: '🍃', role: 'captent la lumière du soleil' },
  { part: 'la fleur', icon: '🌸', role: 'devient un fruit' },
  { part: 'le fruit', icon: '🍎', role: 'contient les graines' },
];

export type Sense = 'vue' | 'ouie' | 'odorat' | 'gout' | 'toucher';

export const SENSES: { id: Sense; sense: string; organ: string; icon: string }[] = [
  { id: 'vue', sense: 'la vue', organ: 'les yeux', icon: '👀' },
  { id: 'ouie', sense: 'l’ouïe', organ: 'les oreilles', icon: '👂' },
  { id: 'odorat', sense: 'l’odorat', organ: 'le nez', icon: '👃' },
  { id: 'gout', sense: 'le goût', organ: 'la langue', icon: '👅' },
  { id: 'toucher', sense: 'le toucher', organ: 'la peau', icon: '✋' },
];

/** Ce qu'on fait avec chaque sens. */
export const SENSE_ACTIONS: { text: string; icon: string; sense: Sense }[] = [
  { text: 'regarder un arc-en-ciel', icon: '🌈', sense: 'vue' },
  { text: 'lire un livre', icon: '📖', sense: 'vue' },
  { text: 'voir les étoiles', icon: '⭐', sense: 'vue' },
  { text: 'écouter de la musique', icon: '🎵', sense: 'ouie' },
  { text: 'entendre le téléphone sonner', icon: '📞', sense: 'ouie' },
  { text: 'entendre un oiseau chanter', icon: '🐦', sense: 'ouie' },
  { text: 'sentir le parfum d’une rose', icon: '🌹', sense: 'odorat' },
  { text: 'sentir l’odeur du pain chaud', icon: '🥖', sense: 'odorat' },
  { text: 'sentir la fumée', icon: '💨', sense: 'odorat' },
  { text: 'savoir que le citron est acide', icon: '🍋', sense: 'gout' },
  { text: 'savoir que le bonbon est sucré', icon: '🍬', sense: 'gout' },
  { text: 'savoir que la soupe est trop salée', icon: '🥣', sense: 'gout' },
  { text: 'caresser un chat tout doux', icon: '🐈', sense: 'toucher' },
  { text: 'sentir que l’eau du bain est chaude', icon: '🛁', sense: 'toucher' },
  { text: 'se piquer avec une épine', icon: '🌵', sense: 'toucher' },
];
