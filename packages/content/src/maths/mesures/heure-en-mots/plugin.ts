import { defineLevels, definePlugin, onDial } from '@app/core';
import { timeInWords } from '../../lib/heure';

// « Comment dit-on cette heure ? » : et quart, et demie, moins le quart.

interface Params {
  minutes: number[];
}

interface Data {
  minutes: number;
}

export default definePlugin<'mcq', Params, Data>('mcq', {
  id: 'maths.mesures.heure-en-mots',
  version: 1,
  title: 'Dire l’heure',
  description: 'Et quart, et demie, moins le quart : dis l’heure avec des mots.',
  icon: '🗣️',
  notions: ['maths.mesures.lire-heure'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'Pile, et demie', grade: 'CE1', params: { minutes: [0, 30] } },
    { label: 'Et quart, moins le quart', grade: 'CE1', params: { minutes: [0, 15, 30, 45] } },
  ]),

  generate({ rng, params }) {
    // De 1 h à 10 h : « midi » et « minuit » ne se disent pas « douze heures et quart ».
    const hour = rng.int(1, 10);
    const minute =
      params.minutes.length > 2 && rng.chance(0.6) ? rng.pick([15, 45]) : rng.pick(params.minutes);
    const minutes = hour * 60 + minute;
    // Les pièges : les autres quarts de la même heure, et l'heure d'à côté pour « moins le quart ».
    const others = params.minutes.filter((m) => m !== minute).map((m) => hour * 60 + m);
    const near = minute === 45 ? [minutes - 60] : minute === 15 ? [minutes + 30] : [minutes + 60];
    const wrong = rng.sample(
      [...new Set([...others, ...near])].filter((t) => t !== minutes),
      2,
    );
    const times = rng.shuffle([minutes, ...wrong]);
    return {
      widget: 'mcq',
      instruction: 'COCHE la bonne façon de dire l’heure.',
      picture: { kind: 'clock', minutes },
      choices: times.map((t) => ({ id: String(t), label: timeInWords(t) })),
      multiple: false,
      layout: 'list',
      data: { minutes },
    };
  },

  solve: (q) => ({ selected: [String(q.data.minutes)] }),

  explain(q) {
    const m = onDial(q.data.minutes) % 60;
    const said = timeInWords(q.data.minutes);
    if (m === 45)
      return `La grande aiguille est sur le 9 : il manque un quart d’heure pour arriver à l’heure suivante. On dit « ${said} ».`;
    if (m === 15)
      return `La grande aiguille est sur le 3 : un quart d’heure est passé. On dit « ${said} ».`;
    if (m === 30)
      return `La grande aiguille est sur le 6 : une demi-heure est passée. On dit « ${said} ».`;
    return `La grande aiguille est sur le 12 : on dit « ${said} ».`;
  },

  signature: (q) => String(q.data.minutes),
});
