import { MUSIC_GRADE as G } from '../../lib/notes';
import { readingPlugin } from '../../lib/lecture';

// Les deux clés mélangées, puis les deux portées du piano (le grand système).
export default readingPlugin({
  id: 'musique.lecture.deux-cles',
  notion: 'musique.lecture.deux-cles',
  title: 'Les deux clés',
  description: 'Clé de sol ou clé de fa : regarde bien la clé avant de lire la note.',
  icon: '🎹',
  expectedLevel: 2,
  levels: [
    { label: 'Autour du do du milieu', grade: G, params: { treble: [28, 32], bass: [24, 28] } },
    { label: 'Toute la portée', grade: G, params: { treble: [30, 38], bass: [18, 26] } },
    { label: 'Avec une ligne en plus', grade: G, params: { treble: [27, 41], bass: [15, 29] } },
    {
      label: 'Les deux portées du piano',
      grade: G,
      params: { treble: [30, 38], bass: [18, 26], grand: true },
    },
    {
      label: 'Piano, avec les lignes en plus',
      grade: G,
      params: { treble: [26, 41], bass: [15, 30], grand: true },
    },
    {
      label: 'Piano : 4 notes',
      grade: G,
      params: { treble: [28, 38], bass: [18, 28], grand: true, count: 4 },
    },
  ],
});
