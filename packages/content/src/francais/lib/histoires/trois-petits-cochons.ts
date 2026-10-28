import type { Story } from './index';

export const troisPetitsCochons: Story = {
  id: 'trois-petits-cochons',
  title: 'Les trois petits cochons',
  icon: '🐷',
  level: 2,
  source: 'conte traditionnel',
  text: [
    'Il était une fois trois petits cochons qui quittent leur maman pour construire chacun sa maison. Le premier, pressé d’aller jouer, construit une maison de paille. Le deuxième fait une maison de bois. Le troisième prend son temps : il bâtit une solide maison de briques.',
    'Un jour, un grand loup affamé frappe chez le premier cochon. « Petit cochon, laisse-moi entrer ! » Le cochon refuse. Alors le loup souffle, souffle… et la maison de paille s’envole ! Le petit cochon court se cacher chez son frère, dans la maison de bois. Mais le loup souffle encore, et la maison de bois tombe aussi.',
    'Les deux cochons courent jusqu’à la maison de briques. Le loup souffle de toutes ses forces : la maison ne bouge pas ! Furieux, il grimpe sur le toit pour descendre par la cheminée. Mais le troisième cochon a mis une grande marmite d’eau sur le feu. Le loup tombe dedans, pousse un cri et s’enfuit pour toujours.',
  ],
  questions: [
    {
      ask: 'De quoi est faite la maison du premier cochon ?',
      answer: '🌾 de paille',
      wrong: ['🪵 de bois', '🧱 de briques'],
      proof: 'construit une maison de paille',
    },
    {
      ask: 'Pourquoi le premier cochon construit-il sa maison si vite ?',
      answer: 'Il est pressé d’aller jouer.',
      wrong: ['Il a peur de la pluie.', 'Sa maman l’attend.'],
      proof: 'pressé d’aller jouer',
    },
    {
      claim: 'Le troisième cochon construit sa maison très vite.',
      truth: false,
      proof: 'Le troisième prend son temps',
    },
    {
      ask: 'Où se cache le premier cochon quand sa maison s’envole ?',
      answer: 'chez son frère, dans la maison de bois',
      wrong: ['dans la forêt', 'chez sa maman'],
      proof: 'court se cacher chez son frère',
    },
    {
      ask: 'Que se passe-t-il quand le loup souffle sur la maison de briques ?',
      answer: 'Elle ne bouge pas.',
      wrong: ['Elle s’envole.', 'Elle tombe.'],
      proof: 'la maison ne bouge pas',
    },
    {
      ask: 'Par où le loup veut-il entrer dans la maison de briques ?',
      answer: 'par la cheminée',
      wrong: ['par la fenêtre', 'par la porte'],
      proof: 'descendre par la cheminée',
    },
    {
      ask: 'Qu’arrive-t-il au loup à la fin ?',
      answer: 'Il tombe dans la marmite et s’enfuit.',
      wrong: ['Il mange les trois cochons.', 'Il devient l’ami des cochons.'],
      proof: 'Le loup tombe dedans',
    },
  ],
};
