import type { PickColor, Rng, WordToken } from '@app/core';
import { PLURAL_NOUNS, type PluralNoun } from './pluriel';

/**
 * Leçons de grammaire « Le nom » (nom propre, nom commun) et « Le déterminant »
 * (le, la, les, l’, un, une, des : masculin ou féminin, singulier ou pluriel).
 */

export const NOM_NOTION = 'francais.grammaire.nom';
export const DETERMINANT_NOTION = 'francais.grammaire.determinant';

export type WordRole = 'det' | 'common' | 'proper' | 'other';

/**
 * Des phrases annotées : *déterminant, #nom commun, @nom propre. « *l’#école » s'écrit d'un seul
 * morceau. Seuls des articles servent de déterminants, et chaque nom commun en a un.
 */
const RAW_SENTENCES = [
  '*Le #chat de @Léa dort sur *le #canapé.',
  '@Jules lance *la #balle dans *le #jardin.',
  '*Les #enfants visitent @Paris avec *la #maîtresse.',
  '@Tom range *les #livres sur *l’#étagère.',
  '*Une #tortue mange *la #salade de @Zoé.',
  '*Le #train arrive à @Marseille.',
  '@Inès nage dans *la #piscine.',
  '*Le #cousin de @Hugo habite en @France.',
  '*Un #oiseau chante dans *l’#arbre.',
  '@Maya et @Paul préparent *un #gâteau.',
  '*Les #vaches broutent dans *le #pré.',
  '*La #famille @Dupont part en @Haute-Savoie.',
  '@Nina offre *une #fleur à *la #voisine.',
  '*Le #chien de @Salim aboie dans *la #cour.',
  '@Yanis prend *le #bus pour @Lyon.',
  '*Des #enfants jouent dans *le #parc de @Grenoble.',
  '*Une #girafe mange *les #feuilles de *l’#arbre.',
  '@Chloé écrit *une #lettre à @Hugo.',
  '*L’#ours dort dans *une #grotte.',
  '@Léo regarde *les #étoiles avec *un #ami.',
  '*La #maman de @Mia prépare *un #pique-nique.',
  '*Les #élèves chantent avec @Lucas.',
  '*Le #bateau traverse *la #mer jusqu’en @Corse.',
  '@Sam donne *des #carottes à *un #lapin.',
  '*Le #boulanger de @Lille vend *des #croissants.',
  '@Jules @Dupont habite à @Annecy.',
] as const;

export interface AnnotatedWord {
  text: string;
  role: WordRole;
  /** Collé au mot d'avant (après « l’ »). */
  glue?: boolean;
}

export interface AnnotatedSentence {
  /** La phrase écrite normalement. */
  text: string;
  words: AnnotatedWord[];
}

const ROLE_OF: Record<string, WordRole> = { '*': 'det', '#': 'common', '@': 'proper' };

function annotate(raw: string): AnnotatedSentence {
  const words: AnnotatedWord[] = [];
  for (const part of raw.slice(0, -1).split(' ')) {
    // « *l’#école » : le déterminant élidé, puis le nom collé.
    const elided = /^\*([Ll]’)([#@])(.+)$/.exec(part);
    if (elided) {
      words.push({ text: elided[1]!, role: 'det' });
      words.push({ text: elided[3]!, role: ROLE_OF[elided[2]!]!, glue: true });
      continue;
    }
    const role = ROLE_OF[part[0]!];
    words.push(role ? { text: part.slice(1), role } : { text: part, role: 'other' });
  }
  const text = words.map((w, i) => (i > 0 && !w.glue ? ' ' : '') + w.text).join('') + '.';
  return { text, words };
}

export const NOUN_SENTENCES: readonly AnnotatedSentence[] = RAW_SENTENCES.map(annotate);

/** Les mots de la phrase à toucher, avec le point final collé et non sélectionnable. */
export function sentenceTokens(s: AnnotatedSentence, lowerProper = false): WordToken[] {
  return [
    ...s.words.map((w): WordToken => {
      const text = lowerProper && w.role === 'proper' ? w.text.toLowerCase() : w.text;
      return w.glue ? { text, glue: true } : { text };
    }),
    { text: '.', selectable: false, glue: true },
  ];
}

export const PROPER_PICK: PickColor = {
  id: 'proper',
  label: 'nom propre en bleu',
  color: '#bbdefb',
};
export const COMMON_PICK: PickColor = {
  id: 'common',
  label: 'nom commun en vert',
  color: '#c5e1a5',
};

/** Ce que désigne un nom : la bulle de la leçon. */
export type NounKind = 'personne' | 'animal' | 'chose' | 'lieu';

export const KIND_ICON: Record<NounKind, string> = {
  personne: '🧑',
  animal: '🐾',
  chose: '🧸',
  lieu: '📍',
};

export const COMMON_NOUNS: Record<NounKind, readonly string[]> = {
  personne: [
    'la maîtresse',
    'le boulanger',
    'un pompier',
    'le bébé',
    'un garçon',
    'une fille',
    'la voisine',
    'le docteur',
    'le facteur',
    'la grand-mère',
  ],
  animal: [
    'une tortue',
    'la girafe',
    'un lapin',
    'le chat',
    'un oiseau',
    'la vache',
    'le cheval',
    'un poisson',
    'l’ours',
    'un éléphant',
  ],
  chose: [
    'un train',
    'le ballon',
    'un crayon',
    'le livre',
    'un vélo',
    'la table',
    'un gâteau',
    'la lampe',
    'le cartable',
    'une chaussure',
  ],
  lieu: [
    'la piscine',
    'l’école',
    'la forêt',
    'la plage',
    'une ville',
    'le jardin',
    'la boulangerie',
    'la montagne',
    'le parc',
    'la gare',
  ],
};

export const PROPER_NOUNS: Record<'personne' | 'lieu', readonly string[]> = {
  personne: ['Léa', 'Jules Dupont', 'Tom', 'Inès', 'Hugo', 'Zoé', 'Salim', 'Chloé'],
  lieu: ['Paris', 'France', 'Haute-Savoie', 'Lyon', 'Marseille', 'Annecy', 'Espagne', 'Corse'],
};

/** Les déterminants de la leçon (les articles). */
export const ARTICLES = ['le', 'la', 'les', 'l’', 'un', 'une', 'des'] as const;
export type Article = (typeof ARTICLES)[number];

/** h muet ou voyelle : « le » et « la » deviennent « l’ ». */
export const startsWithVowel = (w: string) => /^[aeiouyàâéèêîôûh]/i.test(w);

/** Les noms de la banque du pluriel, qui ont leur genre (sans les mots qui ne changent pas). */
export const GENDER_NOUNS = PLURAL_NOUNS.filter((n) => n.rule !== 'same' && n.sing !== 'joujou');

/** Le bon article défini : le, la, l’ ou les. */
export function definite(noun: PluralNoun, plural: boolean): Article {
  if (plural) return 'les';
  if (startsWithVowel(noun.sing)) return 'l’';
  return noun.f ? 'la' : 'le';
}

export function indefinite(noun: PluralNoun, plural: boolean): Article {
  if (plural) return 'des';
  return noun.f ? 'une' : 'un';
}

export const joinDet = (det: string, word: string) =>
  det.endsWith('’') ? `${det}${word}` : `${det} ${word}`;

export function pickNoun(rng: Rng, filter: (n: PluralNoun) => boolean = () => true): PluralNoun {
  return rng.pick(GENDER_NOUNS.filter(filter));
}
