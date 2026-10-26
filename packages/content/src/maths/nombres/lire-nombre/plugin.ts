import { defineLevels, definePlugin, type Rng } from '@app/core';
import { numberToWords } from '../../../lib/lettres';
import { digitAt, retry } from '../../../lib/numbers';
import { pickNumber, type NumberRange } from '../../lib/nombres';

// Retrouver un nombre écrit en lettres parmi d'autres, ou la bonne écriture d'un nombre.

interface Params {
  range: NumberRange;
  /** toNumber : des lettres vers les chiffres ; toWords : choisir la bonne orthographe. */
  way: 'toNumber' | 'toWords';
}

interface Data {
  n: number;
  answer: string;
}

/** L'erreur de l'enfant qui écrit les morceaux bout à bout : soixante-quinze → 6015. */
function juxtaposed(n: number): number | null {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  if (hundreds > 0) return rest === 0 ? null : Number(`${hundreds}00${rest}`);
  if (rest >= 80) return Number(`80${rest - 80 || ''}`) || null;
  if (rest >= 70) return Number(`60${rest - 60}`);
  return rest % 10 === 0 ? null : Number(`${rest - (rest % 10)}${rest % 10}`);
}

function numberTraps(rng: Rng, n: number): number[] {
  const swapped = Number(String(n).split('').reverse().join(''));
  const candidates = [juxtaposed(n), swapped, n + 10, n - 10, n >= 100 ? n + 100 : n + 1]
    .filter((x): x is number => x !== null && x > 0 && x !== n)
    .filter((x, i, all) => all.indexOf(x) === i);
  return rng.sample(candidates, 2);
}

/** Les fautes d'orthographe courantes : traits d'union, s de cent et de vingt, « et ». */
function wordTraps(rng: Rng, n: number): string[] {
  const right = numberToWords(n);
  const candidates = [
    right.replace(/ /g, '-'),
    right.replace(/-/g, ' '),
    right.replace(/cents$/, 'cent').replace(/vingts$/, 'vingt'),
    right.replace(/ cent /, ' cents ').replace(/cent$/, 'cents'),
    right.replace(/vingt-/, 'vingts-'),
    right.replace(/ et /, '-et-'),
    numberToWords(n % 10 === 0 ? n + 10 : n - 1),
  ].filter((w, i, all) => w !== right && all.indexOf(w) === i);
  return rng.sample(candidates, 2);
}

export default definePlugin<'mcq', Params, Data>('mcq', {
  id: 'maths.nombres.lire-nombre',
  version: 1,
  title: 'Lire les nombres',
  description: 'Retrouve le nombre écrit en lettres, ou la bonne écriture d’un nombre.',
  icon: '👀',
  notions: ['maths.nombres.ecrire'],
  expectedLevel: 4,
  levels: defineLevels<Params>([
    { label: 'De 70 à 99', grade: 'CE1', params: { range: 'seventies', way: 'toNumber' } },
    { label: 'Les centaines', grade: 'CE1', params: { range: 'hundreds', way: 'toNumber' } },
    { label: 'Jusqu’à 999', grade: 'CE1', params: { range: 'all', way: 'toNumber' } },
    { label: 'La bonne orthographe', grade: 'CE1', params: { range: 'all', way: 'toWords' } },
  ]),

  generate({ rng, params }) {
    const n = retry(
      () => pickNumber(rng, params.range),
      // Il faut assez de pièges différents (pour 100, il n'y a presque rien à confondre).
      (x) => x > 100 || params.range !== 'hundreds' || digitAt(x, 0) + digitAt(x, 1) > 0,
    );
    if (params.way === 'toNumber') {
      const words = numberToWords(n);
      const options = rng.shuffle([n, ...numberTraps(rng, n)]).map(String);
      return {
        widget: 'mcq',
        instruction: `COCHE le nombre « ${words} ».`,
        choices: options.map((o) => ({ id: o, label: o })),
        multiple: false,
        layout: 'row',
        speech: `Coche le nombre ${words}.`,
        data: { n, answer: String(n) },
      };
    }
    const right = numberToWords(n);
    const options = rng.shuffle([right, ...wordTraps(rng, n)]);
    return {
      widget: 'mcq',
      instruction: `COCHE la bonne écriture de ${n}.`,
      choices: options.map((o, i) => ({ id: `w${i}`, label: o })),
      multiple: false,
      layout: 'list',
      speech: `Coche la bonne écriture de ${n}.`,
      data: { n, answer: `w${options.indexOf(right)}` },
    };
  },

  solve: (q) => ({ selected: [q.data.answer] }),

  explain: (q) => `${q.data.n} s’écrit « ${numberToWords(q.data.n)} ».`,

  invariants: (q) => (q.choices.length === 3 ? undefined : 'il faut 3 choix'),
});
