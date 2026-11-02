import {
  hasSharp,
  midiOf,
  MIDDLE_C,
  note,
  noteName,
  staffPosition,
  stepOf,
  STEP_NAMES,
  type Accidental,
  type Clef,
  type McqChoice,
  type Note,
  type Picture,
  type Rng,
  type StaffItem,
  type Tone,
} from '@app/core';

/**
 * Outils communs aux exercices de musique. La musique ne suit pas la classe : tous les niveaux
 * sont ouverts dès le CP, et l'enfant monte aussi vite qu'il veut.
 */
export const MUSIC_GRADE = 'CP' as const;

/** Les notes de lo à hi (rangs diatoniques, bornes comprises). */
export function between(lo: number, hi: number): number[] {
  return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
}

export const whole = (d: number, acc: Accidental = 0): StaffItem => ({ note: note(d, acc) });

export function staff(clef: Clef | 'grand' | 'rhythm', items: StaffItem[], time?: number): Picture {
  return time ? { kind: 'staff', clef, items, time } : { kind: 'staff', clef, items };
}

/** Une altération au hasard, quand elle existe sur le piano (pas de mi dièse ni de do bémol). */
export function randomAccidental(rng: Rng, d: number): Accidental {
  const options: Accidental[] = [0];
  if (hasSharp(d)) options.push(1);
  if (hasSharp(d - 1)) options.push(-1);
  return rng.pick(options);
}

/** Les noms à cocher : ceux des notes de la plage, dans l'ordre de la gamme (do, ré, mi…). */
export function nameChoices(range: readonly number[]): McqChoice[] {
  const steps = [...new Set(range.map(stepOf))].sort((a, b) => a - b);
  return steps.map((s) => ({ id: STEP_NAMES[s], label: STEP_NAMES[s] }));
}

/** Les noms à cocher pour une note altérée : la note, ses altérations et ses voisines. */
export function accidentalChoices(n: Note): McqChoice[] {
  const notes: Note[] = [note(n.d - 1), note(n.d), note(n.d + 1)];
  if (hasSharp(n.d)) notes.push(note(n.d, 1));
  if (hasSharp(n.d - 1)) notes.push(note(n.d, -1));
  const names = [...new Set(notes.map(noteName))];
  if (!names.includes(noteName(n))) names.push(noteName(n));
  return names.map((name) => ({ id: name, label: name }));
}

const ORDINAL = ['1re', '2e', '3e', '4e', '5e'];

/** Où est la note : « sur la 2e ligne », « dans le 1er interligne », « sous la portée »… */
export function placeText(d: number, clef: Clef): string {
  const p = staffPosition(d, clef);
  if (p === -1) return 'juste sous la portée';
  if (p === 9) return 'juste au-dessus de la portée';
  // Les lignes supplémentaires se comptent depuis la portée.
  if (p < -1) {
    const k = p % 2 === 0 ? -p / 2 : (-p - 1) / 2;
    return `${p % 2 === 0 ? 'sur' : 'sous'} la ${ORDINAL[k - 1]} ligne ajoutée sous la portée`;
  }
  if (p > 9) {
    const k = p % 2 === 0 ? (p - 8) / 2 : (p - 9) / 2;
    return `${p % 2 === 0 ? 'sur' : 'au-dessus de'} la ${ORDINAL[k - 1]} ligne ajoutée au-dessus de la portée`;
  }
  if (p % 2 === 0) return `sur la ${ORDINAL[p / 2]} ligne`;
  return p === 1 ? 'dans le 1er interligne' : `dans le ${ORDINAL[(p - 1) / 2]} interligne`;
}

export const CLEF_NAMES: Record<Clef, string> = { treble: 'clé de sol', bass: 'clé de fa' };

/** Le repère d'une clé : la note de la ligne où elle s'enroule. */
export const CLEF_HINT: Record<Clef, string> = {
  treble: 'En clé de sol, le sol est sur la 2e ligne (là où la clé s’enroule).',
  bass: 'En clé de fa, le fa est sur la 4e ligne (entre les deux points de la clé).',
};

/** Les notes à jouer, une par temps sauf indication. */
export const tones = (notes: readonly Note[], beats = 1): Tone[] =>
  notes.map((n) => ({ midi: midiOf(n), beats }));

/** Le do du milieu, et les plages de chaque clé. */
export { MIDDLE_C };

/** Des notes voisines tirées l'une après l'autre (sauts de 1 à maxStep), sans sortir de la plage. */
export function melody(
  rng: Rng,
  count: number,
  lo: number,
  hi: number,
  maxStep = 2,
  start?: number,
): number[] {
  const notes = [start ?? rng.int(lo, hi)];
  while (notes.length < count) {
    const last = notes[notes.length - 1]!;
    const options = between(Math.max(lo, last - maxStep), Math.min(hi, last + maxStep)).filter(
      (d) => d !== last,
    );
    notes.push(rng.pick(options));
  }
  return notes;
}
