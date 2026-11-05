import { defineLevels, definePlugin } from '@app/core';
import { bareWord, LETTER_D, syllableTraps } from '../../lib/syllabes';

// L'entraînement à la lecture de la dictée 5 (« LIS les syllabes et les mots ») : l'app ne peut
// pas entendre l'enfant lire ; la voix dit une syllabe ou un mot, l'enfant touche ce qu'il entend.

interface Params {
  what: 'simple' | 'complex' | 'words';
}

interface Data {
  answer: string;
}

const IDS = ['a', 'b', 'c', 'd'];
const reading = LETTER_D;

export default definePlugin<'mcq', Params, Data>('mcq', {
  id: 'francais.lecture.ecoute-touche',
  version: 1,
  title: 'Écoute et touche',
  description: 'La voix dit une syllabe ou un mot : touche ce que tu entends.',
  icon: '👂',
  notions: ['francais.lecture.decoder', 'francais.orthographe.lettre-d'],
  expectedLevel: 3,
  levels: defineLevels<Params>([
    { label: 'Des syllabes (da, dou)', grade: 'CE1', params: { what: 'simple' } },
    { label: 'Des syllabes difficiles (dron, dob)', grade: 'CE1', params: { what: 'complex' } },
    { label: 'Des mots', grade: 'CE1', params: { what: 'words' } },
  ]),

  generate({ rng, params }) {
    let answer: string;
    let say: string;
    let others: string[];
    if (params.what === 'words') {
      answer = rng.pick(reading.words);
      say = answer;
      // D'autres mots de la liste, qui commencent si possible pareil (demain, demander, dedans).
      const start = (w: string, n: number) => bareWord(w).slice(0, n);
      const rest = reading.words.filter((w) => w !== answer);
      const close = rest.filter((w) => start(w, 2) === start(answer, 2));
      const near = rest.filter((w) => start(w, 1) === start(answer, 1) && !close.includes(w));
      const far = rest.filter((w) => !close.includes(w) && !near.includes(w));
      others = [...rng.shuffle(close), ...rng.shuffle(near), ...rng.shuffle(far)].slice(0, 3);
    } else {
      const s = rng.pick(reading[params.what]);
      answer = s.text;
      say = s.say ?? s.text;
      others = rng.sample(syllableTraps(reading, s.text), 3);
    }
    const labels = rng.shuffle([answer, ...others]);
    return {
      widget: 'mcq',
      instruction: 'ÉCOUTE et TOUCHE ce que tu entends.',
      // La voix ne lit pas les étiquettes : c'est à l'enfant de les lire.
      speech: 'Écoute, et touche ce que tu entends.',
      listen: say,
      choices: labels.map((label, i) => ({ id: IDS[i]!, label })),
      multiple: false,
      layout: params.what === 'words' ? 'list' : 'grid',
      data: { answer: IDS[labels.indexOf(answer)]! },
    };
  },

  solve: (q) => ({ selected: [q.data.answer] }),

  explain(q) {
    const right = q.choices.find((c) => c.id === q.data.answer)!.label;
    return `On entendait « ${right} ». Regarde bien chaque lettre, de gauche à droite.`;
  },

  invariants(q) {
    const labels = q.choices.map((c) => c.label);
    if (new Set(labels).size !== labels.length) return 'deux étiquettes pareilles';
    return undefined;
  },

  signature: (q) => q.choices.find((c) => c.id === q.data.answer)!.label,
});
