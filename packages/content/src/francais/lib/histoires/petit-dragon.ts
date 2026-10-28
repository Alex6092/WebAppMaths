import type { Story } from './index';

export const petitDragon: Story = {
  id: 'petit-dragon',
  title: 'Firmin, le petit dragon',
  icon: '🐉',
  level: 2,
  source: 'histoire inventée pour le Cartable',
  text: [
    'Dans une montagne vit un petit dragon vert qui s’appelle Firmin. Tous les dragons savent cracher du feu… sauf Firmin. Quand il souffle, il ne sort qu’un petit nuage de fumée, et les autres dragons se moquent de lui.',
    'Un soir d’hiver, il fait très froid. Les dragons veulent allumer un grand feu pour se réchauffer, mais il a plu toute la journée : le bois est mouillé, et leurs flammes s’éteignent tout de suite.',
    'Firmin a une idée. Il souffle doucement, très doucement, sur les braises, pendant longtemps. Petit à petit, le bois sèche, puis une flamme apparaît, et bientôt un beau feu danse au milieu de la grotte.',
    'Tout le monde se serre autour du feu. « Merci, Firmin ! » disent les dragons. Depuis ce jour, plus personne ne se moque de lui.',
  ],
  questions: [
    {
      ask: 'De quelle couleur est Firmin ?',
      answer: '🟢 vert',
      wrong: ['🔴 rouge', '🔵 bleu'],
      proof: 'un petit dragon vert',
    },
    {
      ask: 'Que sort-il quand Firmin souffle ?',
      answer: 'un petit nuage de fumée',
      wrong: ['de grandes flammes', 'des bulles'],
      proof: 'un petit nuage de fumée',
    },
    {
      ask: 'Comment se sent Firmin au début de l’histoire ?',
      answer: 'triste',
      wrong: ['fier', 'pressé'],
      proof: 'les autres dragons se moquent de lui',
      why: true,
    },
    {
      ask: 'Pourquoi les dragons n’arrivent-ils pas à faire du feu ?',
      answer: 'Le bois est mouillé.',
      wrong: ['Il fait trop chaud.', 'Ils sont trop fatigués.'],
      proof: 'le bois est mouillé',
    },
    {
      ask: 'Comment Firmin souffle-t-il sur les braises ?',
      answer: 'doucement, pendant longtemps',
      wrong: ['très fort, d’un seul coup', 'il ne souffle pas'],
      proof: 'Il souffle doucement',
    },
    {
      ask: 'Où les dragons font-ils le feu ?',
      answer: 'dans la grotte',
      wrong: ['au bord de la mer', 'dans le village'],
      proof: 'au milieu de la grotte',
    },
    {
      claim: 'À la fin, les dragons se moquent encore de Firmin.',
      truth: false,
      proof: 'plus personne ne se moque de lui',
    },
  ],
};
