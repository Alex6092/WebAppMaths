import type { Story } from './index';

export const veterinaire: Story = {
  id: 'veterinaire',
  title: 'Inès, vétérinaire d’un jour',
  icon: '🐶',
  level: 2,
  source: 'histoire inventée pour le Cartable',
  text: [
    'Inès rêve d’être vétérinaire. Pendant les vacances, sa tante Sophie, qui soigne les animaux, l’emmène à son cabinet. Inès enfile une blouse blanche, un peu trop grande pour elle.',
    'Le premier patient est un chat qui éternue. Sophie l’écoute avec son stéthoscope et donne un sirop à sa maîtresse. Ensuite arrive un perroquet qui ne veut plus parler. Il a seulement besoin de repos, explique Sophie.',
    'Soudain, un petit garçon entre en pleurant. Il porte un chiot qui boite. Inès regarde la patte avec attention : une épine est plantée entre deux coussinets ! Sophie retire l’épine avec une pince, et Inès met un joli pansement bleu.',
    'Le chiot remue la queue et lèche la main d’Inès. Le petit garçon sourit enfin. Le soir, Inès dit à sa tante : « Plus tard, c’est sûr, je soignerai les animaux comme toi ! »',
  ],
  questions: [
    {
      ask: 'Quel est le métier de la tante d’Inès ?',
      answer: 'vétérinaire',
      wrong: ['boulangère', 'maîtresse'],
      proof: 'qui soigne les animaux',
    },
    {
      ask: 'Comment est la blouse d’Inès ?',
      answer: 'trop grande',
      wrong: ['trop petite', 'rouge'],
      proof: 'un peu trop grande pour elle',
    },
    {
      ask: 'Quel animal éternue ?',
      answer: '🐱 un chat',
      wrong: ['🐶 un chien', '🦜 un perroquet'],
      proof: 'un chat qui éternue',
    },
    {
      claim: 'Le perroquet a besoin d’un médicament.',
      truth: false,
      proof: 'Il a seulement besoin de repos',
    },
    {
      ask: 'Pourquoi le chiot boite-t-il ?',
      answer: 'Il a une épine dans la patte.',
      wrong: ['Il s’est cassé la patte.', 'Il est très fatigué.'],
      proof: 'une épine est plantée',
    },
    {
      ask: 'De quelle couleur est le pansement ?',
      answer: 'bleu',
      wrong: ['rose', 'vert'],
      proof: 'un joli pansement bleu',
    },
    {
      ask: 'Comment se sent le petit garçon à la fin ?',
      answer: 'soulagé et content',
      wrong: ['triste', 'fâché'],
      proof: 'Le petit garçon sourit enfin',
      why: true,
    },
  ],
};
