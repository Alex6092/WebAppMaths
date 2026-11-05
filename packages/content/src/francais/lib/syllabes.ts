/**
 * Lire des syllabes et des mots : les tableaux d'entraînement à la lecture des fiches de dictée
 * de la classe. Une lettre travaillée par fiche (d pour la dictée 5) ; les pièges des syllabes
 * changent cette lettre pour une lettre qui lui ressemble (b, t, p) ou inversent la syllabe
 * (dob, bod). Les mots ont pour pièges d'autres mots de la liste, jamais des mots mal écrits.
 */

export interface Syllable {
  text: string;
  /** Ce que dit la voix, si elle lit mal la syllabe seule (id → « ide »). */
  say?: string;
}

export interface LetterReading {
  letter: string;
  /** Les lettres qui lui ressemblent, à l'œil ou à l'oreille. */
  lookalikes: string[];
  /** Consonne + voyelle : da, dou, doi. */
  simple: Syllable[];
  /** Deux consonnes, ou une consonne à la fin : dron, dreu, dob, id. */
  complex: Syllable[];
  words: string[];
}

const syl = (text: string, say?: string): Syllable => (say ? { text, say } : { text });

// Les tableaux 1 et 2 de la fiche « Dictée 5 : la lettre D ». Pas de « dy » (il se dit comme
// « di ») ni de « dé » (trop près de « dè », « dai ») : deux syllabes dites pareil n'iraient
// pas ensemble.
export const LETTER_D: LetterReading = {
  letter: 'd',
  lookalikes: ['b', 't', 'p'],
  simple: [
    syl('da'),
    syl('du'),
    syl('de'),
    syl('do'),
    syl('di'),
    syl('dou'),
    syl('dè'),
    syl('doi'),
    syl('dai'),
    syl('don'),
    syl('dan'),
  ],
  complex: [
    syl('dur'),
    syl('dul', 'dule'),
    syl('dron'),
    syl('id', 'ide'),
    syl('dar'),
    syl('dreu'),
    syl('dob', 'dobe'),
    syl('dra'),
    syl('dro'),
    syl('dri'),
    syl('dru'),
    syl('dor'),
    syl('dir'),
    syl('dal', 'dale'),
  ],
  words: [
    'donner',
    'grande',
    'au fond',
    'une addition',
    'profond',
    'le danseur',
    'regarder',
    'un doigt',
    'drôle',
    'demain',
    'doucement',
    'soudain',
    'une dictée',
    'difficile',
    'grandir',
    'douter',
    'la directrice',
    'un débutant',
    'demander',
    'droitier',
    'déjà',
    'madame',
    'un dauphin',
    'déjeuner',
    'ta médaille',
    'un dinosaure',
    'répondre',
    'un renard',
    'mon docteur',
    'bavard',
    'dedans',
    'un cadeau',
  ],
};

/** Les pièges d'une syllabe : la lettre changée pour une autre qui lui ressemble, ou à l'envers. */
export function syllableTraps(reading: LetterReading, text: string): string[] {
  const traps = new Set<string>();
  for (const other of reading.lookalikes) traps.add(text.split(reading.letter).join(other));
  // dob → bod, dar → rad : seulement les syllabes de trois lettres, voyelle au milieu.
  if (/^[^aeiouyéèê][aeiouyéèê][^aeiouyéèê]$/.test(text)) {
    traps.add([...text].reverse().join(''));
  }
  traps.delete(text);
  return [...traps];
}

/** Le mot sans son petit mot devant : « un doigt » → « doigt ». */
export const bareWord = (w: string) => w.replace(/^(un|une|le|la|les|ta|mon|au) /, '');
