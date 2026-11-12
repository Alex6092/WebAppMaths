import { defineLevels, definePlugin } from '@app/core';
import { conversion, LENGTH_NOTION, metresAndCm, speakLength } from '../../lib/longueurs';

export default definePlugin('number-input', {
  id: 'maths.mesures.convertis-longueur',
  version: 1,
  title: 'Convertis en centimètres',
  icon: '📏',
  notions: [LENGTH_NOTION],
  expectedLevel: 2,
  printExplanation: true,
  levels: defineLevels([
    { label: 'Des mètres entiers', grade: 'CE1', params: { mixed: false } },
    { label: 'Des mètres et des centimètres', grade: 'CE1', params: { mixed: true } },
  ]),
  minVariety: 9,

  generate({ rng, params }) {
    const cm = rng.int(1, 9) * 100 + (params.mixed ? rng.int(1, 99) : 0);
    const shown = metresAndCm(cm);
    return {
      widget: 'number-input',
      instruction: 'CONVERTIS la longueur en centimètres.',
      prompt: `${shown} = {?}`,
      speech: `Convertis ${speakLength(shown)} en centimètres.`,
      unit: 'cm',
      maxLength: 3,
      data: { cm },
    };
  },

  solve: (q) => ({ value: String(q.data.cm) }),
  explain: (q) => `Un mètre vaut 100 centimètres. ${conversion(q.data.cm)}.`,
  signature: (q) => String(q.data.cm),
});
