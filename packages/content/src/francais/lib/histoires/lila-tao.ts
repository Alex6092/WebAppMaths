import type { Story } from './index';

// Les deux textes de l'entraînement à la lecture de la dictée 5 de la classe, mot pour mot.

export const lilaTao: Story = {
  id: 'lila-tao',
  title: 'La surprise de Lila',
  icon: '🐉',
  level: 2,
  source: 'fiche de lecture de la classe (dictée 5)',
  text: [
    'Ce matin, Lila est pressée de partir à l’école : elle a une surprise pour Tao. En effet, elle a trouvé un livre sur les dragons dans un vide-greniers. Elle l’a acheté 1 euro avec son argent de poche. Elle savait que Tao adorait les dragons et que cela lui ferait plaisir. Lila a acheté le cadeau avec l’aide de son papa et elle l’a glissé au fond de son cartable. Quand elle arrive à l’école, elle court vers Tao.',
    'Tao se demande pourquoi elle sourit comme ça. Il la voit fouiller dans son cartable et sortir un paquet. Il est surpris quand il comprend que c’est pour lui. Il l’ouvre et découvre un superbe livre illustré. Sa copine a vu juste, il adore les livres sur les dragons ! Il est ravi. Pour la remercier, il va lui faire un beau dessin avec ses couleurs préférées.',
  ],
  questions: [
    {
      ask: 'Pourquoi Lila est-elle pressée de partir à l’école ?',
      answer: 'Elle a une surprise pour Tao.',
      wrong: ['Elle est en retard.', 'Elle a une dictée.'],
      proof: 'elle a une surprise pour Tao',
    },
    {
      ask: 'Où Lila a-t-elle trouvé le livre ?',
      answer: 'dans un vide-greniers',
      wrong: ['📚 à la bibliothèque', '🏫 à l’école'],
      proof: 'dans un vide-greniers',
    },
    {
      ask: 'Combien a coûté le livre ?',
      answer: '1 euro',
      wrong: ['5 euros', '10 euros'],
      proof: 'Elle l’a acheté 1 euro',
    },
    {
      ask: 'Qui a aidé Lila à acheter le cadeau ?',
      answer: '👨 son papa',
      wrong: ['👩 sa maman', '👵 sa mamie'],
      proof: 'avec l’aide de son papa',
    },
    {
      ask: 'Où Lila a-t-elle glissé le cadeau ?',
      answer: 'au fond de son cartable',
      wrong: ['dans sa trousse', 'sous son manteau'],
      proof: 'au fond de son cartable',
    },
    {
      ask: 'Qu’y a-t-il dans le paquet ?',
      answer: '📖 un livre illustré',
      wrong: ['🎲 un jeu', '🧸 une peluche'],
      proof: 'un superbe livre illustré',
    },
    {
      claim: 'Tao n’aime pas les dragons.',
      truth: false,
      proof: 'il adore les livres sur les dragons',
    },
    {
      ask: 'Comment se sent Tao quand il ouvre le paquet ?',
      answer: 'ravi',
      wrong: ['triste', 'en colère'],
      proof: 'Il est ravi',
    },
    {
      ask: 'Que va faire Tao pour remercier Lila ?',
      answer: '🎨 un beau dessin',
      wrong: ['🍬 lui donner des bonbons', '📖 lui prêter un livre'],
      proof: 'il va lui faire un beau dessin',
    },
  ],
};
