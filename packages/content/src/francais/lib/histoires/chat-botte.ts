import type { Story } from './index';

export const chatBotte: Story = {
  id: 'chat-botte',
  title: 'Le Chat botté',
  icon: '🐈',
  level: 4,
  source: 'conte de Charles Perrault',
  text: [
    'Un meunier, en mourant, laissa à ses trois fils tout ce qu’il possédait. L’aîné reçut le moulin, le deuxième l’âne, et le plus jeune… seulement le chat. « Que vais-je faire d’un chat ? » soupira le pauvre garçon.',
    'Mais le chat lui dit : « Ne vous inquiétez pas, mon maître. Donnez-moi un sac et une paire de bottes, et vous verrez que je vous rendrai riche. » Le garçon, étonné d’entendre parler un chat, lui donna ce qu’il demandait.',
    'Le chat, très rusé, attrapa un lapin dans son sac et l’apporta au roi : « Sire, voici un cadeau de mon maître, le marquis de Carabas. » C’était un nom inventé ! Pendant des semaines, il offrit ainsi du gibier au roi, qui finit par se demander qui était ce généreux marquis.',
    'Un jour, le chat apprit que le roi et sa fille se promèneraient au bord de la rivière. « Baignez-vous dans la rivière, dit-il à son maître, et laissez-moi faire. » Quand le carrosse passa, le chat se mit à crier : « Au secours ! Des voleurs ont pris les habits du marquis de Carabas ! » Le roi fit aussitôt apporter de magnifiques vêtements, et le jeune homme, bien habillé, monta dans le carrosse.',
    'Le chat courut devant. Il arriva au château d’un ogre terrible, à qui appartenaient toutes les terres du pays. « On dit que vous pouvez vous changer en n’importe quel animal, dit le chat. Mais je parie que vous ne pouvez pas devenir une toute petite souris ! » Vexé, l’ogre se transforma aussitôt en souris… et le chat la mangea d’une bouchée.',
    'Quand le carrosse arriva, le chat accueillit le roi : « Bienvenue au château de mon maître, le marquis de Carabas ! » Le roi, émerveillé, donna sa fille en mariage au jeune homme. Et le chat devint un grand seigneur, qui ne courut plus après les souris que pour s’amuser.',
  ],
  // Dans l’ordre de l’histoire.
  events: [
    { text: 'Le plus jeune fils reçoit le chat.', proof: 'seulement le chat' },
    { text: 'Le chat demande un sac et des bottes.', proof: 'Donnez-moi un sac' },
    { text: 'Le chat apporte un lapin au roi.', proof: 'attrapa un lapin' },
    {
      text: 'Le chat dit à son maître de se baigner dans la rivière.',
      proof: 'Baignez-vous dans la rivière',
    },
    {
      text: 'Le chat crie que des voleurs ont pris les habits du marquis.',
      proof: 'Des voleurs ont pris',
    },
    { text: 'L’ogre se transforme en souris.', proof: 'l’ogre se transforma aussitôt' },
    {
      text: 'Le roi donne sa fille en mariage au jeune homme.',
      proof: 'donna sa fille en mariage',
    },
  ],
  questions: [
    {
      ask: 'Qu’est-ce que le plus jeune fils reçoit de son père ?',
      answer: 'le chat',
      wrong: ['le moulin', 'l’âne'],
      proof: 'seulement le chat',
    },
    {
      ask: 'Que demande le chat à son maître ?',
      answer: 'un sac et une paire de bottes',
      wrong: ['un chapeau et une épée', 'un carrosse et des chevaux'],
      proof: 'un sac et une paire de bottes',
    },
    {
      ask: 'Dans l’histoire, que veut dire « rusé » ?',
      answer: 'malin, qui sait tromper les autres',
      wrong: ['très fort', 'très paresseux'],
      proof: 'Le chat, très rusé',
    },
    {
      claim: 'Le marquis de Carabas est le vrai nom du jeune homme.',
      truth: false,
      proof: 'C’était un nom inventé',
    },
    {
      ask: 'Pourquoi le chat offre-t-il du gibier au roi ?',
      answer: 'Pour que le roi croie que son maître est un riche marquis.',
      wrong: ['Parce que le roi a faim.', 'Pour devenir le chat du roi.'],
      proof: 'qui finit par se demander',
      why: true,
    },
    {
      ask: 'Pourquoi le chat crie-t-il que les habits du marquis ont été volés ?',
      answer: 'Pour que le roi donne de beaux vêtements à son maître.',
      wrong: ['Parce que des voleurs sont vraiment là.', 'Pour faire peur à la princesse.'],
      proof: 'fit aussitôt apporter de magnifiques vêtements',
      why: true,
    },
    {
      ask: 'Que veut dire « vexé » ?',
      answer: 'fâché qu’on doute de lui',
      wrong: ['très content', 'très fatigué'],
      proof: 'Vexé, l’ogre se transforma',
    },
    {
      ask: 'En quel animal l’ogre se transforme-t-il ?',
      answer: 'en souris',
      wrong: ['en lion', 'en chat'],
      proof: 'aussitôt en souris',
    },
    {
      ask: 'Qu’est-ce qui se passe en dernier dans l’histoire ?',
      answer: 'Le roi donne sa fille en mariage au jeune homme.',
      wrong: ['Le chat offre un lapin au roi.', 'Le jeune homme se baigne dans la rivière.'],
      proof: 'donna sa fille en mariage',
    },
  ],
};
