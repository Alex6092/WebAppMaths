import { defineLevels, definePlugin, midiOf, note, type Tone } from '@app/core';
import { MUSIC_GRADE as G } from '../../lib/notes';

// « Grave ou aigu ? » : deux notes jouées, la 2e est-elle plus aiguë, plus grave ou la même ?

interface Params {
  /** Écart entre les deux notes : en notes (marches de la gamme), ou un demi-ton. */
  gap: [number, number] | 'semitone';
  /** Trois notes : laquelle est la plus aiguë ? */
  three?: boolean;
}
interface Data {
  midis: number[];
  answer: string;
}

const tone = (midi: number): Tone => ({ midi, beats: 1.5 });

export default definePlugin<'mcq', Params, Data>('mcq', {
  id: 'musique.ecoute.grave-aigu',
  version: 1,
  title: 'Grave ou aigu ?',
  description: 'Écoute deux notes : la deuxième est-elle plus aiguë ou plus grave ?',
  icon: '👂',
  notions: ['musique.ecoute.grave-aigu'],
  expectedLevel: 3,
  levels: defineLevels<Params>([
    { label: 'Très différentes', grade: G, params: { gap: [7, 9] } },
    { label: 'Un peu moins', grade: G, params: { gap: [4, 5] } },
    { label: 'Proches', grade: G, params: { gap: [2, 3] } },
    { label: 'Voisines', grade: G, params: { gap: [1, 1] } },
    { label: 'Un demi-ton', grade: G, params: { gap: 'semitone' } },
    { label: 'Trois notes', grade: G, params: { gap: [1, 3], three: true } },
  ]),

  generate({ rng, params }) {
    if (params.three) {
      // Trois notes différentes, assez proches.
      const start = rng.int(26, 34);
      const set = new Set<number>([start]);
      while (set.size < 3) set.add(start + rng.int(-3, 3));
      const notes = rng.shuffle([...set]);
      const midis = notes.map((d) => midiOf(note(d)));
      const top = midis.indexOf(Math.max(...midis));
      return {
        widget: 'mcq',
        instruction: 'ÉCOUTE les trois notes. Laquelle est la plus AIGUË ?',
        tones: midis.map(tone),
        choices: [
          { id: '1', label: 'la 1re' },
          { id: '2', label: 'la 2e' },
          { id: '3', label: 'la 3e' },
        ],
        multiple: false,
        layout: 'row',
        data: { midis, answer: String(top + 1) },
      };
    }
    const same = rng.chance(0.2);
    let a: number;
    let b: number;
    if (params.gap === 'semitone') {
      a = rng.int(57, 76);
      b = same ? a : a + rng.pick([-1, 1]);
    } else {
      const d = rng.int(24, 36);
      const step = rng.int(params.gap[0], params.gap[1]) * rng.pick([-1, 1]);
      a = midiOf(note(d));
      b = same ? a : midiOf(note(d + step));
    }
    return {
      widget: 'mcq',
      instruction: 'ÉCOUTE les deux notes. La 2e est-elle plus aiguë, plus grave, ou la même ?',
      tones: [tone(a), tone(b)],
      choices: [
        { id: 'aigu', label: 'plus aiguë' },
        { id: 'grave', label: 'plus grave' },
        { id: 'meme', label: 'la même' },
      ],
      multiple: false,
      layout: 'row',
      data: { midis: [a, b], answer: b > a ? 'aigu' : b < a ? 'grave' : 'meme' },
    };
  },

  solve: (q) => ({ selected: [q.data.answer] }),

  explain(q) {
    const { answer } = q.data;
    if (answer === 'meme') return 'C’était deux fois la même note. Réécoute-les ! 🎵';
    if (answer === 'aigu')
      return 'La 2e note était plus aiguë : plus fine, plus haute. Réécoute ! 🎵';
    if (answer === 'grave')
      return 'La 2e note était plus grave : plus grosse, plus basse. Réécoute ! 🎵';
    return `C’était la ${answer === '1' ? '1re' : `${answer}e`} note, la plus fine. Réécoute ! 🎵`;
  },
});
