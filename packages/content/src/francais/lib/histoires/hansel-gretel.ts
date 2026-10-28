import type { Story } from './index';

export const hanselGretel: Story = {
  id: 'hansel-gretel',
  title: 'Hansel et Gretel',
  icon: '🍬',
  level: 4,
  source: 'conte des frères Grimm',
  text: [
    'Au bord d’une grande forêt vivait un pauvre bûcheron avec ses deux enfants, Hansel et Gretel, et leur belle-mère. Un hiver, il n’y eut plus rien à manger. La belle-mère décida d’abandonner les enfants au fond de la forêt, et le père, très triste, n’osa pas dire non.',
    'Mais Hansel avait tout entendu. Pendant la nuit, il remplit ses poches de petits cailloux blancs. Le lendemain, en marchant dans la forêt, il en laissa tomber un tous les dix pas. Quand on les abandonna, les enfants attendirent que la lune se lève : les cailloux brillaient comme des pièces d’argent et les guidèrent jusqu’à la maison.',
    'Quelque temps plus tard, la belle-mère recommença. Cette fois, Hansel n’avait pu emporter qu’un morceau de pain, dont il sema les miettes sur le chemin. Hélas, les oiseaux les mangèrent toutes, et les enfants se perdirent.',
    'Après trois jours de marche, ils découvrirent une étonnante maison : ses murs étaient en pain d’épice, son toit en gâteau et ses fenêtres en sucre. Affamés, ils se mirent à la grignoter. Une vieille femme sortit alors et les invita à entrer. Mais c’était une sorcière qui mangeait les enfants ! Elle enferma Hansel dans une cage pour l’engraisser et obligea Gretel à faire le ménage.',
    'Chaque matin, la sorcière, qui voyait très mal, demandait à Hansel de tendre son doigt pour savoir s’il avait grossi. Le malin lui tendait un petit os. Un jour, impatiente, la sorcière décida de le manger quand même et demanda à Gretel de vérifier si le four était chaud. « Je ne sais pas comment faire », répondit Gretel. « Petite sotte ! » dit la sorcière en se penchant dans le four. Gretel la poussa dedans et referma la porte.',
    'Gretel libéra son frère. Dans la maison, ils trouvèrent des coffres pleins de perles et de pierres précieuses. Ils retrouvèrent le chemin de chez eux, où leur père les attendait. La belle-mère était partie, et ils vécurent heureux, sans plus jamais avoir faim.',
  ],
  questions: [
    {
      ask: 'Quel est le métier du père ?',
      answer: 'bûcheron',
      wrong: ['meunier', 'boulanger'],
      proof: 'un pauvre bûcheron',
    },
    {
      ask: 'Pourquoi la belle-mère veut-elle abandonner les enfants ?',
      answer: 'Il n’y a plus rien à manger.',
      wrong: ['Les enfants sont méchants.', 'Elle veut partir en voyage.'],
      proof: 'il n’y eut plus rien à manger',
      why: true,
    },
    {
      ask: 'Qu’est-ce qui se passe en premier ?',
      answer: 'Hansel remplit ses poches de cailloux.',
      wrong: [
        'Les oiseaux mangent les miettes de pain.',
        'Les enfants trouvent la maison en pain d’épice.',
      ],
      proof: 'il remplit ses poches',
    },
    {
      ask: 'Comment les enfants retrouvent-ils le chemin la première fois ?',
      answer: 'grâce aux cailloux blancs',
      wrong: ['grâce aux miettes de pain', 'grâce à un oiseau'],
      proof: 'les cailloux brillaient',
    },
    {
      ask: 'Pourquoi les enfants se perdent-ils la deuxième fois ?',
      answer: 'Les oiseaux ont mangé les miettes de pain.',
      wrong: ['Il fait trop noir.', 'Hansel a perdu ses cailloux.'],
      proof: 'les oiseaux les mangèrent toutes',
      why: true,
    },
    {
      ask: 'De quoi sont faits les murs de la maison ?',
      answer: 'de pain d’épice',
      wrong: ['de chocolat', 'de bonbons'],
      proof: 'ses murs étaient en pain d’épice',
    },
    {
      ask: 'Dans l’histoire, que veut dire « affamés » ?',
      answer: 'qui ont très faim',
      wrong: ['très fatigués', 'très sales'],
      proof: 'Affamés, ils se mirent à la grignoter',
    },
    {
      ask: 'Pourquoi Hansel tend-il un petit os au lieu de son doigt ?',
      answer: 'Pour faire croire à la sorcière qu’il est encore trop maigre.',
      wrong: ['Pour la faire rire.', 'Parce qu’il a mal au doigt.'],
      proof: 'Le malin lui tendait un petit os',
      why: true,
    },
    {
      ask: 'Qui pousse la sorcière dans le four ?',
      answer: 'Gretel',
      wrong: ['Hansel', 'le père'],
      proof: 'Gretel la poussa dedans',
    },
    {
      claim: 'À la fin, les enfants rentrent chez leur père avec un trésor.',
      truth: true,
      proof: 'des coffres pleins de perles',
    },
  ],
};
