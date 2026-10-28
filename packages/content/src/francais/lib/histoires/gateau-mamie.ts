import type { Story } from './index';

export const gateauMamie: Story = {
  id: 'gateau-mamie',
  title: 'Le gâteau de Mamie',
  icon: '🎂',
  level: 1,
  source: 'histoire inventée pour le Cartable',
  text: [
    'Demain, c’est l’anniversaire de Mamie. Jade et son papa préparent un gâteau au chocolat. Jade casse les œufs, et papa fait fondre le chocolat.',
    'Pendant que le gâteau cuit, Jade dessine une carte avec des fleurs. Ding ! Le four sonne. Le gâteau est prêt, et toute la cuisine sent bon.',
    'Le lendemain, Mamie souffle toutes les bougies d’un seul coup. Elle ouvre la carte de Jade et lui fait un gros bisou.',
  ],
  questions: [
    {
      ask: 'Quelle fête prépare-t-on ?',
      answer: '🎂 l’anniversaire de Mamie',
      wrong: ['🎄 Noël', '💒 un mariage'],
      proof: 'c’est l’anniversaire de Mamie',
    },
    {
      ask: 'Quel gâteau font-ils ?',
      answer: '🍫 un gâteau au chocolat',
      wrong: ['🍓 un gâteau aux fraises', '🍋 un gâteau au citron'],
      proof: 'un gâteau au chocolat',
    },
    {
      ask: 'Qui casse les œufs ?',
      answer: '👧 Jade',
      wrong: ['👨 papa', '👵 Mamie'],
      proof: 'Jade casse les œufs',
    },
    {
      ask: 'Que fait Jade pendant que le gâteau cuit ?',
      answer: '🎨 elle dessine une carte',
      wrong: ['📺 elle regarde la télé', '⚽ elle joue au ballon'],
      proof: 'Jade dessine une carte',
    },
    {
      ask: 'Qu’est-ce qui sonne ?',
      answer: '🔥 le four',
      wrong: ['📞 le téléphone', '🚪 la porte'],
      proof: 'Le four sonne',
    },
    {
      ask: 'Que fait Mamie quand elle ouvre la carte ?',
      answer: '😘 elle fait un bisou',
      wrong: ['😢 elle pleure', '😴 elle s’endort'],
      proof: 'lui fait un gros bisou',
    },
  ],
};
