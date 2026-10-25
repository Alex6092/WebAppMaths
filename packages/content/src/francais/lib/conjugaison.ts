/**
 * Moteur de conjugaison du CE1 : présent, imparfait et futur de l'indicatif.
 * 1er groupe (avec ses variantes d'orthographe), 2e groupe, et une table des verbes
 * irréguliers courants. Testé contre des tables de référence (conjugaison.test.ts).
 */

export type Tense = 'present' | 'imparfait' | 'futur';
/** 0 je, 1 tu, 2 il/elle/on, 3 nous, 4 vous, 5 ils/elles. */
export type Person = 0 | 1 | 2 | 3 | 4 | 5;

export const PERSONS: readonly Person[] = [0, 1, 2, 3, 4, 5];
export const TENSES: readonly Tense[] = ['present', 'imparfait', 'futur'];

/** Le moment de l'action, tel qu'on le nomme au CE1 (le passé est travaillé avec l'imparfait). */
export type Moment = 'passe' | 'present' | 'futur';
export const MOMENT_TENSE: Record<Moment, Tense> = {
  passe: 'imparfait',
  present: 'present',
  futur: 'futur',
};
export const MOMENT_LABEL: Record<Moment, string> = {
  passe: 'passé',
  present: 'présent',
  futur: 'futur',
};
export const MOMENTS: readonly Moment[] = ['passe', 'present', 'futur'];

/** Façon de conjuguer : sert à doser la difficulté. */
export type VerbKind = 'regular' | 'spelling' | 'group2' | 'irregular';

interface IrregularVerb {
  present: readonly [string, string, string, string, string, string];
  /** Radical de l'imparfait (par défaut : celui de « nous » au présent). */
  imparfait?: string;
  /** Radical du futur. */
  futur: string;
}

const IRREGULAR: Record<string, IrregularVerb> = {
  être: { present: ['suis', 'es', 'est', 'sommes', 'êtes', 'sont'], imparfait: 'ét', futur: 'ser' },
  avoir: { present: ['ai', 'as', 'a', 'avons', 'avez', 'ont'], futur: 'aur' },
  aller: { present: ['vais', 'vas', 'va', 'allons', 'allez', 'vont'], futur: 'ir' },
  faire: { present: ['fais', 'fais', 'fait', 'faisons', 'faites', 'font'], futur: 'fer' },
  dire: { present: ['dis', 'dis', 'dit', 'disons', 'dites', 'disent'], futur: 'dir' },
  venir: { present: ['viens', 'viens', 'vient', 'venons', 'venez', 'viennent'], futur: 'viendr' },
  tenir: { present: ['tiens', 'tiens', 'tient', 'tenons', 'tenez', 'tiennent'], futur: 'tiendr' },
  prendre: {
    present: ['prends', 'prends', 'prend', 'prenons', 'prenez', 'prennent'],
    futur: 'prendr',
  },
  pouvoir: { present: ['peux', 'peux', 'peut', 'pouvons', 'pouvez', 'peuvent'], futur: 'pourr' },
  vouloir: {
    present: ['veux', 'veux', 'veut', 'voulons', 'voulez', 'veulent'],
    futur: 'voudr',
  },
  voir: { present: ['vois', 'vois', 'voit', 'voyons', 'voyez', 'voient'], futur: 'verr' },
  savoir: { present: ['sais', 'sais', 'sait', 'savons', 'savez', 'savent'], futur: 'saur' },
  devoir: { present: ['dois', 'dois', 'doit', 'devons', 'devez', 'doivent'], futur: 'devr' },
  partir: { present: ['pars', 'pars', 'part', 'partons', 'partez', 'partent'], futur: 'partir' },
  sortir: { present: ['sors', 'sors', 'sort', 'sortons', 'sortez', 'sortent'], futur: 'sortir' },
  dormir: { present: ['dors', 'dors', 'dort', 'dormons', 'dormez', 'dorment'], futur: 'dormir' },
  courir: { present: ['cours', 'cours', 'court', 'courons', 'courez', 'courent'], futur: 'courr' },
  lire: { present: ['lis', 'lis', 'lit', 'lisons', 'lisez', 'lisent'], futur: 'lir' },
  écrire: {
    present: ['écris', 'écris', 'écrit', 'écrivons', 'écrivez', 'écrivent'],
    futur: 'écrir',
  },
  rire: { present: ['ris', 'ris', 'rit', 'rions', 'riez', 'rient'], futur: 'rir' },
  mettre: { present: ['mets', 'mets', 'met', 'mettons', 'mettez', 'mettent'], futur: 'mettr' },
  boire: { present: ['bois', 'bois', 'boit', 'buvons', 'buvez', 'boivent'], futur: 'boir' },
  ouvrir: {
    present: ['ouvre', 'ouvres', 'ouvre', 'ouvrons', 'ouvrez', 'ouvrent'],
    futur: 'ouvrir',
  },
  construire: {
    present: ['construis', 'construis', 'construit', 'construisons', 'construisez', 'construisent'],
    futur: 'construir',
  },
  attendre: {
    present: ['attends', 'attends', 'attend', 'attendons', 'attendez', 'attendent'],
    futur: 'attendr',
  },
  répondre: {
    present: ['réponds', 'réponds', 'répond', 'répondons', 'répondez', 'répondent'],
    futur: 'répondr',
  },
  descendre: {
    present: ['descends', 'descends', 'descend', 'descendons', 'descendez', 'descendent'],
    futur: 'descendr',
  },
};

/** Verbes composés : apprendre se conjugue comme prendre, revenir comme venir… */
const PREFIXED: Record<string, [prefix: string, base: string]> = {
  apprendre: ['ap', 'prendre'],
  comprendre: ['com', 'prendre'],
  revenir: ['re', 'venir'],
  devenir: ['de', 'venir'],
  revoir: ['re', 'voir'],
};

/** Verbes en -ir du 2e groupe (participe présent en -issant). */
const GROUP2 = new Set([
  'finir',
  'choisir',
  'grandir',
  'remplir',
  'rougir',
  'réussir',
  'applaudir',
  'salir',
  'nourrir',
  'obéir',
  'guérir',
  'ralentir',
]);

/** -eler / -eter qui doublent la consonne (les autres prennent un accent grave). */
const DOUBLE_CONSONANT = new Set([
  'appeler',
  'rappeler',
  'jeter',
  'rejeter',
  'épeler',
  'renouveler',
]);

const ENDINGS: Record<Tense, readonly string[]> = {
  present: ['e', 'es', 'e', 'ons', 'ez', 'ent'],
  imparfait: ['ais', 'ais', 'ait', 'ions', 'iez', 'aient'],
  futur: ['ai', 'as', 'a', 'ons', 'ez', 'ont'],
};
const GROUP2_PRESENT = ['is', 'is', 'it', 'issons', 'issez', 'issent'];

export function isIrregular(infinitive: string): boolean {
  return infinitive in IRREGULAR || infinitive in PREFIXED;
}

export function isGroup2(infinitive: string): boolean {
  return GROUP2.has(infinitive);
}

export function verbGroup(infinitive: string): 1 | 2 | 3 {
  if (isGroup2(infinitive)) return 2;
  if (infinitive.endsWith('er') && !isIrregular(infinitive)) return 1;
  return 3;
}

/** Variante d'orthographe d'un verbe du 1er groupe, ou null s'il est tout à fait régulier. */
function spellingVariant(infinitive: string): string | null {
  const stem = infinitive.slice(0, -2);
  if (stem.endsWith('c')) return 'cer';
  if (stem.endsWith('g')) return 'ger';
  if (/[ou]y$/.test(stem)) return 'yer';
  if (DOUBLE_CONSONANT.has(infinitive)) return 'double';
  // e entre deux consonnes en fin de radical : lever → lève, acheter → achète (pas chercher).
  if (/[^aeiouyéèê]e[^aeiouyéèê]$/.test(stem)) return 'e-grave';
  // é devant une consonne (ou ch, tr…) : répéter → répète, sécher → sèche.
  if (/é(?:[^aeiouyéèê]|ch|gn|tr|br|gl|vr)$/.test(stem)) return 'é-grave';
  return null;
}

export function verbKind(infinitive: string): VerbKind {
  if (isIrregular(infinitive)) return 'irregular';
  if (isGroup2(infinitive)) return 'group2';
  return spellingVariant(infinitive) ? 'spelling' : 'regular';
}

/** Personnes où la terminaison est muette (je, tu, il, ils au présent). */
const MUTE_PRESENT = new Set([0, 1, 2, 5]);

/** Radical modifié d'un verbe du 1er groupe devant une terminaison muette (e, es, ent, futur). */
function muteStem(infinitive: string, variant: string | null): string {
  const stem = infinitive.slice(0, -2);
  switch (variant) {
    case 'yer':
      return stem.slice(0, -1) + 'i';
    case 'double':
      return stem + stem.at(-1)!;
    case 'e-grave':
      return stem.replace(/e([^aeiouyéèê]+)$/, 'è$1');
    case 'é-grave':
      return stem.replace(/é([^aeiouyéèê]+)$/, 'è$1');
    default:
      return stem;
  }
}

/** c → ç et g → ge devant a et o (nous commençons, nous mangeons, je mangeais). */
function softStem(stem: string, ending: string, variant: string | null): string {
  if (!/^[ao]/.test(ending)) return stem;
  if (variant === 'cer') return stem.slice(0, -1) + 'ç';
  if (variant === 'ger') return stem + 'e';
  return stem;
}

function conjugateGroup1(infinitive: string, tense: Tense, person: Person): string {
  const variant = spellingVariant(infinitive);
  const stem = infinitive.slice(0, -2);
  const ending = ENDINGS[tense][person]!;
  if (tense === 'futur') {
    // Le futur garde l'infinitif ; les variantes muettes s'y appliquent (lèvera, appellera, nettoiera).
    // é-grave : on garde l'orthographe traditionnelle (répétera) ; « répètera » est accepté à part.
    const base = variant === 'é-grave' ? stem : muteStem(infinitive, variant);
    return base + 'er' + ending;
  }
  if (tense === 'present' && MUTE_PRESENT.has(person))
    return muteStem(infinitive, variant) + ending;
  return softStem(stem, ending, variant) + ending;
}

function conjugateGroup2(infinitive: string, tense: Tense, person: Person): string {
  const stem = infinitive.slice(0, -2);
  if (tense === 'present') return stem + GROUP2_PRESENT[person]!;
  if (tense === 'imparfait') return stem + 'iss' + ENDINGS.imparfait[person]!;
  return infinitive + ENDINGS.futur[person]!;
}

function conjugateIrregular(verb: IrregularVerb, tense: Tense, person: Person): string {
  if (tense === 'present') return verb.present[person];
  if (tense === 'futur') return verb.futur + ENDINGS.futur[person]!;
  const stem = verb.imparfait ?? verb.present[3].replace(/ons$/, '');
  return stem + ENDINGS.imparfait[person]!;
}

/** Forme conjuguée seule : conjugate('manger', 'present', 3) → « mangeons ». */
export function conjugate(infinitive: string, tense: Tense, person: Person): string {
  const prefixed = PREFIXED[infinitive];
  if (prefixed) return prefixed[0] + conjugate(prefixed[1], tense, person);
  const irregular = IRREGULAR[infinitive];
  if (irregular) return conjugateIrregular(irregular, tense, person);
  if (isGroup2(infinitive)) return conjugateGroup2(infinitive, tense, person);
  if (!infinitive.endsWith('er')) throw new Error(`Verbe inconnu du moteur : ${infinitive}`);
  return conjugateGroup1(infinitive, tense, person);
}

/** Toutes les orthographes admises (répétera / répètera depuis les rectifications de 1990). */
export function acceptedForms(infinitive: string, tense: Tense, person: Person): string[] {
  const form = conjugate(infinitive, tense, person);
  if (
    tense === 'futur' &&
    verbGroup(infinitive) === 1 &&
    spellingVariant(infinitive) === 'é-grave'
  ) {
    return [form, muteStem(infinitive, 'é-grave') + 'er' + ENDINGS.futur[person]!];
  }
  return [form];
}

export const PRONOUNS: Record<Person, readonly string[]> = {
  0: ['je'],
  1: ['tu'],
  2: ['il', 'elle', 'on'],
  3: ['nous'],
  4: ['vous'],
  5: ['ils', 'elles'],
};

/** Le mot commence par une voyelle ou un h muet : « je » s'élide (j'aime, j'habite). */
export function startsWithVowel(word: string): boolean {
  return /^[aeiouyéèêàâîôûh]/i.test(word);
}

/** « je » + « aime » → « j'aime » ; « tu » + « ranges » → « tu ranges ». */
export function withSubject(subject: string, form: string): string {
  if (subject.toLowerCase() === 'je' && startsWithVowel(form)) return `${subject[0]}'${form}`;
  return `${subject} ${form}`;
}
