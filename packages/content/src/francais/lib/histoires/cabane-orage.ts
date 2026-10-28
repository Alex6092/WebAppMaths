import type { Story } from './index';

export const cabaneOrage: Story = {
  id: 'cabane-orage',
  title: 'La cabane et l’orage',
  icon: '⛈️',
  level: 3,
  source: 'histoire inventée pour le Cartable',
  text: [
    'Pendant les vacances chez leurs grands-parents, Jules et sa cousine Lina construisent une cabane au fond du jardin. Ils utilisent de vieilles planches, une couverture pour le toit et des coussins pour s’asseoir. Ils l’appellent « le Repaire des Écureuils ».',
    'Un après-midi, ils y apportent des biscuits et un jeu de cartes. Le ciel devient tout gris, mais ils sont trop occupés pour le remarquer. Soudain, un grand coup de tonnerre les fait sursauter, et la pluie se met à tomber très fort.',
    'L’eau traverse la couverture et coule sur les coussins. Lina a peur. Jules lui prend la main et compte les secondes entre l’éclair et le tonnerre, comme son grand-père le lui a appris : plus on compte loin, plus l’orage est loin. Un, deux, trois… sept, huit ! L’orage s’éloigne.',
    'Quelques minutes plus tard, Grand-mère arrive sous un grand parapluie. Elle les ramène à la maison et leur prépare un chocolat chaud. Le lendemain, Jules et Lina réparent leur cabane avec une bâche bien solide. Cette fois, la pluie peut tomber : le Repaire des Écureuils restera au sec !',
  ],
  // Dans l’ordre de l’histoire.
  events: [
    { text: 'Jules et Lina construisent une cabane.', proof: 'construisent une cabane' },
    { text: 'Ils apportent des biscuits et un jeu de cartes.', proof: 'apportent des biscuits' },
    { text: 'Un coup de tonnerre les fait sursauter.', proof: 'grand coup de tonnerre' },
    {
      text: 'Jules compte les secondes entre l’éclair et le tonnerre.',
      proof: 'compte les secondes',
    },
    { text: 'Grand-mère arrive avec un parapluie.', proof: 'Grand-mère arrive' },
    { text: 'Ils réparent la cabane avec une bâche.', proof: 'réparent leur cabane' },
  ],
  questions: [
    {
      ask: 'Chez qui Jules et Lina passent-ils les vacances ?',
      answer: 'chez leurs grands-parents',
      wrong: ['chez des amis', 'au camping'],
      proof: 'chez leurs grands-parents',
    },
    {
      ask: 'Avec quoi font-ils le toit de la cabane ?',
      answer: 'avec une couverture',
      wrong: ['avec des feuilles', 'avec des tuiles'],
      proof: 'une couverture pour le toit',
    },
    {
      ask: 'Comment s’appelle la cabane ?',
      answer: 'le Repaire des Écureuils',
      wrong: ['le Château des Lapins', 'la Maison des Oiseaux'],
      proof: 'Ils l’appellent',
    },
    {
      ask: 'Pourquoi ne voient-ils pas l’orage arriver ?',
      answer: 'Ils sont trop occupés à jouer.',
      wrong: ['Ils dorment.', 'Il fait nuit.'],
      proof: 'trop occupés pour le remarquer',
      why: true,
    },
    {
      ask: 'Pourquoi Jules prend-il la main de Lina ?',
      answer: 'Pour la rassurer, parce qu’elle a peur.',
      wrong: ['Pour courir à la maison.', 'Pour jouer aux cartes.'],
      proof: 'Jules lui prend la main',
      why: true,
    },
    {
      ask: 'Comment Jules sait-il que l’orage s’éloigne ?',
      answer: 'Il compte entre l’éclair et le tonnerre.',
      wrong: ['Il écoute la radio.', 'Il regarde les nuages.'],
      proof: 'plus on compte loin',
    },
    {
      ask: 'Qui vient les chercher ?',
      answer: 'leur grand-mère',
      wrong: ['leur grand-père', 'leurs parents'],
      proof: 'Grand-mère arrive',
    },
    {
      claim: 'Le lendemain, ils abandonnent leur cabane.',
      truth: false,
      proof: 'réparent leur cabane',
    },
  ],
};
