import type { Rng } from '@app/core';
import { startsWithVowel } from './conjugaison';
import { buildSentence } from './phrases';
import { VERBS } from './verbes';

/**
 * Phrases qui demandent un point d'exclamation ou un point d'interrogation, sans hésitation
 * possible avec le point (pas de simple ordre comme « Range ta chambre », qui peut finir par
 * un point). Sans la ponctuation finale.
 */
export const EXCLAMATIONS: readonly string[] = [
  'Waouh, comme ce gâteau est beau',
  'Quelle belle journée',
  'Bravo, tu as gagné la course',
  'Comme tu cours vite',
  'Oh, il neige',
  'Vite, le bus arrive',
  'Quel joli dessin',
  'Au secours',
  'Hourra, c’est les vacances',
  'Aïe, je me suis cogné',
  'File vite acheter du pain',
  'Attention, le vase va tomber',
  'Quelle bonne surprise',
  'Comme ce chaton est mignon',
  'Oh là là, quelle tempête',
  'Viens vite voir l’arc-en-ciel',
];

export const QUESTIONS: readonly string[] = [
  'Où est mon cartable',
  'Quand partons-nous à la plage',
  'Pourquoi le ciel est-il bleu',
  'Comment s’appelle ton chien',
  'Qui a mangé la dernière part',
  'As-tu fini tes devoirs',
  'Veux-tu jouer avec moi',
  'Quelle heure est-il',
  'Combien de billes as-tu',
  'Aimes-tu les fraises',
  'Où habite ta grand-mère',
  'Pourquoi pleures-tu',
];

export type SentenceKind = 'info' | 'question' | 'exclamation';
export const END_MARK: Record<SentenceKind, string> = {
  info: '.',
  question: '?',
  exclamation: '!',
};

/** Une phrase qui donne une information (sans le point final). */
export function infoSentence(rng: Rng): string {
  const moment = rng.pick(['passe', 'present', 'futur'] as const);
  return buildSentence(rng, { verbs: VERBS, moment, indicator: 'any' }).text.replace(/\.$/, '');
}

/** « Est-ce que Léa joue au ballon », « Est-ce qu’il dessine un bateau ». */
function askedSentence(rng: Rng): string {
  const s = buildSentence(rng, { verbs: VERBS, moment: 'present', subjects: ['name', 'pronoun'] });
  const body = s.text.replace(/\.$/, '');
  const first = s.tokens[0]!.text;
  // Le sujet garde sa majuscule s'il s'agit d'un prénom, la perd s'il s'agit d'un pronom.
  const rest = s.subject.kind === 'name' ? body : body[0]!.toLowerCase() + body.slice(1);
  return startsWithVowel(first) ? `Est-ce qu’${rest}` : `Est-ce que ${rest}`;
}

/** Une phrase du type demandé, sans sa ponctuation finale. */
export function sentenceOfKind(rng: Rng, kind: SentenceKind): string {
  if (kind === 'info') return infoSentence(rng);
  if (kind === 'exclamation') return rng.pick(EXCLAMATIONS);
  return rng.chance(0.4) ? askedSentence(rng) : rng.pick(QUESTIONS);
}
