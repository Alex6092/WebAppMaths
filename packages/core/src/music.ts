/**
 * Les notes de musique : leur nom, leur place sur la portée, leur son, la touche du piano et la
 * corde du violon. Une note se repère par son rang diatonique : do du milieu (do 3 en France,
 * C4 ailleurs) = 28, ré = 29… Le rang ne compte que les touches blanches ; le dièse ou le bémol
 * s'ajoute à côté.
 */

/** do = 0, ré = 1… si = 6. */
export type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6;
/** −1 : bémol, 1 : dièse. */
export type Accidental = -1 | 0 | 1;

export interface Note {
  /** Rang diatonique : 28 pour le do du milieu. */
  d: number;
  acc?: Accidental;
}

export type Clef = 'treble' | 'bass';

/** Les figures : ronde, blanche, noire, croche, double croche. */
export type Duration = 'w' | 'h' | 'q' | 'e' | 's';

/** Un élément d'une portée : une note, un silence ou une barre de mesure. */
export interface StaffItem {
  /** Absente : un silence (ou une note de rythme, sans hauteur, sur une portée de rythme). */
  note?: Note;
  /** La figure (ronde par défaut). */
  dur?: Duration;
  dot?: boolean;
  rest?: boolean;
  /** Une barre de mesure. */
  bar?: boolean;
  /** Reliée à la suivante par une barre (deux croches). */
  beam?: boolean;
  /** Sur la portée du bas (clé de fa) d'un grand système. */
  low?: boolean;
  /** Un point d'interrogation à la place de la note : la note à trouver. */
  ask?: boolean;
}

export const MIDDLE_C = 28;

export const STEP_NAMES = ['do', 'ré', 'mi', 'fa', 'sol', 'la', 'si'] as const;
const SEMITONES = [0, 2, 4, 5, 7, 9, 11];

export const note = (d: number, acc: Accidental = 0): Note => (acc ? { d, acc } : { d });

export function stepOf(d: number): Step {
  return (((d % 7) + 7) % 7) as Step;
}

/** « do », « fa dièse », « si bémol ». */
export function noteName(n: Note): string {
  const base = STEP_NAMES[stepOf(n.d)];
  return n.acc === 1 ? `${base} dièse` : n.acc === -1 ? `${base} bémol` : base;
}

/** « fa♯ », « si♭ » : le nom écrit court, pour une suite de notes. */
export function noteSymbol(n: Note): string {
  return STEP_NAMES[stepOf(n.d)] + (n.acc === 1 ? '♯' : n.acc === -1 ? '♭' : '');
}

/** Numéro MIDI : 60 pour le do du milieu, 69 pour le la du diapason. */
export function midiOf(n: Note): number {
  const octave = Math.floor(n.d / 7);
  return 12 * (octave + 1) + SEMITONES[stepOf(n.d)]! + (n.acc ?? 0);
}

/** Fréquence en hertz (la = 440 Hz). */
export function frequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

/** Rang de la ligne du bas de la portée : mi en clé de sol, sol en clé de fa. */
const BOTTOM_LINE: Record<Clef, number> = { treble: 30, bass: 18 };

/**
 * Place sur la portée, en demi-interlignes au-dessus de la ligne du bas : 0 sur la 1re ligne,
 * 1 dans le 1er interligne… 8 sur la 5e ligne. Négative en dessous de la portée.
 */
export function staffPosition(d: number, clef: Clef): number {
  return d - BOTTOM_LINE[clef];
}

export function fromPosition(position: number, clef: Clef): number {
  return position + BOTTOM_LINE[clef];
}

/** Sur une ligne (vrai) ou dans un interligne (faux), lignes supplémentaires comprises. */
export const onLine = (position: number) => position % 2 === 0;

/** Les lignes supplémentaires à tracer pour une note (leurs positions). */
export function ledgerLines(position: number): number[] {
  const lines: number[] = [];
  for (let p = -2; p >= position; p -= 2) lines.push(p);
  for (let p = 10; p <= position; p += 2) lines.push(p);
  return lines;
}

/** Les touches noires suivent do, ré, fa, sol et la (pas mi ni si). */
export const hasSharp = (d: number) => ![2, 6].includes(stepOf(d));

/** La note d'une touche du piano (numéro MIDI), écrite avec un dièse si c'est une touche noire. */
export function noteOfMidi(midi: number, flat = false): Note {
  const octave = Math.floor(midi / 12) - 1;
  const semi = midi - 12 * (octave + 1);
  const white = SEMITONES.indexOf(semi);
  if (white >= 0) return note(octave * 7 + white);
  return flat
    ? note(octave * 7 + SEMITONES.indexOf(semi + 1), -1)
    : note(octave * 7 + SEMITONES.indexOf(semi - 1), 1);
}

export const isBlackKey = (midi: number) => SEMITONES.indexOf(((midi % 12) + 12) % 12) < 0;

/* ---------- Le violon, en 1re position ---------- */

export interface ViolinString {
  name: string;
  /** Rang de la corde à vide. */
  open: number;
}

/** Les cordes, de la plus grave à la plus aiguë. */
export const VIOLIN_STRINGS: ViolinString[] = [
  { name: 'sol', open: 25 },
  { name: 'ré', open: 29 },
  { name: 'la', open: 33 },
  { name: 'mi', open: 37 },
];
/** De la corde de sol à vide au si du 4e doigt sur la corde de mi. */
export const VIOLIN_LOW = 25;
export const VIOLIN_HIGH = 41;

export interface Fingering {
  /** Numéro de la corde (0 : sol… 3 : mi). */
  string: number;
  /** 0 : à vide ; 1 à 4 : le doigt. */
  finger: number;
}

/**
 * Où se joue une note en 1re position. Une note qui est aussi une corde à vide (ré, la, mi) se
 * joue à vide ; with4 donne l'autre façon, au 4e doigt sur la corde d'en dessous.
 */
export function fingering(d: number, with4 = false): Fingering | null {
  if (d < VIOLIN_LOW || d > VIOLIN_HIGH) return null;
  let string = VIOLIN_STRINGS.length - 1;
  while (VIOLIN_STRINGS[string]!.open > d) string--;
  if (with4 && string > 0 && VIOLIN_STRINGS[string]!.open === d) string--;
  return { string, finger: d - VIOLIN_STRINGS[string]!.open };
}

/* ---------- Les durées ---------- */

export const BEATS: Record<Duration, number> = { w: 4, h: 2, q: 1, e: 0.5, s: 0.25 };

/** Durée d'un élément en temps (une noire = 1 temps). Une barre de mesure ne dure rien. */
export function itemBeats(item: StaffItem): number {
  if (item.bar) return 0;
  const base = BEATS[item.dur ?? 'w'];
  return item.dot ? base * 1.5 : base;
}

export const totalBeats = (items: readonly StaffItem[]) =>
  items.reduce((sum, item) => sum + itemBeats(item), 0);

const FIGURES: Record<Duration, [string, string]> = {
  w: ['ronde', 'pause'],
  h: ['blanche', 'demi-pause'],
  q: ['noire', 'soupir'],
  e: ['croche', 'demi-soupir'],
  s: ['double croche', 'quart de soupir'],
};

/** « noire », « blanche pointée », « soupir ». */
export function figureName(item: StaffItem): string {
  const [noteName, restName] = FIGURES[item.dur ?? 'w'];
  if (item.rest) return restName;
  return item.dot ? `${noteName} pointée` : noteName;
}

/** « 1 temps », « 2 temps », « un demi-temps ». */
export function beatsText(beats: number): string {
  if (beats === 0.5) return 'un demi-temps';
  if (beats === 0.25) return 'un quart de temps';
  const whole = Math.floor(beats);
  const half = beats - whole === 0.5 ? ' et demi' : '';
  return `${whole} temps${half}`;
}
