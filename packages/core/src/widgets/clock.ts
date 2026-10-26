import { CLOCK_MINUTES, onDial } from '../clock';
import type { ClockAnswer, Mark } from '../question';
import type { WidgetDef } from './types';

export const clockWidget: WidgetDef<'clock'> = {
  id: 'clock',

  emptyAnswer: (q) => ({ minutes: q.start }),

  validate(_q, answer): answer is ClockAnswer {
    if (typeof answer !== 'object' || answer === null) return false;
    const { minutes } = answer as Partial<ClockAnswer>;
    return Number.isInteger(minutes) && minutes! >= 0 && minutes! < CLOCK_MINUTES;
  },

  // Il faut avoir tourné les aiguilles (elles ne partent jamais de l'heure demandée).
  isComplete: (q, answer) => answer.minutes !== q.start,

  // Chaque aiguille est corrigée : la grande pour les minutes, la petite pour l'heure.
  compare(_q, expected, given) {
    const want = onDial(expected.minutes);
    const got = onDial(given.minutes);
    const minute: Mark = want % 60 === got % 60 ? 'ok' : 'wrong';
    const hour: Mark = Math.floor(want / 60) === Math.floor(got / 60) ? 'ok' : 'wrong';
    const correct = minute === 'ok' && hour === 'ok';
    return {
      correct,
      score: correct ? 1 : 0,
      marks: { minute, hour },
      feedback: correct
        ? undefined
        : minute === 'ok'
          ? 'La grande aiguille est bien placée : regarde la petite ! 💪'
          : hour === 'ok'
            ? 'La petite aiguille montre la bonne heure : regarde la grande ! 💪'
            : undefined,
    };
  },

  // Les aiguilles restent où elles sont : l'enfant les corrige.
  retryAnswer: (_q, given) => ({ minutes: given.minutes }),

  speech: (q) => q.prompt,
};
