import { describe, expect, it } from 'vitest';
import {
  fingering,
  frequency,
  fromPosition,
  isBlackKey,
  ledgerLines,
  midiOf,
  MIDDLE_C,
  note,
  noteName,
  noteOfMidi,
  staffPosition,
  totalBeats,
} from './music';

describe('les notes', () => {
  it('nomme les notes, avec leurs altérations', () => {
    expect(noteName(note(MIDDLE_C))).toBe('do');
    expect(noteName(note(32))).toBe('sol');
    expect(noteName(note(31, 1))).toBe('fa dièse');
    expect(noteName(note(34, -1))).toBe('si bémol');
  });

  it('donne le son : le la du diapason à 440 Hz', () => {
    expect(midiOf(note(MIDDLE_C))).toBe(60);
    expect(midiOf(note(33))).toBe(69);
    expect(frequency(69)).toBe(440);
    expect(midiOf(note(31, 1))).toBe(66);
  });

  it('place les notes sur la portée dans les deux clés', () => {
    // Clé de sol : mi sur la 1re ligne, sol sur la 2e.
    expect(staffPosition(30, 'treble')).toBe(0);
    expect(staffPosition(32, 'treble')).toBe(2);
    // Clé de fa : sol sur la 1re ligne, fa sur la 4e.
    expect(staffPosition(18, 'bass')).toBe(0);
    expect(staffPosition(24, 'bass')).toBe(6);
    // Le do du milieu : une ligne supplémentaire, en dessous en clé de sol, au-dessus en clé de fa.
    expect(ledgerLines(staffPosition(MIDDLE_C, 'treble'))).toEqual([-2]);
    expect(ledgerLines(staffPosition(MIDDLE_C, 'bass'))).toEqual([10]);
    expect(ledgerLines(staffPosition(34, 'treble'))).toEqual([]);
    expect(fromPosition(staffPosition(27, 'bass'), 'bass')).toBe(27);
  });

  it('trouve les touches du piano', () => {
    expect(isBlackKey(61)).toBe(true);
    expect(isBlackKey(64)).toBe(false);
    expect(noteOfMidi(61)).toEqual(note(MIDDLE_C, 1));
    expect(noteOfMidi(61, true)).toEqual(note(29, -1));
    expect(noteOfMidi(71)).toEqual(note(34));
  });
});

describe('le violon', () => {
  it('donne la corde et le doigt en 1re position', () => {
    expect(fingering(25)).toEqual({ string: 0, finger: 0 });
    // Le si : corde de la, 1er doigt.
    expect(fingering(34)).toEqual({ string: 2, finger: 1 });
    // Le mi aigu se joue à vide… ou au 4e doigt sur la corde de la.
    expect(fingering(37)).toEqual({ string: 3, finger: 0 });
    expect(fingering(37, true)).toEqual({ string: 2, finger: 4 });
    expect(fingering(24)).toBeNull();
  });
});

describe('les durées', () => {
  it('additionne les temps', () => {
    expect(totalBeats([{ dur: 'h' }, { dur: 'q' }, { dur: 'e' }, { dur: 'e' }])).toBe(4);
    expect(totalBeats([{ dur: 'h', dot: true }, { dur: 'q', rest: true }, { bar: true }])).toBe(4);
  });
});
