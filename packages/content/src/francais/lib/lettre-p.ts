export const P_GROUPS = [
  {
    id: 'p',
    label: 'p fait [p]',
    words: ['poule', 'serpent', 'proie', 'groupe', 'espèce', 'piano'],
  },
  {
    id: 'pp',
    label: 'pp fait [p]',
    words: ['appelle', 'apporter', 'attraper', 'échapper', 'nappe', 'frapper'],
  },
  {
    id: 'ph',
    label: 'ph fait [f]',
    words: ['photo', 'téléphone', 'phare', 'pharmacie', 'trophée', 'hémisphère'],
  },
  { id: 'muet', label: 'p est muet', words: ['beaucoup', 'sept', 'loup', 'trop', 'coup', 'sirop'] },
];

/**
 * Les cinq cases de la fiche ORTHO 6 : p (au début, au milieu, et même à la fin : stop),
 * pp, ph, le p muet devant t (compter, sept) et le p muet à la fin du mot (loup, trop).
 * Les premiers mots de chaque case sont ceux de la fiche.
 */
export const P_LESSON_GROUPS = [
  {
    id: 'p',
    label: 'p [p]',
    color: '#e3f2fd',
    words: ['une poule', 'pouvoir', 'un serpent', 'simple', 'un slip', 'stop', 'un pirate'],
  },
  {
    id: 'pp',
    label: 'pp [p]',
    color: '#e8f5e9',
    words: ['s’appeler', 'une enveloppe', 'une nappe', 'apporter', 'frapper', 'un hippopotame'],
  },
  {
    id: 'ph',
    label: 'ph [f]',
    color: '#fff3e0',
    words: ['une photo', 'un phare', 'un téléphone', 'un dauphin', 'un éléphant', 'la pharmacie'],
  },
  {
    id: 'pt',
    label: 'p muet devant t',
    color: '#eeeeee',
    words: ['compter', 'sept', 'dompter', 'un compte', 'un dompteur', 'un baptême'],
  },
  {
    id: 'fin',
    label: 'p muet à la fin',
    color: '#eeeeee',
    words: ['un loup', 'beaucoup', 'trop', 'un coup', 'du sirop', 'le galop', 'un drap'],
  },
];

/** Le p s'entend-il ? Les mots en ph ([f]) n'y sont pas. */
export const P_HEARD = [
  'une poule',
  'pouvoir',
  'un serpent',
  'simple',
  'un slip',
  'stop',
  'un cap',
  'le ketchup',
  'une soupe',
  'une loupe',
  'une coupe',
  'une enveloppe',
  's’appeler',
  'une nappe',
  'un pirate',
];

export const P_SILENT = [
  'un loup',
  'beaucoup',
  'trop',
  'un coup',
  'du sirop',
  'le galop',
  'un drap',
  'un champ',
  'compter',
  'sept',
  'dompter',
  'un compte',
  'un baptême',
  'un dompteur',
];

export const P_NOTION = 'francais.orthographe.lettre-p';
export const DICTEE_6_NOTION = 'francais.orthographe.dictee-6';
