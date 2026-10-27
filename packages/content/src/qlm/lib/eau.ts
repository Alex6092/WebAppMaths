/** Les états de l'eau : solide, liquide, gazeux, et ce qui la fait changer d'état. */

export type State = 'solide' | 'liquide' | 'gaz';

export const STATE_LABEL: Record<State, string> = {
  solide: 'solide',
  liquide: 'liquide',
  gaz: 'gazeuse',
};

export const STATE_ICON: Record<State, string> = { solide: '🧊', liquide: '💧', gaz: '♨️' };

/** De l'eau solide ou liquide, de tous les jours (la vapeur d'eau ne se voit pas). */
export const WATERS: { name: string; icon: string; state: 'solide' | 'liquide' }[] = [
  { name: 'le glaçon', icon: '🧊', state: 'solide' },
  { name: 'la neige', icon: '❄️', state: 'solide' },
  { name: 'la glace de la patinoire', icon: '⛸️', state: 'solide' },
  { name: 'le bonhomme de neige', icon: '⛄', state: 'solide' },
  { name: 'la pluie', icon: '🌧️', state: 'liquide' },
  { name: 'l’eau du robinet', icon: '🚰', state: 'liquide' },
  { name: 'la mer', icon: '🌊', state: 'liquide' },
  { name: 'l’eau du bain', icon: '🛁', state: 'liquide' },
  { name: 'la flaque', icon: '💧', state: 'liquide' },
];

export type Change = 'fond' | 'gele' | 'evapore';

export const CHANGE_LABEL: Record<Change, string> = {
  fond: 'fond',
  gele: 'gèle',
  evapore: 's’évapore',
};

/** L'état de l'eau après le changement. */
export const CHANGE_RESULT: Record<Change, State> = {
  fond: 'liquide',
  gele: 'solide',
  evapore: 'gaz',
};

export const CHANGE_RULE: Record<Change, string> = {
  fond: 'Quand il fait chaud, la glace fond : elle devient de l’eau liquide.',
  gele: 'Quand il fait très froid (0 °C), l’eau gèle : elle devient de la glace, solide.',
  evapore:
    'Avec la chaleur, l’eau s’évapore : elle devient de la vapeur d’eau, un gaz qu’on ne voit pas.',
};

/** Des situations : ce qui se passe, puis le sujet du verbe à trouver. */
export const SITUATIONS: { text: string; subject: string; change: Change }[] = [
  {
    text: 'Le glaçon est sorti du congélateur depuis une heure.',
    subject: 'Le glaçon',
    change: 'fond',
  },
  { text: 'Le soleil brille fort sur le bonhomme de neige.', subject: 'La neige', change: 'fond' },
  {
    text: 'Au printemps, il fait plus chaud dans la montagne.',
    subject: 'La neige',
    change: 'fond',
  },
  {
    text: 'Cette nuit d’hiver, il a fait très froid.',
    subject: 'L’eau de la mare',
    change: 'gele',
  },
  {
    text: 'Papa met le bac à glaçons rempli d’eau dans le congélateur.',
    subject: 'L’eau',
    change: 'gele',
  },
  {
    text: 'Après la pluie, le soleil revient et chauffe la cour.',
    subject: 'La flaque',
    change: 'evapore',
  },
  {
    text: 'Le linge mouillé sèche au soleil.',
    subject: 'L’eau du linge',
    change: 'evapore',
  },
  {
    text: 'L’eau de la casserole bout longtemps sur le feu : il en reste de moins en moins.',
    subject: 'L’eau',
    change: 'evapore',
  },
];
