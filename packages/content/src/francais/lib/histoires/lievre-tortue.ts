import type { Story } from './index';

export const lievreTortue: Story = {
  id: 'lievre-tortue',
  title: 'Le lièvre et la tortue',
  icon: '🐢',
  level: 2,
  source: 'fable d’Ésope et de La Fontaine',
  text: [
    'Un matin, le lièvre se moque de la tortue : « Comme tu es lente ! Il te faut une journée pour traverser le pré. » La tortue lui répond calmement : « Faisons une course. Je parie que j’arriverai avant toi. » Le lièvre éclate de rire, mais il accepte.',
    'Les animaux choisissent l’arrivée : le grand chêne, au bout du chemin. Le renard donne le départ. La tortue part tout de suite, un pas après l’autre, sans jamais s’arrêter.',
    'Le lièvre, lui, est sûr de gagner. Il mange un peu d’herbe, il cueille des fleurs, puis il s’allonge à l’ombre et fait une petite sieste. Quand il se réveille, il voit la tortue tout près du chêne ! Il court à toute vitesse… trop tard. La tortue a gagné.',
    '« Rien ne sert de courir, dit la tortue en souriant : il faut partir à point. »',
  ],
  questions: [
    {
      ask: 'Pourquoi le lièvre se moque-t-il de la tortue ?',
      answer: 'Elle est très lente.',
      wrong: ['Elle est très petite.', 'Elle chante faux.'],
      proof: 'Comme tu es lente',
    },
    {
      ask: 'Où est l’arrivée de la course ?',
      answer: '🌳 au grand chêne',
      wrong: ['🏠 chez le lièvre', '🌊 à la rivière'],
      proof: 'le grand chêne, au bout du chemin',
    },
    {
      ask: 'Qui donne le départ ?',
      answer: 'le renard',
      wrong: ['le hibou', 'l’ours'],
      proof: 'Le renard donne le départ',
    },
    {
      claim: 'La tortue s’arrête plusieurs fois pendant la course.',
      truth: false,
      proof: 'sans jamais s’arrêter',
    },
    {
      ask: 'Que fait le lièvre pendant la course ?',
      answer: 'Il fait une sieste.',
      wrong: ['Il aide la tortue.', 'Il court sans s’arrêter.'],
      proof: 'fait une petite sieste',
    },
    {
      ask: 'Pourquoi le lièvre perd-il la course ?',
      answer: 'Il est trop sûr de gagner et il perd son temps.',
      wrong: ['Il s’est fait mal à la patte.', 'Le renard l’a arrêté.'],
      proof: 'est sûr de gagner',
      why: true,
    },
    {
      ask: 'Qui gagne la course ?',
      answer: '🐢 la tortue',
      wrong: ['🐇 le lièvre', '🦊 le renard'],
      proof: 'La tortue a gagné',
    },
  ],
};
