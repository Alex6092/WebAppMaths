import type { EnglishStory } from './index';

// CE2 : des histoires un peu plus longues, avec des dialogues et un « vrai ou faux ».

export const benTeddy: EnglishStory = {
  id: 'ben-teddy',
  title: 'Where is Teddy?',
  icon: '🧸',
  level: 2,
  source: 'histoire inventée pour le Cartable',
  text: [
    'It is Friday night. Ben is in bed, but he is not happy. Where is Teddy, his little brown bear?',
    'Ben looks under the bed. No Teddy! He looks in the bathroom. No Teddy! Mum and Dad look in the kitchen. No Teddy!',
    'Then his big sister Kate comes in. She has Teddy in her hands. He was in the garden, under the tree! Thank you, Kate! says Ben. Good night, Ben! Good night, Teddy!',
  ],
  translation: [
    'C’est vendredi soir. Ben est dans son lit, mais il n’est pas content. Où est Teddy, son petit ours marron ?',
    'Ben regarde sous le lit. Pas de Teddy ! Il regarde dans la salle de bain. Pas de Teddy ! Maman et Papa regardent dans la cuisine. Pas de Teddy !',
    'Alors, sa grande sœur Kate entre. Elle a Teddy dans les mains. Il était dans le jardin, sous l’arbre ! « Merci, Kate ! » dit Ben. Bonne nuit, Ben ! Bonne nuit, Teddy !',
  ],
  questions: [
    {
      ask: 'Quel jour est-ce ?',
      answer: '📅 vendredi',
      wrong: ['📅 lundi', '📅 dimanche'],
      proof: 'It is Friday night',
    },
    {
      claim: 'Au début, Ben est content.',
      truth: false,
      proof: 'he is not happy',
    },
    {
      ask: 'Qui est Teddy ?',
      answer: '🧸 un ours en peluche',
      wrong: ['🐇 un lapin', '🐕 un chien'],
      proof: 'his little brown bear',
    },
    {
      ask: 'Où Ben cherche-t-il d’abord ?',
      answer: '🛏️ sous le lit',
      wrong: ['🛁 dans la salle de bain', '🍳 dans la cuisine'],
      proof: 'Ben looks under the bed',
    },
    {
      ask: 'Qui cherche dans la cuisine ?',
      answer: '👩 Maman et Papa',
      wrong: ['👵 Mamie', '👦 un copain'],
      proof: 'look in the kitchen',
    },
    {
      ask: 'Qui trouve Teddy ?',
      answer: '👧 sa grande sœur',
      wrong: ['👦 son petit frère', '👨 Papa'],
      proof: 'his big sister Kate',
    },
    {
      ask: 'Où était Teddy ?',
      answer: '🌳 dans le jardin',
      wrong: ['🚗 dans la voiture', '🏫 à l’école'],
      proof: 'in the garden',
    },
  ],
};

export const dotDuck: EnglishStory = {
  id: 'dot-duck',
  title: 'Dot the duck',
  icon: '🦆',
  level: 2,
  source: 'histoire inventée pour le Cartable',
  text: [
    'On the farm, there is a little yellow duck. Her name is Dot. Dot has no friends, and she is sad.',
    'On Tuesday, she meets a pig. Hello! Can we play? asks Dot. No, says the pig. I am too dirty! On Wednesday, she meets a cow. No, says the cow. I am too big!',
    'On Thursday, Dot meets a green frog in the pond. Hello! says the frog. I like swimming. And you? Yes! says Dot. Now Dot and the frog swim together every day.',
  ],
  translation: [
    'À la ferme, il y a un petit canard jaune. Elle s’appelle Dot. Dot n’a pas d’amis, et elle est triste.',
    'Mardi, elle rencontre un cochon. « Bonjour ! On peut jouer ? » demande Dot. « Non, dit le cochon. Je suis trop sale ! » Mercredi, elle rencontre une vache. « Non, dit la vache. Je suis trop grosse ! »',
    'Jeudi, Dot rencontre une grenouille verte dans la mare. « Bonjour ! dit la grenouille. J’aime nager. Et toi ? » « Oui ! » dit Dot. Maintenant, Dot et la grenouille nagent ensemble tous les jours.',
  ],
  questions: [
    {
      ask: 'Quel animal est Dot ?',
      answer: '🦆 un canard',
      wrong: ['🐸 une grenouille', '🐖 un cochon'],
      proof: 'little yellow duck',
    },
    {
      ask: 'Pourquoi Dot est-elle triste ?',
      answer: '😔 Elle n’a pas d’amis.',
      wrong: ['🤕 Elle a mal.', '🌧️ Il pleut.'],
      proof: 'Dot has no friends',
    },
    {
      ask: 'Quel animal Dot rencontre-t-elle mardi ?',
      answer: '🐖 un cochon',
      wrong: ['🐄 une vache', '🐎 un cheval'],
      proof: 'On Tuesday',
    },
    {
      ask: 'Pourquoi la vache ne veut-elle pas jouer ?',
      answer: '🐘 Elle est trop grosse.',
      wrong: ['😴 Elle est fatiguée.', '🤒 Elle est malade.'],
      proof: 'I am too big',
    },
    {
      ask: 'Quel jour Dot rencontre-t-elle la grenouille ?',
      answer: '📅 jeudi',
      wrong: ['📅 mardi', '📅 samedi'],
      proof: 'On Thursday',
    },
    {
      ask: 'De quelle couleur est la grenouille ?',
      answer: '💚 verte',
      wrong: ['💛 jaune', '🤎 marron'],
      proof: 'a green frog',
    },
    {
      ask: 'Qu’est-ce que la grenouille aime faire ?',
      answer: '🏊 nager',
      wrong: ['🎨 dessiner', '😴 dormir'],
      proof: 'I like swimming',
    },
    {
      claim: 'À la fin, Dot et la grenouille nagent ensemble.',
      truth: true,
      proof: 'swim together',
    },
  ],
};

export const rainySaturday: EnglishStory = {
  id: 'rainy-saturday',
  title: 'A rainy Saturday',
  icon: '⛵',
  level: 2,
  source: 'histoire inventée pour le Cartable',
  text: [
    'It is Saturday, and it is raining. Lily and her brother Jack are at home with Grandpa. Jack is bored.',
    'Grandpa has an idea. Let us make a boat! he says. They make a little boat with wood. They paint it blue, and the sail is white.',
    'Then the sun comes out. They go to the pond and put the boat on the water. It floats! Two ducks swim next to it, and Jack is very happy.',
  ],
  translation: [
    'C’est samedi, et il pleut. Lily et son frère Jack sont à la maison avec Papi. Jack s’ennuie.',
    'Papi a une idée. « Fabriquons un bateau ! » dit-il. Ils fabriquent un petit bateau en bois. Ils le peignent en bleu, et la voile est blanche.',
    'Puis le soleil revient. Ils vont à la mare et posent le bateau sur l’eau. Il flotte ! Deux canards nagent à côté, et Jack est très content.',
  ],
  questions: [
    {
      ask: 'Quel temps fait-il au début ?',
      answer: '🌧️ Il pleut.',
      wrong: ['☀️ Il fait beau.', '❄️ Il neige.'],
      proof: 'it is raining',
    },
    {
      ask: 'Avec qui sont Lily et Jack ?',
      answer: '👴 avec Papi',
      wrong: ['👵 avec Mamie', '👩 avec Maman'],
      proof: 'at home with Grandpa',
    },
    {
      claim: 'Au début, Jack s’ennuie.',
      truth: true,
      proof: 'Jack is bored',
    },
    {
      ask: 'Que fabriquent-ils ?',
      answer: '⛵ un bateau',
      wrong: ['🏠 une cabane', '🚗 une voiture'],
      proof: 'make a little boat',
    },
    {
      ask: 'De quelle couleur est le bateau ?',
      answer: '💙 bleu',
      wrong: ['❤️ rouge', '💚 vert'],
      proof: 'They paint it blue',
    },
    {
      ask: 'Où vont-ils quand le soleil revient ?',
      answer: '🏞️ à la mare',
      wrong: ['🏖️ à la plage', '🌳 au parc'],
      proof: 'go to the pond',
    },
    {
      ask: 'Quels animaux nagent à côté du bateau ?',
      answer: '🦆 deux canards',
      wrong: ['🐟 deux poissons', '🐸 deux grenouilles'],
      proof: 'Two ducks',
    },
  ],
};

export const grandmaGarden: EnglishStory = {
  id: 'grandma-garden',
  title: 'In Grandma’s garden',
  icon: '🥕',
  level: 2,
  source: 'histoire inventée pour le Cartable',
  text: [
    'On Sunday, Sophie goes to see her grandma. Grandma has a big garden with flowers and vegetables.',
    'Look, Sophie! says Grandma. The carrots are ready! Sophie pulls the carrots. They are long and orange. In the garden, there is a brown rabbit too. He wants the carrots!',
    'Sophie gives one carrot to the rabbit. Then she and Grandma make a carrot cake. It is very good! Thank you, Grandma! says Sophie. Goodbye, Sophie! See you next Sunday!',
  ],
  translation: [
    'Le dimanche, Sophie va voir sa mamie. Mamie a un grand jardin avec des fleurs et des légumes.',
    '« Regarde, Sophie ! dit Mamie. Les carottes sont prêtes ! » Sophie tire les carottes. Elles sont longues et orange. Dans le jardin, il y a aussi un lapin marron. Il veut les carottes !',
    'Sophie donne une carotte au lapin. Puis, avec Mamie, elle fait un gâteau aux carottes. Il est très bon ! « Merci, Mamie ! » dit Sophie. Au revoir, Sophie ! À dimanche prochain !',
  ],
  questions: [
    {
      ask: 'Quel jour Sophie va-t-elle chez sa mamie ?',
      answer: '📅 le dimanche',
      wrong: ['📅 le mardi', '📅 le vendredi'],
      proof: 'On Sunday, Sophie goes',
    },
    {
      ask: 'Qu’est-ce qui est prêt dans le jardin ?',
      answer: '🥕 les carottes',
      wrong: ['🍅 les tomates', '🍓 les fraises'],
      proof: 'The carrots are ready',
    },
    {
      ask: 'De quelle couleur sont les carottes ?',
      answer: '🧡 orange',
      wrong: ['💜 violettes', '💛 jaunes'],
      proof: 'long and orange',
    },
    {
      ask: 'Quel animal veut les carottes ?',
      answer: '🐇 un lapin',
      wrong: ['🐁 une souris', '🐖 un cochon'],
      proof: 'a brown rabbit',
    },
    {
      ask: 'Que fait Sophie pour le lapin ?',
      answer: '🥕 Elle lui donne une carotte.',
      wrong: ['🏃 Elle le chasse.', '🏠 Elle l’emmène chez elle.'],
      proof: 'gives one carrot',
    },
    {
      ask: 'Que préparent Sophie et Mamie ?',
      answer: '🍰 un gâteau',
      wrong: ['🥣 une soupe', '🥗 une salade'],
      proof: 'make a carrot cake',
    },
    {
      claim: 'Le gâteau n’est pas bon.',
      truth: false,
      proof: 'It is very good',
    },
  ],
};

export const leoRobot: EnglishStory = {
  id: 'leo-robot',
  title: 'My robot Bip',
  icon: '🤖',
  level: 2,
  source: 'histoire inventée pour le Cartable',
  text: [
    'My name is Leo. I have a robot. His name is Bip. He is grey, with two big blue eyes and four little wheels.',
    'Bip can count to ten: one, two, three, four, five, six, seven, eight, nine, ten! He can say hello in English and in French. He can dance, too!',
    'But on Monday morning, Bip does not move. Oh no! Is he sick? No, Bip is just tired. Dad changes the batteries, and Bip says: Good morning, Leo!',
  ],
  translation: [
    'Je m’appelle Léo. J’ai un robot. Il s’appelle Bip. Il est gris, avec deux grands yeux bleus et quatre petites roues.',
    'Bip sait compter jusqu’à dix : un, deux, trois, quatre, cinq, six, sept, huit, neuf, dix ! Il sait dire bonjour en anglais et en français. Il sait aussi danser !',
    'Mais lundi matin, Bip ne bouge plus. Oh non ! Est-il malade ? Non, Bip est juste fatigué. Papa change les piles, et Bip dit : « Bonjour, Léo ! »',
  ],
  questions: [
    {
      ask: 'Comment s’appelle le robot ?',
      answer: '🤖 Bip',
      wrong: ['🤖 Bop', '🤖 Zip'],
      proof: 'His name is Bip',
    },
    {
      ask: 'De quelle couleur sont les yeux de Bip ?',
      answer: '💙 bleus',
      wrong: ['💚 verts', '❤️ rouges'],
      proof: 'two big blue eyes',
    },
    {
      ask: 'Combien de roues a Bip ?',
      answer: '🔢 quatre',
      wrong: ['🔢 deux', '🔢 trois'],
      proof: 'four little wheels',
    },
    {
      ask: 'Jusqu’à combien Bip sait-il compter ?',
      answer: '🔢 dix',
      wrong: ['🔢 cinq', '🔢 trois'],
      proof: 'Bip can count to ten',
    },
    {
      claim: 'Bip sait danser.',
      truth: true,
      proof: 'He can dance',
    },
    {
      ask: 'Quel jour Bip ne bouge-t-il plus ?',
      answer: '📅 lundi',
      wrong: ['📅 jeudi', '📅 samedi'],
      proof: 'on Monday morning',
    },
    {
      ask: 'Que fait Papa pour réparer Bip ?',
      answer: '🔋 Il change les piles.',
      wrong: ['🔧 Il change les roues.', '🎨 Il le repeint.'],
      proof: 'Dad changes the batteries',
    },
  ],
};

export const ellaElephant: EnglishStory = {
  id: 'ella-elephant',
  title: 'Ella the elephant',
  icon: '🐘',
  level: 2,
  source: 'histoire inventée pour le Cartable',
  text: [
    'Ella is a baby elephant. She lives in Africa with her mum, her grandma and her big brother. She is grey, and she has very big ears.',
    'Today, it is very hot. Ella is thirsty. Mum, I want water! she says. The family walks to the river, and Ella drinks and drinks.',
    'Then her brother has an idea. He puts water in his trunk and… splash! Ella is all wet. Ella laughs, and she splashes her brother too. What a fun day!',
  ],
  translation: [
    'Ella est un bébé éléphant. Elle vit en Afrique avec sa maman, sa mamie et son grand frère. Elle est grise, et elle a de très grandes oreilles.',
    'Aujourd’hui, il fait très chaud. Ella a soif. « Maman, je veux de l’eau ! » dit-elle. La famille marche jusqu’à la rivière, et Ella boit, et boit encore.',
    'Alors, son frère a une idée. Il met de l’eau dans sa trompe et… splash ! Ella est toute mouillée. Ella rit, et elle arrose son frère à son tour. Quelle journée amusante !',
  ],
  questions: [
    {
      ask: 'Qui est Ella ?',
      answer: '🐘 un bébé éléphant',
      wrong: ['🦁 un bébé lion', '🐒 un bébé singe'],
      proof: 'Ella is a baby elephant',
    },
    {
      ask: 'Où vit Ella ?',
      answer: '🌍 en Afrique',
      wrong: ['🏔️ à la montagne', '🏙️ en ville'],
      proof: 'She lives in Africa',
    },
    {
      ask: 'Qu’est-ce qu’Ella a de très grand ?',
      answer: '👂 les oreilles',
      wrong: ['🦶 les pieds', '👀 les yeux'],
      proof: 'very big ears',
    },
    {
      ask: 'Pourquoi Ella veut-elle de l’eau ?',
      answer: '🥵 Il fait chaud, elle a soif.',
      wrong: ['🛁 Elle veut prendre un bain.', '🌱 Elle veut arroser les fleurs.'],
      proof: 'Ella is thirsty',
    },
    {
      ask: 'Où va la famille ?',
      answer: '🏞️ à la rivière',
      wrong: ['🏖️ à la mer', '🏠 à la maison'],
      proof: 'walks to the river',
    },
    {
      ask: 'Qui arrose Ella ?',
      answer: '👦 son grand frère',
      wrong: ['👩 sa maman', '👵 sa mamie'],
      proof: 'He puts water in his trunk',
    },
    {
      claim: 'Ella se fâche contre son frère.',
      truth: false,
      proof: 'Ella laughs',
    },
  ],
};
