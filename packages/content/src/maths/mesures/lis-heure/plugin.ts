import { compareBlanks, defineLevels, definePlugin, dialHour, onDial } from '@app/core';
import {
  CLOCK_LEVELS,
  randomAfternoon,
  randomTime,
  readingExplanation,
  withMinuteLabels,
  type ClockParams,
} from '../../lib/heure';

// « Quelle heure est-il ? » : l'horloge, et l'heure à écrire (« Il est … h … »).

interface Data {
  minutes: number;
  afternoon: boolean;
}

const pad = (n: number) => String(n).padStart(2, '0');

export default definePlugin<'fill-blank', ClockParams, Data>('fill-blank', {
  id: 'maths.mesures.lis-heure',
  version: 1,
  title: 'Quelle heure est-il ?',
  description: 'Lis l’heure sur l’horloge et écris-la.',
  icon: '🕒',
  notions: ['maths.mesures.lire-heure'],
  expectedLevel: 4,
  levels: defineLevels<ClockParams>([...CLOCK_LEVELS]),

  generate({ rng, params }) {
    const afternoon = params.kind === 'apres-midi';
    const minutes = afternoon ? randomAfternoon(rng) : randomTime(rng, params.kind);
    const pile = params.kind === 'pile';
    return {
      widget: 'fill-blank',
      instruction: afternoon
        ? 'C’est l’après-midi. ÉCRIS l’heure.'
        : 'ÉCRIS l’heure que montre l’horloge.',
      prompt: pile ? 'Il est {0} h.' : 'Il est {0} h {1}.',
      blanks: pile
        ? [{ kind: 'text', size: 2, digits: true }]
        : [
            { kind: 'text', size: 2, digits: true },
            { kind: 'text', size: 2, digits: true },
          ],
      picture: { kind: 'clock', minutes, minuteLabels: withMinuteLabels(params.kind) },
      data: { minutes, afternoon },
    };
  },

  solve(q) {
    const { minutes, afternoon } = q.data;
    const hour = dialHour(minutes) + (afternoon ? 12 : 0);
    const values = [String(hour)];
    if (q.blanks.length > 1) values.push(pad(onDial(minutes) % 60));
    return { values };
  },

  // Le matin, 15 h se lit aussi 3 h sur le cadran ; « 5 » et « 05 » sont la même minute.
  check(q, answer) {
    const { minutes, afternoon } = q.data;
    const hour = dialHour(minutes);
    const hours = afternoon ? [hour + 12] : hour === 12 ? [12, 0] : [hour, hour + 12];
    const m = onDial(minutes) % 60;
    const accepted = [hours.map(String), [String(m), pad(m)]];
    return compareBlanks(q, accepted, answer);
  },

  explain: (q) => readingExplanation(q.data.minutes, q.data.afternoon),

  signature: (q) => `${q.data.minutes}:${q.data.afternoon}`,
});
