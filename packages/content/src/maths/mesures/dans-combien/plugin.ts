import { clockText, defineLevels, definePlugin, onDial } from '@app/core';

// « Il est 3 h. Le goûter est dans 1 heure » : l'horloge montre l'heure qu'il est, l'enfant
// avance les aiguilles de la durée.

interface Params {
  /** Durées possibles, en minutes. */
  durations: number[];
  /** Pas de l'heure de départ et des aiguilles. */
  step: number;
  minuteLabels: boolean;
}

interface Data {
  from: number;
  duration: number;
}

const EVENTS = [
  { text: 'le goûter', icon: '🍪' },
  { text: 'le bus', icon: '🚌' },
  { text: 'le dessin animé', icon: '📺' },
  { text: 'la piscine', icon: '🏊' },
  { text: 'le repas', icon: '🍽️' },
  { text: 'la récréation', icon: '⚽' },
  { text: 'le train', icon: '🚆' },
  { text: 'le spectacle', icon: '🎪' },
];

/** « 1 heure », « une demi-heure », « 25 minutes »… */
function durationText(minutes: number): string {
  if (minutes === 30) return 'une demi-heure';
  if (minutes === 15) return 'un quart d’heure';
  if (minutes % 60 === 0) return `${minutes / 60} heure${minutes > 60 ? 's' : ''}`;
  if (minutes % 60 === 30) return `${Math.floor(minutes / 60)} heure et demie`;
  return `${minutes} minutes`;
}

export default definePlugin<'clock', Params, Data>('clock', {
  id: 'maths.mesures.dans-combien',
  version: 1,
  title: 'Quelle heure sera-t-il ?',
  description: 'Fais avancer les aiguilles : quelle heure sera-t-il dans une heure ?',
  icon: '⏩',
  notions: ['maths.mesures.durees'],
  expectedLevel: 3,
  levels: defineLevels<Params>([
    {
      label: 'Dans 1 ou 2 heures',
      grade: 'CE1',
      params: { durations: [60, 120], step: 30, minuteLabels: false },
    },
    {
      label: 'Dans une demi-heure',
      grade: 'CE1',
      params: { durations: [30, 60, 90], step: 30, minuteLabels: false },
    },
    {
      label: 'Dans un quart d’heure',
      grade: 'CE1',
      params: { durations: [15, 30, 45], step: 15, minuteLabels: false },
    },
    {
      label: 'De 5 en 5 minutes',
      grade: 'CE2',
      params: { durations: [5, 10, 20, 25, 35, 40], step: 5, minuteLabels: true },
    },
  ]),

  generate({ rng, params }) {
    const from = rng.int(0, 720 / params.step - 1) * params.step;
    const duration = rng.pick(params.durations);
    const event = rng.pick(EVENTS);
    return {
      widget: 'clock',
      instruction: `Il est ${clockText(from)}. ${event.icon} ${capitalized(event.text)} est dans ${durationText(duration)} : PLACE les aiguilles à l’heure ${article(event.text)}.`,
      prompt: `Dans ${durationText(duration)}`,
      step: params.step,
      start: from,
      ...(params.minuteLabels ? { minuteLabels: true } : {}),
      data: { from, duration },
    };
  },

  solve: (q) => ({ minutes: onDial(q.data.from + q.data.duration) }),

  explain(q) {
    const { from, duration } = q.data;
    return `Il est ${clockText(from)}. ${capitalized(durationText(duration))} plus tard, il sera ${clockText(from + duration)}.`;
  },

  signature: (q) => `${q.data.from}+${q.data.duration}`,
});

const capitalized = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** « du goûter », « de la piscine ». */
const article = (text: string) => (text.startsWith('le ') ? `du ${text.slice(3)}` : `de ${text}`);
