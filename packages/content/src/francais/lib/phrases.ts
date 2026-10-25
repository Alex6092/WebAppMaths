import type { Rng, WordToken } from '@app/core';
import {
  conjugate,
  MOMENT_TENSE,
  PRONOUNS,
  startsWithVowel,
  withSubject,
  type Moment,
  type Person,
  type Tense,
} from './conjugaison';
import { capitalize, indicatorsOf, type Indicator } from './indicateurs';
import { FIRST_NAMES, SUBJECTS, type SubjectEntry } from './sujets';
import type { VerbEntry } from './verbes';

/**
 * Fabrique de phrases simples : [indicateur,] sujet + verbe + complément [indicateur].
 * « Hier, Léa jouait dans le jardin. » / « Nous lisons un livre en ce moment. »
 */

export type Role = 'indicator' | 'subject' | 'verb' | 'compl' | 'punct';

export interface Pieces {
  indicator: string | null;
  indicatorAt: 'start' | 'end';
  subject: string;
  /** Forme conjuguée (ou un trou « {1} »). */
  form: string;
  compl: string;
}

export interface Sentence {
  pieces: Pieces;
  tokens: WordToken[];
  roles: Role[];
  text: string;
  verb: VerbEntry;
  subject: SubjectEntry;
  person: Person;
  moment: Moment;
  tense: Tense;
  indicator: Indicator | null;
}

export interface SentenceOptions {
  verbs: readonly VerbEntry[];
  moment: Moment;
  /** Place de l'indicateur de temps (aucun par défaut). */
  indicator?: 'start' | 'end' | 'any' | 'none';
  /** Indicateurs du tableau de la leçon seulement. */
  lessonIndicators?: boolean;
  subjects?: readonly SubjectEntry['kind'][];
  /** Personnes interdites (par exemple « je » devant un trou à remplir). */
  excludePersons?: readonly Person[];
}

/** Assemble les morceaux : majuscule au début, élision de « je », virgule après l'indicateur. */
export function assemble(pieces: Pieces): { tokens: WordToken[]; roles: Role[]; text: string } {
  const segments: [string, Role][] = [];
  const atStart = pieces.indicator !== null && pieces.indicatorAt === 'start';
  if (atStart) segments.push([pieces.indicator!, 'indicator'], [',', 'punct']);
  segments.push([pieces.subject, 'subject'], [pieces.form, 'verb'], [pieces.compl, 'compl']);
  if (pieces.indicator !== null && !atStart) segments.push([pieces.indicator, 'indicator']);
  segments.push(['.', 'punct']);

  const tokens: WordToken[] = [];
  const roles: Role[] = [];
  let elide = false;
  for (const [text, role] of segments) {
    if (role === 'punct') {
      tokens.push({ text, glue: true, selectable: false });
      roles.push(role);
      continue;
    }
    const words = text.split(' ').filter(Boolean);
    if (role === 'subject' && text.toLowerCase() === 'je' && startsWithVowel(pieces.form)) {
      tokens.push({ text: "j'" });
      roles.push(role);
      elide = true;
      continue;
    }
    words.forEach((word, k) => {
      tokens.push(k === 0 && elide ? { text: word, glue: true } : { text: word });
      roles.push(role);
      elide = false;
    });
  }
  tokens[0] = { ...tokens[0]!, text: capitalize(tokens[0]!.text) };
  const text = tokens.map((t, i) => (i > 0 && !t.glue ? ' ' : '') + t.text).join('');
  return { tokens, roles, text };
}

function pickSubject(rng: Rng, verb: VerbEntry, options: SentenceOptions): SubjectEntry {
  const kinds = options.subjects ?? ['pronoun', 'name', 'group'];
  const excluded = new Set(options.excludePersons ?? []);
  const human = verb.compl.length > 0;
  // Deux prénoms (« Lou et Zoé ») : un sujet pluriel de plus.
  if (human && kinds.includes('name') && !excluded.has(5) && rng.chance(0.12)) {
    const [a, b] = rng.sample(FIRST_NAMES, 2);
    return { text: `${a} et ${b}`, person: 5, kind: 'name' };
  }
  // Un chat ne fait que ce qui a des compléments « animal » ; ronronner n'est que pour lui.
  const candidates = SUBJECTS.filter(
    (s) => !excluded.has(s.person) && (s.animal ? !!verb.animal : human && kinds.includes(s.kind)),
  );
  return rng.pick(candidates);
}

export function buildSentence(rng: Rng, options: SentenceOptions): Sentence {
  const verb = rng.pick(options.verbs);
  const subject = pickSubject(rng, verb, options);
  const tense = MOMENT_TENSE[options.moment];
  const form = conjugate(verb.inf, tense, subject.person);
  const compl = rng.pick(subject.animal ? verb.animal! : verb.compl);

  let place = options.indicator ?? 'none';
  let indicator: Indicator | null = null;
  if (place !== 'none') {
    const pool = indicatorsOf(options.moment, options.lessonIndicators).filter(
      (i) => place !== 'end' || i.endOk,
    );
    indicator = rng.pick(pool);
    if (place === 'any') place = indicator.endOk && rng.chance(0.35) ? 'end' : 'start';
  }
  const pieces: Pieces = {
    indicator: indicator?.text ?? null,
    indicatorAt: place === 'end' ? 'end' : 'start',
    subject: subject.text,
    form,
    compl,
  };
  return {
    pieces,
    ...assemble(pieces),
    verb,
    subject,
    person: subject.person,
    moment: options.moment,
    tense,
    indicator,
  };
}

/** « nous plongeons », « j'aime », « elles finissaient » : pronom + verbe conjugué. */
export function withPronoun(rng: Rng, infinitive: string, tense: Tense, person: Person): string {
  const pronoun = rng.pick(PRONOUNS[person].filter((p) => p !== 'on'));
  return withSubject(pronoun, conjugate(infinitive, tense, person));
}

/** Phrase où l'indicateur (en tête) est remplacé par un trou : « {0}, nous mangerons des crêpes. » */
export function promptWithBlanks(
  pieces: Pieces,
  blanks: Partial<Record<'indicator' | 'form', string>>,
): string {
  const filled: Pieces = {
    ...pieces,
    indicator: blanks.indicator ?? pieces.indicator,
    form: blanks.form ?? pieces.form,
  };
  const { text } = assemble(filled);
  // La majuscule ne doit pas toucher un trou (« {0} »).
  return text.replace(/^\{(\d+)\}/, '{$1}');
}
