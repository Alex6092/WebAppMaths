import { activeChild } from './session.svelte';

/**
 * Petits sons de l'app, fabriqués avec Web Audio (pas de fichier à charger).
 * Ils se coupent dans la barre du haut (🔊 / 🔇), réglage gardé pour chaque enfant.
 */
export type SoundName = 'correct' | 'wrong' | 'coins' | 'levelUp' | 'badge' | 'daily';

/** Notes (fréquence en Hz, début et durée en secondes) de chaque son. */
const TUNES: Record<SoundName, { type: OscillatorType; notes: [number, number, number][] }> = {
  correct: {
    type: 'sine',
    notes: [
      [659, 0, 0.12],
      [988, 0.1, 0.22],
    ],
  },
  wrong: {
    type: 'triangle',
    notes: [
      [330, 0, 0.14],
      [262, 0.13, 0.22],
    ],
  },
  coins: {
    type: 'square',
    notes: [
      [1319, 0, 0.07],
      [1760, 0.07, 0.16],
    ],
  },
  levelUp: {
    type: 'triangle',
    notes: [
      [523, 0, 0.12],
      [659, 0.11, 0.12],
      [784, 0.22, 0.12],
      [1047, 0.33, 0.3],
    ],
  },
  badge: {
    type: 'sine',
    notes: [
      [784, 0, 0.14],
      [988, 0.12, 0.14],
      [1175, 0.24, 0.14],
      [1568, 0.36, 0.4],
    ],
  },
  daily: {
    type: 'triangle',
    notes: [
      [523, 0, 0.16],
      [523, 0.16, 0.1],
      [784, 0.28, 0.16],
      [659, 0.46, 0.12],
      [1047, 0.6, 0.45],
    ],
  },
};

let context: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null;
  context ??= new AudioContext();
  // Le navigateur garde le son en pause tant que l'enfant n'a pas touché l'écran.
  if (context.state === 'suspended') void context.resume();
  return context;
}

export function playSound(name: SoundName): void {
  if (activeChild()?.sound === false) return;
  const ctx = audio();
  if (!ctx) return;
  const { type, notes } = TUNES[name];
  const now = ctx.currentTime;
  for (const [frequency, start, duration] of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    // Une attaque douce et une fin en fondu, pour ne pas faire « clic ».
    const volume = type === 'square' ? 0.05 : 0.18;
    gain.gain.setValueAtTime(0, now + start);
    gain.gain.linearRampToValueAtTime(volume, now + start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + start);
    osc.stop(now + start + duration + 0.05);
  }
}
