import type { Story } from './index';

export const cerfVolant: Story = {
  id: 'cerf-volant',
  title: 'Le cerf-volant de Lila',
  icon: '🪁',
  level: 1,
  source: 'histoire inventée pour le Cartable',
  text: [
    'Lila a un cerf-volant rouge. Un matin, il y a beaucoup de vent. Lila va au parc avec son papi. Elle fait voler son cerf-volant très haut dans le ciel.',
    'Tout à coup, le fil casse ! Le cerf-volant s’envole et tombe dans un grand arbre. Lila est triste : l’arbre est bien trop haut pour elle.',
    'Un petit écureuil grimpe le long du tronc. Avec ses pattes, il pousse le cerf-volant. Le cerf-volant glisse de branche en branche et tombe dans les bras de Lila. Lila rit et dit merci à l’écureuil.',
  ],
  questions: [
    {
      ask: 'De quelle couleur est le cerf-volant de Lila ?',
      answer: '🔴 rouge',
      wrong: ['🔵 bleu', '🟡 jaune'],
      proof: 'cerf-volant rouge',
    },
    {
      ask: 'Quel temps fait-il ce matin-là ?',
      answer: '💨 il y a du vent',
      wrong: ['🌧️ il pleut', '❄️ il neige'],
      proof: 'beaucoup de vent',
    },
    {
      ask: 'Avec qui Lila va-t-elle au parc ?',
      answer: '👴 avec son papi',
      wrong: ['👩 avec sa maman', '🐶 avec son chien'],
      proof: 'avec son papi',
    },
    {
      ask: 'Où tombe le cerf-volant ?',
      answer: '🌳 dans un arbre',
      wrong: ['🌊 dans l’eau', '🏠 sur un toit'],
      proof: 'tombe dans un grand arbre',
    },
    {
      ask: 'Qui aide Lila ?',
      answer: '🐿️ un écureuil',
      wrong: ['🐦 un oiseau', '🐱 un chat'],
      proof: 'Un petit écureuil grimpe',
    },
    {
      ask: 'Comment est Lila à la fin de l’histoire ?',
      answer: '😀 contente',
      wrong: ['😢 triste', '😠 en colère'],
      proof: 'Lila rit et dit merci',
      why: true,
    },
  ],
};
