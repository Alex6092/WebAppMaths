/**
 * Familles de mots pour le CE1 : un mot de base et des mots fabriqués à partir de lui, qui
 * gardent une partie commune bien visible. D'une famille à l'autre, les mots n'ont rien à voir :
 * un mot pris dans une autre famille n'est jamais, en réalité, de la même famille.
 *
 * Les pièges sont rangés à part, pour les niveaux qui en veulent (fiches « Les familles de
 * mots » de la classe) :
 * - `lookalikes` : des mots qui se ressemblent sans être de la famille (loin → loi) ;
 * - `theme` : des mots qui parlent de la même chose sans être de la famille (jardin → pelle).
 */
export interface WordFamily {
  base: string;
  words: readonly string[];
  /**
   * Le radical : la plus grande partie commune à tous les mots de la famille (mont → monter,
   * montagne). Absent quand cette partie est trop courte ou change (rire, sourire).
   */
  radical?: string;
  lookalikes?: readonly string[];
  theme?: readonly string[];
}

export const FAMILIES: readonly WordFamily[] = [
  {
    base: 'dent',
    words: ['dentiste', 'dentifrice', 'dentier'],
    radical: 'dent',
    lookalikes: ['dedans'],
    theme: ['bouche', 'brosse'],
  },
  {
    base: 'nage',
    words: ['nager', 'nageur', 'nageuse', 'nageoire'],
    radical: 'nage',
    lookalikes: ['nuage'],
    theme: ['piscine'],
  },
  {
    base: 'jour',
    words: ['journée', 'journal', 'bonjour'],
    radical: 'jour',
    lookalikes: ['jouer'],
    theme: ['semaine', 'mois', 'lundi'],
  },
  {
    base: 'terre',
    words: ['terrier', 'terrain', 'enterrer', 'atterrir'],
    radical: 'terr',
    lookalikes: ['terminer', 'terrible'],
  },
  { base: 'faire', words: ['défaire', 'refaire', 'refait'], radical: 'fai' },
  {
    base: 'fleur',
    words: ['fleuriste', 'fleurir', 'fleuri'],
    radical: 'fleur',
    theme: ['tulipe', 'rose', 'jardin'],
  },
  {
    base: 'jardin',
    words: ['jardinier', 'jardiner', 'jardinage'],
    radical: 'jardin',
    theme: ['pelle', 'râteau'],
  },
  {
    base: 'chant',
    words: ['chanter', 'chanteur', 'chanteuse'],
    radical: 'chant',
    lookalikes: ['champ'],
  },
  {
    base: 'dessin',
    words: ['dessiner', 'dessinateur'],
    radical: 'dessin',
    lookalikes: ['dessert'],
    theme: ['crayon'],
  },
  {
    base: 'dormir',
    words: ['dortoir', 'endormir', 'dormeur'],
    radical: 'dor',
    lookalikes: ['doré'],
    theme: ['lit'],
  },
  { base: 'glace', words: ['glacier', 'glaçon', 'glacé'], lookalikes: ['glisser'] },
  {
    base: 'poisson',
    words: ['poissonnier', 'poissonnerie'],
    radical: 'poisson',
    lookalikes: ['poison'],
  },
  {
    base: 'école',
    words: ['écolier', 'écolière'],
    radical: 'écol',
    theme: ['cartable', 'maîtresse'],
  },
  {
    base: 'froid',
    words: ['refroidir', 'froideur'],
    radical: 'froid',
    theme: ['hiver'],
  },
  {
    base: 'grand',
    words: ['grandir', 'agrandir', 'grandeur'],
    radical: 'grand',
    lookalikes: ['grain'],
  },
  { base: 'long', words: ['longueur', 'allonger', 'rallonger'], radical: 'long' },
  { base: 'rouge', words: ['rougir', 'rougeur'], radical: 'roug', lookalikes: ['roue'] },
  { base: 'blanc', words: ['blanchir', 'blancheur'], radical: 'blanc' },
  {
    base: 'mont',
    words: ['monter', 'montagne', 'montagnard', 'montagneux', 'monticule'],
    radical: 'mont',
    lookalikes: ['montre'],
  },
  { base: 'fruit', words: ['fruitier', 'fruité'], radical: 'fruit', theme: ['pomme'] },
  { base: 'peinture', words: ['peindre', 'peintre'], lookalikes: ['peigne'] },
  {
    base: 'boulanger',
    words: ['boulangère', 'boulangerie'],
    radical: 'boulang',
    lookalikes: ['boule'],
    theme: ['pain'],
  },
  {
    base: 'servir',
    words: ['servante', 'serviteur', 'service', 'serveur'],
    radical: 'serv',
    lookalikes: ['serpent'],
  },
  {
    base: 'sale',
    words: ['saleté', 'salir', 'salissure'],
    radical: 'sal',
    lookalikes: ['salé', 'salade'],
  },
  { base: 'rire', words: ['sourire', 'souriant', 'rieur'], lookalikes: ['source', 'souris'] },
  {
    base: 'sorcier',
    words: ['sorcière', 'sorcellerie', 'ensorceler'],
    radical: 'sorc',
    lookalikes: ['sortie'],
  },
  {
    base: 'classe',
    words: ['classer', 'classeur', 'classement'],
    radical: 'classe',
    lookalikes: ['claque'],
  },
  {
    base: 'neige',
    words: ['neiger', 'neigeux', 'enneigé'],
    radical: 'neig',
    theme: ['flocon', 'bonhomme'],
  },
  {
    base: 'feuille',
    words: ['feuillage', 'feuilleter', 'feuillu'],
    radical: 'feuill',
    lookalikes: ['feu'],
  },
  {
    base: 'bois',
    words: ['déboiser', 'boisé', 'reboiser'],
    radical: 'bois',
    lookalikes: ['boisson'],
    theme: ['forêt', 'arbre'],
  },
  { base: 'loin', words: ['lointain', 'éloigner'], lookalikes: ['loi'] },
  { base: 'joie', words: ['joyeux', 'joyeuse'], lookalikes: ['joli'] },
  {
    base: 'lait',
    words: ['laitage', 'laiterie', 'laitière', 'allaiter'],
    radical: 'lait',
    lookalikes: ['laisse'],
    theme: ['vache'],
  },
  {
    base: 'histoire',
    words: ['préhistoire', 'historien', 'historique'],
    radical: 'histo',
    theme: ['dinosaure', 'passé'],
  },
  {
    base: 'habiter',
    words: ['habitation', 'habitable', 'habitant'],
    radical: 'habit',
    lookalikes: ['habiller'],
    theme: ['maison'],
  },
  {
    base: 'savon',
    words: ['savonner', 'savonnette', 'savonneux'],
    radical: 'savon',
    lookalikes: ['savoir'],
  },
  {
    base: 'saut',
    words: ['sauter', 'sautoir', 'sauterelle', 'sautiller'],
    radical: 'saut',
    lookalikes: ['sauce'],
  },
  {
    base: 'plante',
    words: ['planter', 'plantation', 'plantoir'],
    radical: 'plant',
    lookalikes: ['planche', 'planète'],
  },
  {
    base: 'place',
    words: ['placer', 'déplacer', 'replacer'],
    radical: 'place',
    lookalikes: ['plage'],
  },
  { base: 'triangle', words: ['triangulaire'] },
  {
    base: 'danger',
    words: ['dangereux', 'dangereuse', 'dangereusement'],
    radical: 'danger',
    lookalikes: ['danse'],
  },
  { base: 'observer', words: ['observation', 'observateur'], radical: 'observ' },
  { base: 'calcul', words: ['calculer', 'calculatrice', 'calculette'], radical: 'calcul' },
  { base: 'table', words: ['tablier', 'tablette'], radical: 'tabl' },
  {
    base: 'courage',
    words: ['courageux', 'encourager', 'décourager'],
    radical: 'courage',
    lookalikes: ['course'],
  },
];

/** Tous les mots d'une famille, le mot de base compris. */
export const familyWords = (f: WordFamily): string[] => [f.base, ...f.words];

/** Un mot piège : il se ressemble, ou il parle de la même chose. */
export interface Trap {
  word: string;
  kind: 'lookalike' | 'theme';
}

/** Les pièges d'une famille, ceux qui se ressemblent d'abord. */
export const familyTraps = (f: WordFamily): Trap[] => [
  ...(f.lookalikes ?? []).map((word) => ({ word, kind: 'lookalike' as const })),
  ...(f.theme ?? []).map((word) => ({ word, kind: 'theme' as const })),
];

/** Pourquoi un piège n'est pas de la famille (pour l'explication après une erreur). */
export function trapReason(base: string, trap: Trap): string {
  return trap.kind === 'lookalike'
    ? `« ${trap.word} » ressemble à « ${base} », mais ce n’est pas la même idée.`
    : `« ${trap.word} » fait penser à « ${base} », mais n’a pas de partie commune avec lui.`;
}

/**
 * La plus grande partie commune à tous les mots (« monter, montagne » → « mont »). Quand deux
 * parties différentes ont la même longueur, il n'y a pas de réponse claire : undefined.
 */
export function commonPart(words: readonly string[]): string | undefined {
  const shortest = [...words].sort((a, b) => a.length - b.length)[0] ?? '';
  for (let size = shortest.length; size > 0; size--) {
    const found = new Set<string>();
    for (let start = 0; start + size <= shortest.length; start++) {
      const part = shortest.slice(start, start + size);
      if (words.every((w) => w.includes(part))) found.add(part);
    }
    if (found.size === 1) return [...found][0];
    if (found.size > 1) return undefined;
  }
  return undefined;
}
