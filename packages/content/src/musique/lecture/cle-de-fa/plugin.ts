import { MUSIC_GRADE as G } from '../../lib/notes';
import { readingPlugin } from '../../lib/lecture';

// Lire une note en clé de fa : en descendant depuis le do du milieu, puis toute la portée.
export default readingPlugin({
  id: 'musique.lecture.cle-de-fa',
  notion: 'musique.lecture.cle-de-fa',
  title: 'Les notes en clé de fa',
  description: 'Regarde la note sur la portée et coche son nom.',
  icon: '🎼',
  expectedLevel: 3,
  levels: [
    { label: 'do, si, la', grade: G, params: { bass: [26, 28] } },
    { label: 'de fa à do', grade: G, params: { bass: [24, 28] } },
    { label: 'Toute la portée', grade: G, params: { bass: [18, 26] } },
    { label: 'Une ligne en plus', grade: G, params: { bass: [15, 29] } },
    { label: 'Deux lignes en plus', grade: G, params: { bass: [13, 31] } },
    { label: 'Lecture rapide : 4 notes', grade: G, params: { bass: [15, 29], count: 4 } },
    { label: 'Dièses et bémols', grade: G, params: { bass: [18, 28], acc: true } },
  ],
});
