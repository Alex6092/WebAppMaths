import { clockText, defineLevels, definePlugin } from '@app/core';
import {
  CLOCK_LEVELS,
  CLOCK_STEP,
  randomAfternoon,
  randomTime,
  readingExplanation,
  withMinuteLabels,
  type ClockParams,
} from '../../lib/heure';
import { retry } from '../../../lib/numbers';

// « DESSINE les aiguilles » : l'heure est écrite, l'enfant règle l'horloge.

interface Data {
  minutes: number;
  afternoon: boolean;
}

export default definePlugin<'clock', ClockParams, Data>('clock', {
  id: 'maths.mesures.regle-horloge',
  version: 1,
  title: 'Règle l’horloge',
  description: 'Tourne les aiguilles pour montrer l’heure.',
  icon: '🕰️',
  notions: ['maths.mesures.lire-heure'],
  expectedLevel: 4,
  levels: defineLevels<ClockParams>([...CLOCK_LEVELS]),

  generate({ rng, params }) {
    const afternoon = params.kind === 'apres-midi';
    const minutes = afternoon ? randomAfternoon(rng) : randomTime(rng, params.kind);
    const step = Math.min(CLOCK_STEP[params.kind], 60);
    // Les aiguilles partent d'une autre heure, sur le même pas.
    const start = retry(
      () => rng.int(0, 720 / step - 1) * step,
      (s) => s !== minutes,
    );
    return {
      widget: 'clock',
      instruction: afternoon
        ? 'C’est l’après-midi. PLACE les aiguilles pour montrer l’heure.'
        : 'PLACE les aiguilles pour montrer l’heure.',
      prompt: clockText(minutes, afternoon),
      step,
      start,
      ...(withMinuteLabels(params.kind) ? { minuteLabels: true } : {}),
      data: { minutes, afternoon },
    };
  },

  solve: (q) => ({ minutes: q.data.minutes }),

  explain: (q) => readingExplanation(q.data.minutes, q.data.afternoon),

  signature: (q) => `${q.data.minutes}:${q.data.afternoon}`,
});
