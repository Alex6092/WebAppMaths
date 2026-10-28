import type { Story } from './index';

export const doudou: Story = {
  id: 'doudou',
  title: 'Le doudou de Tom',
  icon: '🧸',
  level: 1,
  source: 'histoire inventée pour le Cartable',
  text: [
    'Tom a un doudou lapin qui s’appelle Pompon. Il l’emmène partout. Un samedi, Tom va au parc avec sa grande sœur, Léa. Il joue au toboggan, puis à la balançoire.',
    'Le soir, au moment de se coucher, Tom cherche Pompon. Il n’est pas dans son lit ! Tom pleure. Léa réfléchit : « Je l’ai vu près de la balançoire ! »',
    'Avec papa, ils retournent au parc avec une lampe de poche. Pompon est là, assis sur le banc. Tom le serre très fort et s’endort en souriant.',
  ],
  questions: [
    {
      ask: 'Quel animal est le doudou de Tom ?',
      answer: '🐰 un lapin',
      wrong: ['🐻 un ours', '🐶 un chien'],
      proof: 'un doudou lapin',
    },
    {
      ask: 'Avec qui Tom va-t-il au parc ?',
      answer: '👧 avec sa grande sœur',
      wrong: ['👴 avec son papi', '👩 avec sa maman'],
      proof: 'avec sa grande sœur',
    },
    {
      ask: 'Que fait Tom quand il ne trouve pas Pompon ?',
      answer: '😢 il pleure',
      wrong: ['😀 il rit', '😴 il dort'],
      proof: 'Tom pleure',
    },
    {
      ask: 'Qui sait où est Pompon ?',
      answer: '👧 Léa',
      wrong: ['👨 papa', '🐶 le chien'],
      proof: 'Léa réfléchit',
    },
    {
      ask: 'Qu’est-ce qu’ils emportent pour retourner au parc ?',
      answer: '🔦 une lampe de poche',
      wrong: ['☂️ un parapluie', '🎒 un sac'],
      proof: 'une lampe de poche',
    },
    {
      ask: 'Où est Pompon ?',
      answer: '🪑 sur le banc',
      wrong: ['🌳 dans un arbre', '🛏️ dans le lit'],
      proof: 'assis sur le banc',
    },
  ],
};
