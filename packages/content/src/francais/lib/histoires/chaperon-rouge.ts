import type { Story } from './index';

// D'après la version des frères Grimm, qui finit bien : le chasseur sauve la grand-mère et
// la petite fille.
export const chaperonRouge: Story = {
  id: 'chaperon-rouge',
  title: 'Le Petit Chaperon rouge',
  icon: '🧺',
  level: 3,
  source: 'conte de Perrault et des frères Grimm',
  text: [
    'Il était une fois une petite fille qui portait toujours un petit chaperon de velours rouge, cousu par sa grand-mère. C’est pour cela qu’on l’appelait le Petit Chaperon rouge.',
    'Un matin, sa maman lui dit : « Ta grand-mère est malade. Va lui porter cette galette et ce petit pot de beurre. Surtout, ne quitte pas le chemin ! » La grand-mère habite de l’autre côté du bois.',
    'Dans le bois, le Petit Chaperon rouge rencontre le loup. Elle ne sait pas qu’il est méchant, alors elle lui raconte où elle va. « Regarde ces jolies fleurs, dit le loup. Ta grand-mère serait contente d’avoir un bouquet ! » La petite fille quitte le chemin pour cueillir des fleurs. Pendant ce temps, le loup court jusqu’à la maison de la grand-mère et l’avale d’un coup.',
    'Puis il met son bonnet de nuit et se couche dans son lit. Quand le Petit Chaperon rouge arrive, elle trouve que sa grand-mère a l’air bizarre. « Grand-mère, comme vous avez de grandes oreilles ! — C’est pour mieux t’entendre, mon enfant. — Grand-mère, comme vous avez de grandes dents ! — C’est pour mieux te manger ! » Et le loup avale aussi la petite fille.',
    'Le ventre plein, le loup s’endort et ronfle très fort. Un chasseur qui passe par là entend ces ronflements. Il entre, voit le loup au gros ventre et comprend tout. Avec des ciseaux, il ouvre le ventre du loup : le Petit Chaperon rouge et sa grand-mère en sortent, bien vivantes ! La petite fille se promet de ne plus jamais quitter le chemin.',
  ],
  questions: [
    {
      ask: 'Pourquoi l’appelle-t-on le Petit Chaperon rouge ?',
      answer: 'Elle porte toujours un chaperon rouge.',
      wrong: ['Elle a les cheveux roux.', 'Elle aime les fraises.'],
      proof: 'qui portait toujours un petit chaperon',
      why: true,
    },
    {
      ask: 'Qu’apporte-t-elle à sa grand-mère ?',
      answer: 'une galette et un petit pot de beurre',
      wrong: ['un gâteau et du miel', 'de la soupe et du pain'],
      proof: 'cette galette et ce petit pot de beurre',
    },
    {
      ask: 'Que lui dit sa maman avant qu’elle parte ?',
      answer: 'Ne quitte pas le chemin !',
      wrong: ['Rentre avant la nuit !', 'Ne parle pas au chasseur !'],
      proof: 'Surtout, ne quitte pas le chemin',
    },
    {
      ask: 'Pourquoi le loup lui montre-t-il les fleurs ?',
      answer: 'Pour arriver le premier chez la grand-mère.',
      wrong: ['Parce qu’il aime les fleurs.', 'Pour lui faire un cadeau.'],
      proof: 'le loup court jusqu’à la maison',
      why: true,
    },
    {
      ask: 'Où se couche le loup ?',
      answer: 'dans le lit de la grand-mère',
      wrong: ['sous la table', 'derrière la porte'],
      proof: 'se couche dans son lit',
    },
    {
      ask: 'D’après le loup, pourquoi a-t-il de grandes dents ?',
      answer: 'Pour mieux la manger.',
      wrong: ['Pour mieux sourire.', 'Pour croquer la galette.'],
      proof: 'C’est pour mieux te manger',
    },
    {
      ask: 'Comment le chasseur sait-il que le loup est là ?',
      answer: 'Il l’entend ronfler.',
      wrong: ['Il voit ses traces.', 'La petite fille l’appelle.'],
      proof: 'entend ces ronflements',
    },
    {
      claim: 'À la fin, la grand-mère et la petite fille sont sauvées.',
      truth: true,
      proof: 'bien vivantes',
    },
  ],
};
