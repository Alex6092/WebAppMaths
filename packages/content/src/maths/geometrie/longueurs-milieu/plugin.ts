import { defineLevels, definePlugin, roundCm, type Figure } from '@app/core';
import { lengthText, sideOf, towards } from '../../lib/geometrie';

// GEOM 2, exercice 6 : « COMPLÈTE. Le point M est le milieu du segment [AB]. AM = 4 cm, MB = … »

type Part = 'AM' | 'MB' | 'AB';

interface Params {
  /** Ce qu'on donne → ce qu'on cherche. */
  cases: [Part, Part][];
  /** Plus grande longueur de AB (cm). */
  max: number;
  /** Une figure à l'échelle aide à voir le milieu. */
  figure: boolean;
}

interface Data {
  given: Part;
  asked: Part;
  half: number;
}

const HALF_PARTS: Part[] = ['AM', 'MB'];

const value = (part: Part, half: number) => (part === 'AB' ? 2 * half : half);

export default definePlugin<'number-input', Params, Data>('number-input', {
  id: 'maths.geometrie.longueurs-milieu',
  version: 1,
  title: 'Les longueurs du milieu',
  description: 'M est le milieu de [AB] : trouve AM, MB ou AB.',
  icon: '📏',
  notions: ['maths.geometrie.milieu-longueurs'],
  expectedLevel: 3,
  levels: defineLevels<Params>([
    {
      label: 'AM = MB',
      grade: 'CE1',
      params: {
        cases: [
          ['AM', 'MB'],
          ['MB', 'AM'],
        ],
        max: 12,
        figure: true,
      },
    },
    {
      label: 'Le double et la moitié',
      grade: 'CE1',
      params: {
        cases: [
          ['AM', 'AB'],
          ['MB', 'AB'],
          ['AB', 'AM'],
          ['AB', 'MB'],
        ],
        max: 12,
        figure: true,
      },
    },
    {
      label: 'Sans figure, jusqu’à 20 cm',
      grade: 'CE1',
      params: {
        cases: [
          ['AM', 'MB'],
          ['AM', 'AB'],
          ['MB', 'AB'],
          ['AB', 'AM'],
          ['AB', 'MB'],
        ],
        max: 20,
        figure: false,
      },
    },
  ]),

  generate({ rng, params }) {
    const [given, asked] = rng.pick(params.cases);
    const half = rng.int(2, params.max / 2);
    let figure: Figure | undefined;
    if (params.figure) {
      const start = { x: roundCm((14 - 2 * half) / 2), y: 1.3 };
      const m = towards(start, 0, half);
      const end = towards(m, 0, half);
      const [from, to] = given === 'AB' ? [start, end] : given === 'AM' ? [start, m] : [m, end];
      const text = lengthText(from, to, `${value(given, half)} cm`);
      figure = {
        width: 14,
        height: 3,
        points: [
          { id: 'A', label: 'A', ...start, mark: 'tick', labelAt: sideOf(0) },
          { id: 'M', label: 'M', ...m, mark: 'tick', labelAt: sideOf(0) },
          { id: 'B', label: 'B', ...end, mark: 'tick', labelAt: sideOf(0) },
        ],
        segments: [{ from: 'A', to: 'B' }],
        texts: [given === 'AB' ? { ...text, y: roundCm(text.y + 0.1) } : text],
      };
    }
    return {
      widget: 'number-input',
      instruction: 'COMPLÈTE. Le point M est le milieu du segment [AB].',
      prompt: `${given} = ${value(given, half)} cm   ${asked} = {?}`,
      unit: 'cm',
      maxLength: 2,
      ...(figure ? { figure } : {}),
      data: { given, asked, half },
    };
  },

  solve: (q) => ({ value: String(value(q.data.asked, q.data.half)) }),

  explain: (q) => {
    const { given, asked, half } = q.data;
    if (HALF_PARTS.includes(given) && HALF_PARTS.includes(asked))
      return `M est le milieu : AM = MB = ${half} cm.`;
    if (asked === 'AB') return `AB est le double de ${given} : ${half} + ${half} = ${2 * half} cm.`;
    return `${asked} est la moitié de AB : la moitié de ${2 * half} est ${half}, donc ${asked} = ${half} cm.`;
  },

  invariants: (q, { params }) => (2 * q.data.half > params.max ? 'AB trop long' : undefined),
});
