import { clockText, defineLevels, definePlugin, onDial } from '@app/core';
import {
  CLOCK_LEVELS,
  CLOCK_STEP,
  randomAfternoon,
  randomTime,
  readingExplanation,
  withMinuteLabels,
  type ClockParams,
} from '../../lib/heure';

// « COCHE l'horloge qui indique 3 h 30 » : la bonne horloge parmi des pièges.

interface Data {
  minutes: number;
  afternoon: boolean;
  answer: string;
}

const LETTERS = ['A', 'B', 'C'];

/**
 * Les erreurs qu'on fait en lisant l'heure : les aiguilles inversées, une heure de trop ou de
 * moins (la petite aiguille entre deux nombres), les minutes lues à l'envers du cadran.
 */
function traps(minutes: number, step: number): number[] {
  const hour = Math.floor(minutes / 60);
  const m = minutes % 60;
  const swapped = Math.round(m / 5) * 60 + ((Math.round((hour * 5) / step) * step) % 60);
  return [
    swapped,
    minutes + 60,
    minutes - 60,
    hour * 60 + ((60 - m) % 60),
    hour * 60 + ((m + 30) % 60),
  ]
    .map(onDial)
    .filter((t) => t % step === 0);
}

export default definePlugin<'mcq', ClockParams, Data>('mcq', {
  id: 'maths.mesures.quelle-horloge',
  version: 1,
  title: 'Quelle horloge ?',
  description: 'Trouve l’horloge qui indique l’heure.',
  icon: '⏰',
  notions: ['maths.mesures.lire-heure'],
  expectedLevel: 4,
  levels: defineLevels<ClockParams>([...CLOCK_LEVELS]),

  generate({ rng, params }) {
    const afternoon = params.kind === 'apres-midi';
    const minutes = afternoon ? randomAfternoon(rng) : randomTime(rng, params.kind);
    const step = CLOCK_STEP[params.kind];
    const wrong = rng
      .shuffle([...new Set(traps(minutes, step))].filter((t) => t !== minutes))
      .slice(0, 2);
    const times = rng.shuffle([minutes, ...wrong]);
    const minuteLabels = withMinuteLabels(params.kind);
    const choices = times.map((t, i) => ({
      id: LETTERS[i]!,
      label: LETTERS[i]!,
      picture: { kind: 'clock' as const, minutes: t, minuteLabels },
    }));
    return {
      widget: 'mcq',
      instruction: 'COCHE l’horloge qui indique l’heure.',
      prompt: clockText(minutes, afternoon),
      choices,
      multiple: false,
      layout: 'row',
      data: { minutes, afternoon, answer: LETTERS[times.indexOf(minutes)]! },
    };
  },

  solve: (q) => ({ selected: [q.data.answer] }),

  explain: (q) => readingExplanation(q.data.minutes, q.data.afternoon),

  signature: (q) => `${q.data.minutes}:${q.data.afternoon}`,
});
