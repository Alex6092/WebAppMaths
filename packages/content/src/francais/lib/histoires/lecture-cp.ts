import type { Story } from './index';

// Les petits textes de la Lecture au CP (niveau 0) : des phrases courtes, des mots simples à
// déchiffrer, des réponses en images. Ils ne s'écoutent pas : l'enfant les lit seul.

export const chatLeo: Story = {
  id: 'chat-leo',
  title: 'Le chat de Léo',
  icon: '🐱',
  level: 0,
  source: 'texte inventé pour le Cartable',
  text: [
    'Léo a un petit chat gris. Il s’appelle Moka. Moka aime jouer avec une balle rouge.',
    'Le matin, il boit du lait dans un bol bleu. Le soir, il dort sur le lit de Léo.',
  ],
  questions: [
    {
      ask: 'Comment s’appelle le chat ?',
      answer: '🐱 Moka',
      wrong: ['🐱 Pompon', '🐱 Caramel'],
      proof: 'Il s’appelle Moka',
    },
    {
      ask: 'Avec quoi Moka aime-t-il jouer ?',
      answer: '⚽ une balle',
      wrong: ['🧶 une pelote', '🐭 une souris'],
      proof: 'une balle rouge',
    },
    {
      ask: 'Que boit Moka le matin ?',
      answer: '🥛 du lait',
      wrong: ['💧 de l’eau', '🧃 du jus'],
      proof: 'il boit du lait',
    },
    {
      ask: 'De quelle couleur est le bol ?',
      answer: '🔵 bleu',
      wrong: ['🔴 rouge', '🟡 jaune'],
      proof: 'un bol bleu',
    },
    {
      ask: 'Où dort Moka le soir ?',
      answer: '🛏️ sur le lit de Léo',
      wrong: ['🧺 dans un panier', '🛋️ sur le canapé'],
      proof: 'il dort sur le lit',
    },
  ],
};

export const plage: Story = {
  id: 'plage',
  title: 'À la plage',
  icon: '🏖️',
  level: 0,
  source: 'texte inventé pour le Cartable',
  text: [
    'C’est l’été. Zoé va à la plage avec sa maman. Elle fait un château de sable.',
    'Une vague arrive et casse le château ! Zoé rit. Elle va nager dans la mer. Puis elle mange une glace à la fraise.',
  ],
  questions: [
    {
      ask: 'Quelle saison est-ce ?',
      answer: '☀️ l’été',
      wrong: ['❄️ l’hiver', '🍂 l’automne'],
      proof: 'C’est l’été',
    },
    {
      ask: 'Avec qui Zoé va-t-elle à la plage ?',
      answer: '👩 avec sa maman',
      wrong: ['👨 avec son papa', '👵 avec sa mamie'],
      proof: 'avec sa maman',
    },
    {
      ask: 'Que fait Zoé avec le sable ?',
      answer: '🏰 un château',
      wrong: ['🐢 une tortue', '🚗 une voiture'],
      proof: 'un château de sable',
    },
    {
      ask: 'Qu’est-ce qui casse le château ?',
      answer: '🌊 une vague',
      wrong: ['🐕 un chien', '👦 un garçon'],
      proof: 'Une vague arrive',
    },
    {
      ask: 'Que fait Zoé quand le château est cassé ?',
      answer: '😀 elle rit',
      wrong: ['😢 elle pleure', '😠 elle crie'],
      proof: 'Zoé rit',
    },
    {
      ask: 'Quelle glace mange Zoé ?',
      answer: '🍓 à la fraise',
      wrong: ['🍫 au chocolat', '🍋 au citron'],
      proof: 'une glace à la fraise',
    },
  ],
};

export const potager: Story = {
  id: 'potager',
  title: 'Le potager de Papi',
  icon: '🥕',
  level: 0,
  source: 'texte inventé pour le Cartable',
  text: [
    'Papi a un potager. Avec Sami, il plante des graines de carottes. Sami arrose les graines tous les jours.',
    'Un mois plus tard, de petites feuilles vertes sortent de la terre. En été, Sami tire sur les feuilles : voilà une grosse carotte orange !',
  ],
  questions: [
    {
      ask: 'Qui a un potager ?',
      answer: '👴 Papi',
      wrong: ['👩 Maman', '👧 Lina'],
      proof: 'Papi a un potager',
    },
    {
      ask: 'Que plantent-ils ?',
      answer: '🥕 des carottes',
      wrong: ['🍅 des tomates', '🥔 des pommes de terre'],
      proof: 'des graines de carottes',
    },
    {
      ask: 'Que fait Sami tous les jours ?',
      answer: '💧 il arrose',
      wrong: ['✂️ il coupe', '🎨 il peint'],
      proof: 'Sami arrose les graines',
    },
    {
      ask: 'Qu’est-ce qui sort de la terre ?',
      answer: '🌱 des feuilles vertes',
      wrong: ['🌸 des fleurs', '🐛 des vers'],
      proof: 'de petites feuilles vertes',
    },
    {
      ask: 'Quand Sami ramasse-t-il la carotte ?',
      answer: '☀️ en été',
      wrong: ['❄️ en hiver', '🌧️ un jour de pluie'],
      proof: 'En été',
    },
  ],
};

export const piqueNique: Story = {
  id: 'pique-nique',
  title: 'Le pique-nique',
  icon: '🧺',
  level: 0,
  source: 'texte inventé pour le Cartable',
  text: [
    'Dimanche, la famille de Nour fait un pique-nique au bord de la rivière. Papa pose une nappe sur l’herbe. Il y a des sandwichs, des pommes et un gâteau.',
    'Soudain, des fourmis montent sur la nappe ! Nour crie, puis tout le monde rit.',
  ],
  questions: [
    {
      ask: 'Quel jour est le pique-nique ?',
      answer: '📅 dimanche',
      wrong: ['📅 samedi', '📅 lundi'],
      proof: 'Dimanche, la famille',
    },
    {
      ask: 'Où fait-on le pique-nique ?',
      answer: '🏞️ au bord de la rivière',
      wrong: ['🏖️ à la plage', '🏔️ à la montagne'],
      proof: 'au bord de la rivière',
    },
    {
      ask: 'Qui pose la nappe ?',
      answer: '👨 papa',
      wrong: ['👩 maman', '👧 Nour'],
      proof: 'Papa pose une nappe',
    },
    {
      ask: 'Quel fruit mangent-ils ?',
      answer: '🍎 des pommes',
      wrong: ['🍌 des bananes', '🍇 du raisin'],
      proof: 'des pommes et un gâteau',
    },
    {
      ask: 'Quels animaux montent sur la nappe ?',
      answer: '🐜 des fourmis',
      wrong: ['🐝 des abeilles', '🐌 des escargots'],
      proof: 'des fourmis montent',
    },
  ],
};

export const veloRouge: Story = {
  id: 'velo-rouge',
  title: 'Le vélo rouge',
  icon: '🚲',
  level: 0,
  source: 'texte inventé pour le Cartable',
  text: [
    'Pour son anniversaire, Hugo reçoit un vélo rouge. Il ne sait pas encore rouler sans les petites roues.',
    'Sa sœur tient la selle et court à côté de lui. Hugo pédale, pédale… Sa sœur lâche la selle. Hugo roule tout seul ! Il est très fier.',
  ],
  questions: [
    {
      ask: 'Quand Hugo reçoit-il son vélo ?',
      answer: '🎂 pour son anniversaire',
      wrong: ['🎄 à Noël', '🏫 à l’école'],
      proof: 'Pour son anniversaire',
    },
    {
      ask: 'De quelle couleur est le vélo ?',
      answer: '🔴 rouge',
      wrong: ['🔵 bleu', '🟢 vert'],
      proof: 'un vélo rouge',
    },
    {
      ask: 'Qui aide Hugo ?',
      answer: '👧 sa sœur',
      wrong: ['👨 son papa', '👦 son copain'],
      proof: 'Sa sœur tient la selle',
    },
    {
      ask: 'Que fait Hugo à la fin ?',
      answer: '🚲 il roule tout seul',
      wrong: ['🤕 il tombe', '😢 il pleure'],
      proof: 'Hugo roule tout seul',
    },
    {
      ask: 'Comment se sent Hugo ?',
      answer: '😃 fier',
      wrong: ['😢 triste', '😨 effrayé'],
      proof: 'Il est très fier',
    },
  ],
};

export const zoo: Story = {
  id: 'zoo',
  title: 'La sortie au zoo',
  icon: '🦒',
  level: 0,
  source: 'texte inventé pour le Cartable',
  text: [
    'La classe de Manon va au zoo en car. D’abord, les enfants voient une girafe qui mange des feuilles tout en haut d’un arbre. Ensuite, ils regardent les singes qui sautent partout.',
    'À midi, ils mangent près du bassin des phoques. Manon préfère les singes : ils sont si drôles !',
  ],
  questions: [
    {
      ask: 'Comment la classe va-t-elle au zoo ?',
      answer: '🚌 en car',
      wrong: ['🚆 en train', '🚶 à pied'],
      proof: 'va au zoo en car',
    },
    {
      ask: 'Quel animal mange des feuilles ?',
      answer: '🦒 la girafe',
      wrong: ['🐒 le singe', '🦭 le phoque'],
      proof: 'une girafe qui mange des feuilles',
    },
    {
      ask: 'Que font les singes ?',
      answer: '🤸 ils sautent',
      wrong: ['😴 ils dorment', '🏊 ils nagent'],
      proof: 'les singes qui sautent partout',
    },
    {
      ask: 'Où mangent les enfants à midi ?',
      answer: '🦭 près des phoques',
      wrong: ['🦁 près des lions', '🐘 près des éléphants'],
      proof: 'près du bassin des phoques',
    },
    {
      ask: 'Quels animaux Manon préfère-t-elle ?',
      answer: '🐒 les singes',
      wrong: ['🦒 les girafes', '🦭 les phoques'],
      proof: 'Manon préfère les singes',
    },
  ],
};
