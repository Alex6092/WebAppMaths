import { defineLevels, definePlugin } from '@app/core';
import { ENGLISH, NUMBERS } from '../../lib/mots';

// « ÉCOUTE et ÉCRIS le nombre en chiffres » : le nombre est dit en anglais.

interface Params {
  from: number;
  to: number;
}

interface Data {
  value: number;
}

export default definePlugin<'number-input', Params, Data>('number-input', {
  id: 'anglais.vocabulaire.ecris-nombre',
  version: 1,
  title: 'Écoute le nombre en anglais',
  description: 'One, two, three… : écoute et écris le nombre en chiffres.',
  icon: '👂',
  notions: [NUMBERS.id],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'De 1 à 10', grade: 'CE1', params: { from: 1, to: 10 } },
    { label: 'De 1 à 20', grade: 'CE1', params: { from: 1, to: 20 } },
  ]),

  generate({ rng, params }) {
    const value = rng.int(params.from, params.to);
    return {
      widget: 'number-input',
      instruction: 'ÉCOUTE et ÉCRIS le nombre en chiffres.',
      listen: NUMBERS.words[value - 1]!.en,
      listenLang: ENGLISH,
      prompt: '{?}',
      maxLength: 2,
      data: { value },
    };
  },

  solve: (q) => ({ value: String(q.data.value) }),

  explain: (q) => `« ${NUMBERS.words[q.data.value - 1]!.en} », c’est ${q.data.value}.`,

  signature: (q) => String(q.data.value),
});
