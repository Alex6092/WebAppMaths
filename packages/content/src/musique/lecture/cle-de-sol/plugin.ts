import { MUSIC_GRADE as G } from '../../lib/notes';
import { readingPlugin } from '../../lib/lecture';

// Lire une note en clé de sol : du do du milieu jusqu'aux lignes supplémentaires, puis les altérations.
export default readingPlugin({
  id: 'musique.lecture.cle-de-sol',
  notion: 'musique.lecture.cle-de-sol',
  title: 'Les notes en clé de sol',
  description: 'Regarde la note sur la portée et coche son nom.',
  icon: '🎼',
  expectedLevel: 3,
  levels: [
    { label: 'do, ré, mi', grade: G, params: { treble: [28, 30] } },
    { label: 'de do à sol', grade: G, params: { treble: [28, 32] } },
    { label: 'Toute la portée', grade: G, params: { treble: [30, 38] } },
    { label: 'Une ligne en plus', grade: G, params: { treble: [27, 41] } },
    { label: 'Deux lignes en plus', grade: G, params: { treble: [25, 43] } },
    { label: 'Lecture rapide : 4 notes', grade: G, params: { treble: [27, 41], count: 4 } },
    { label: 'Dièses et bémols', grade: G, params: { treble: [28, 38], acc: true } },
  ],
});
