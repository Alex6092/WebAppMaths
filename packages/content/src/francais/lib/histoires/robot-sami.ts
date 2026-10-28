import type { Story } from './index';

export const robotSami: Story = {
  id: 'robot-sami',
  title: 'Le robot de Sami',
  icon: '🤖',
  level: 3,
  source: 'histoire inventée pour le Cartable',
  text: [
    'Sami adore bricoler. Dans sa chambre, il garde des boîtes pleines de vis, de fils et de vieux jouets cassés. Quand la maîtresse annonce le concours d’inventions de l’école, il sait tout de suite ce qu’il va fabriquer : un robot qui range les chambres !',
    'Pendant deux semaines, il travaille tous les soirs avec son grand-père, qui était mécanicien. Ils utilisent les roues d’une petite voiture, un bras en carton et une vieille télécommande. Sami peint le robot en jaune et l’appelle Boulon.',
    'Le jour du concours, Sami pose Boulon devant le jury et appuie sur la télécommande. Rien ne se passe. Il appuie encore : toujours rien ! Les élèves commencent à chuchoter, et Sami sent ses joues devenir toutes rouges.',
    'Son amie Chloé s’approche et regarde la télécommande. « Les piles sont à l’envers ! » murmure-t-elle. Sami les retourne, et Boulon se met enfin à rouler. Il attrape une chaussette avec son bras et la dépose dans un panier. Toute la salle applaudit.',
    'Sami ne gagne pas le premier prix, mais le jury lui donne le prix de l’invention la plus utile. Le soir, il demande à Chloé de l’aider à fabriquer Boulon 2.',
  ],
  questions: [
    {
      ask: 'Que doit faire le robot de Sami ?',
      answer: 'ranger les chambres',
      wrong: ['faire la cuisine', 'arroser les plantes'],
      proof: 'un robot qui range les chambres',
    },
    {
      ask: 'Qui aide Sami à fabriquer le robot ?',
      answer: 'son grand-père',
      wrong: ['sa maîtresse', 'son grand frère'],
      proof: 'avec son grand-père',
    },
    {
      ask: 'Comment s’appelle le robot ?',
      answer: 'Boulon',
      wrong: ['Ressort', 'Tournevis'],
      proof: 'l’appelle Boulon',
    },
    {
      ask: 'Pourquoi les joues de Sami deviennent-elles rouges ?',
      answer: 'Il est gêné, car son robot ne marche pas devant tout le monde.',
      wrong: ['Il a trop chaud.', 'Il est malade.'],
      proof: 'ses joues devenir toutes rouges',
      why: true,
    },
    {
      ask: 'Pourquoi le robot ne marche-t-il pas ?',
      answer: 'Les piles sont à l’envers.',
      wrong: ['Il est cassé.', 'Il n’a pas de roues.'],
      proof: 'Les piles sont à l’envers',
    },
    {
      ask: 'Que range Boulon devant le jury ?',
      answer: 'une chaussette',
      wrong: ['un livre', 'une balle'],
      proof: 'attrape une chaussette',
    },
    {
      claim: 'Sami gagne le premier prix du concours.',
      truth: false,
      proof: 'ne gagne pas le premier prix',
    },
    {
      ask: 'Pourquoi Sami demande-t-il à Chloé de l’aider pour Boulon 2 ?',
      answer: 'Elle l’a aidé à faire marcher son robot.',
      wrong: ['Elle a gagné le concours.', 'Elle a beaucoup de piles.'],
      proof: 'fabriquer Boulon 2',
      why: true,
    },
  ],
};
