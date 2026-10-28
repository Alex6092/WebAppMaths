import type { Story } from './index';

export const bonhommeNeige: Story = {
  id: 'bonhomme-neige',
  title: 'Le bonhomme de neige de Nina',
  icon: '⛄',
  level: 1,
  source: 'histoire inventée pour le Cartable',
  text: [
    'Ce matin, tout est blanc dehors : il a neigé toute la nuit ! Nina met son bonnet, ses gants et ses bottes. Avec son frère Malo, elle fait un grand bonhomme de neige.',
    'Pour les yeux, ils prennent deux cailloux. Pour le nez, Malo apporte une carotte. Nina lui donne son écharpe rouge, pour qu’il n’ait pas froid.',
    'L’après-midi, le soleil revient. Le bonhomme de neige fond doucement. Nina est un peu triste, mais Malo sourit : « Il reviendra l’hiver prochain ! »',
  ],
  questions: [
    {
      ask: 'Pourquoi tout est blanc dehors ?',
      answer: '❄️ il a neigé',
      wrong: ['🌫️ il y a du brouillard', '🎨 on a tout peint'],
      proof: 'il a neigé toute la nuit',
      why: true,
    },
    {
      ask: 'Comment s’appelle le frère de Nina ?',
      answer: '👦 Malo',
      wrong: ['🧒 Léo', '👶 Tom'],
      proof: 'son frère Malo',
    },
    {
      ask: 'Avec quoi fait-on les yeux du bonhomme ?',
      answer: '🪨 des cailloux',
      wrong: ['🔘 des boutons', '🍒 des cerises'],
      proof: 'deux cailloux',
    },
    {
      ask: 'Avec quoi fait-on son nez ?',
      answer: '🥕 une carotte',
      wrong: ['🍌 une banane', '🍓 une fraise'],
      proof: 'Malo apporte une carotte',
    },
    {
      ask: 'Que donne Nina au bonhomme de neige ?',
      answer: '🧣 son écharpe',
      wrong: ['🧤 ses gants', '🎩 un chapeau'],
      proof: 'son écharpe rouge',
    },
    {
      ask: 'Pourquoi le bonhomme de neige fond-il ?',
      answer: '☀️ le soleil revient',
      wrong: ['🌧️ il pleut', '🔥 on fait un feu'],
      proof: 'le soleil revient',
      why: true,
    },
  ],
};
