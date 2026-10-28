import type { Story } from './index';

export const rouleGalette: Story = {
  id: 'roule-galette',
  title: 'Roule galette',
  icon: '🍪',
  level: 1,
  source: 'conte traditionnel',
  text: [
    'Une grand-mère prépare une galette bien dorée. Elle la pose sur la fenêtre pour qu’elle refroidisse. Mais la galette saute par la fenêtre et roule sur le chemin !',
    'Elle rencontre un lapin, puis un loup, puis un ours. Chaque fois, elle chante sa chanson et roule plus vite qu’eux.',
    'Enfin, elle rencontre un renard. « Ta chanson est si jolie ! dit le renard. Viens sur mon nez pour que je l’entende mieux. » La galette saute sur son nez… et hop ! Le renard la mange.',
  ],
  questions: [
    {
      ask: 'Qui prépare la galette ?',
      answer: '👵 une grand-mère',
      wrong: ['👦 un petit garçon', '🐻 un ours'],
      proof: 'Une grand-mère prépare',
    },
    {
      ask: 'Où la grand-mère pose-t-elle la galette ?',
      answer: '🪟 sur la fenêtre',
      wrong: ['🛏️ sur le lit', '🌳 sous un arbre'],
      proof: 'Elle la pose sur la fenêtre',
    },
    {
      ask: 'Quel animal la galette rencontre-t-elle en premier ?',
      answer: '🐰 un lapin',
      wrong: ['🐻 un ours', '🦊 un renard'],
      proof: 'Elle rencontre un lapin',
    },
    {
      ask: 'Que fait la galette quand elle rencontre un animal ?',
      answer: '🎵 elle chante',
      wrong: ['😴 elle dort', '😭 elle pleure'],
      proof: 'elle chante sa chanson',
    },
    {
      ask: 'Où le renard demande-t-il à la galette de sauter ?',
      answer: '👃 sur son nez',
      wrong: ['🌳 dans un arbre', '🏠 dans sa maison'],
      proof: 'Viens sur mon nez',
    },
    {
      ask: 'Qui mange la galette à la fin ?',
      answer: '🦊 le renard',
      wrong: ['🐺 le loup', '🐰 le lapin'],
      proof: 'Le renard la mange',
    },
  ],
};
