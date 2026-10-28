import type { EnglishStory } from './index';

// CE1 : des histoires très courtes, des phrases simples, les mots des thèmes de vocabulaire.

export const tomDog: EnglishStory = {
  id: 'tom-dog',
  title: 'Tom and Rex',
  icon: '🐕',
  level: 1,
  source: 'histoire inventée pour le Cartable',
  text: [
    'Hello! My name is Tom. I am seven. I have a dog. His name is Rex.',
    'Rex is brown and white. He likes balls. On Saturday, we play in the park. Rex is happy!',
  ],
  translation: [
    'Bonjour ! Je m’appelle Tom. J’ai sept ans. J’ai un chien. Il s’appelle Rex.',
    'Rex est marron et blanc. Il aime les balles. Le samedi, nous jouons au parc. Rex est content !',
  ],
  questions: [
    {
      ask: 'Comment s’appelle le garçon ?',
      answer: '👦 Tom',
      wrong: ['👦 Max', '👦 Sam'],
      proof: 'My name is Tom',
    },
    {
      ask: 'Quel âge a Tom ?',
      answer: '🔢 sept ans',
      wrong: ['🔢 six ans', '🔢 neuf ans'],
      proof: 'I am seven',
    },
    {
      ask: 'Quel animal a Tom ?',
      answer: '🐕 un chien',
      wrong: ['🐈 un chat', '🐇 un lapin'],
      proof: 'I have a dog',
    },
    {
      ask: 'De quelles couleurs est Rex ?',
      answer: '🤎 marron et blanc',
      wrong: ['🖤 noir et blanc', '💛 jaune et blanc'],
      proof: 'Rex is brown and white',
    },
    {
      ask: 'Qu’est-ce que Rex aime ?',
      answer: '⚽ les balles',
      wrong: ['🦴 les os', '🐈 les chats'],
      proof: 'He likes balls',
    },
    {
      ask: 'Quel jour jouent-ils au parc ?',
      answer: '📅 le samedi',
      wrong: ['📅 le lundi', '📅 le mercredi'],
      proof: 'On Saturday',
    },
  ],
};

export const littleCat: EnglishStory = {
  id: 'little-cat',
  title: 'The little cat',
  icon: '🐈',
  level: 1,
  source: 'histoire inventée pour le Cartable',
  text: [
    'Look! It is a little cat. It is grey. It is in the garden.',
    'The cat sees a bird. The bird is blue. The cat jumps, but the bird flies away. Now the cat is sad. Come here, little cat!',
  ],
  translation: [
    'Regarde ! C’est un petit chat. Il est gris. Il est dans le jardin.',
    'Le chat voit un oiseau. L’oiseau est bleu. Le chat saute, mais l’oiseau s’envole. Maintenant, le chat est triste. Viens ici, petit chat !',
  ],
  questions: [
    {
      ask: 'De quelle couleur est le chat ?',
      answer: '🩶 gris',
      wrong: ['🖤 noir', '🤍 blanc'],
      proof: 'It is grey',
    },
    {
      ask: 'Où est le chat ?',
      answer: '🌳 dans le jardin',
      wrong: ['🏠 dans la maison', '🛏️ sur le lit'],
      proof: 'in the garden',
    },
    {
      ask: 'Que voit le chat ?',
      answer: '🐦 un oiseau',
      wrong: ['🐁 une souris', '🐟 un poisson'],
      proof: 'The cat sees a bird',
    },
    {
      ask: 'De quelle couleur est l’oiseau ?',
      answer: '💙 bleu',
      wrong: ['❤️ rouge', '💛 jaune'],
      proof: 'The bird is blue',
    },
    {
      ask: 'Que fait l’oiseau quand le chat saute ?',
      answer: '🕊️ il s’envole',
      wrong: ['😴 il dort', '🎵 il chante'],
      proof: 'flies away',
    },
    {
      ask: 'Comment se sent le chat à la fin ?',
      answer: '😢 triste',
      wrong: ['😀 content', '😠 fâché'],
      proof: 'the cat is sad',
    },
  ],
};

export const birthday: EnglishStory = {
  id: 'birthday',
  title: 'Happy birthday, Lucy!',
  icon: '🎂',
  level: 1,
  source: 'histoire inventée pour le Cartable',
  text: [
    'Today is Sunday. Happy birthday, Lucy! She is eight.',
    'Grandma and Grandpa are here. Lucy has a big cake. It is pink. Her present is a rabbit. Thank you, Grandma!',
  ],
  translation: [
    'Aujourd’hui, c’est dimanche. Joyeux anniversaire, Lucy ! Elle a huit ans.',
    'Mamie et Papi sont là. Lucy a un gros gâteau. Il est rose. Son cadeau, c’est un lapin. Merci, Mamie !',
  ],
  questions: [
    {
      ask: 'Quel jour est l’anniversaire ?',
      answer: '📅 dimanche',
      wrong: ['📅 vendredi', '📅 mardi'],
      proof: 'Today is Sunday',
    },
    {
      ask: 'Quel âge a Lucy ?',
      answer: '🔢 huit ans',
      wrong: ['🔢 cinq ans', '🔢 dix ans'],
      proof: 'She is eight',
    },
    {
      ask: 'Qui vient chez Lucy ?',
      answer: '👵 Mamie et Papi',
      wrong: ['👦 son frère', '👧 sa sœur'],
      proof: 'Grandma and Grandpa are here',
    },
    {
      ask: 'De quelle couleur est le gâteau ?',
      answer: '🩷 rose',
      wrong: ['💚 vert', '🤎 marron'],
      proof: 'It is pink',
    },
    {
      ask: 'Quel cadeau Lucy reçoit-elle ?',
      answer: '🐇 un lapin',
      wrong: ['🐕 un chien', '🐟 un poisson'],
      proof: 'Her present is a rabbit',
    },
    {
      ask: 'Que dit Lucy à Mamie ?',
      answer: '🎁 Merci !',
      wrong: ['👋 Bonjour !', '🌙 Bonne nuit !'],
      proof: 'Thank you, Grandma',
    },
  ],
};

export const farm: EnglishStory = {
  id: 'farm',
  title: 'On the farm',
  icon: '🐄',
  level: 1,
  source: 'histoire inventée pour le Cartable',
  text: [
    'Sam and his sister Emma are on the farm. They see a big brown horse and three pigs.',
    'The pigs are pink and very dirty! Emma likes the ducks. They are white and yellow. Sam gives an apple to the horse. Yum!',
  ],
  translation: [
    'Sam et sa sœur Emma sont à la ferme. Ils voient un grand cheval marron et trois cochons.',
    'Les cochons sont roses et très sales ! Emma aime les canards. Ils sont blancs et jaunes. Sam donne une pomme au cheval. Miam !',
  ],
  questions: [
    {
      ask: 'Où sont Sam et Emma ?',
      answer: '🚜 à la ferme',
      wrong: ['🏖️ à la plage', '🏫 à l’école'],
      proof: 'are on the farm',
    },
    {
      ask: 'Qui est Emma ?',
      answer: '👧 la sœur de Sam',
      wrong: ['👩 la maman de Sam', '👵 la mamie de Sam'],
      proof: 'his sister Emma',
    },
    {
      ask: 'De quelle couleur est le cheval ?',
      answer: '🤎 marron',
      wrong: ['🖤 noir', '🤍 blanc'],
      proof: 'big brown horse',
    },
    {
      ask: 'Combien de cochons voient-ils ?',
      answer: '🔢 trois',
      wrong: ['🔢 deux', '🔢 cinq'],
      proof: 'three pigs',
    },
    {
      ask: 'Quels animaux Emma aime-t-elle ?',
      answer: '🦆 les canards',
      wrong: ['🐖 les cochons', '🐄 les vaches'],
      proof: 'Emma likes the ducks',
    },
    {
      ask: 'Que donne Sam au cheval ?',
      answer: '🍎 une pomme',
      wrong: ['🥕 une carotte', '🍞 du pain'],
      proof: 'gives an apple',
    },
  ],
};

export const monkey: EnglishStory = {
  id: 'monkey',
  title: 'Coco the monkey',
  icon: '🐒',
  level: 1,
  source: 'histoire inventée pour le Cartable',
  text: [
    'At the zoo, there is a little monkey. His name is Coco. He is brown, and he has a long tail.',
    'Every day, Coco eats bananas. On Monday, he takes the hat of a little boy! The boy says: Please, Coco! Coco gives the hat back. Thank you, Coco!',
  ],
  translation: [
    'Au zoo, il y a un petit singe. Il s’appelle Coco. Il est marron, et il a une longue queue.',
    'Tous les jours, Coco mange des bananes. Lundi, il prend le chapeau d’un petit garçon ! Le garçon dit : « S’il te plaît, Coco ! » Coco rend le chapeau. Merci, Coco !',
  ],
  questions: [
    {
      ask: 'Où vit Coco ?',
      answer: '🦁 au zoo',
      wrong: ['🌳 dans la forêt', '🏠 dans une maison'],
      proof: 'At the zoo',
    },
    {
      ask: 'Quel animal est Coco ?',
      answer: '🐒 un singe',
      wrong: ['🐘 un éléphant', '🦁 un lion'],
      proof: 'a little monkey',
    },
    {
      ask: 'Que mange Coco tous les jours ?',
      answer: '🍌 des bananes',
      wrong: ['🍎 des pommes', '🥕 des carottes'],
      proof: 'Coco eats bananas',
    },
    {
      ask: 'Quel jour Coco prend-il le chapeau ?',
      answer: '📅 lundi',
      wrong: ['📅 jeudi', '📅 dimanche'],
      proof: 'On Monday',
    },
    {
      ask: 'Que prend Coco ?',
      answer: '👒 un chapeau',
      wrong: ['👟 une chaussure', '🎈 un ballon'],
      proof: 'he takes the hat',
    },
    {
      ask: 'Que dit le garçon ?',
      answer: '🙏 S’il te plaît !',
      wrong: ['👋 Au revoir !', '😔 Pardon !'],
      proof: 'The boy says',
    },
  ],
};

export const picnic: EnglishStory = {
  id: 'picnic',
  title: 'The picnic',
  icon: '🧺',
  level: 1,
  source: 'histoire inventée pour le Cartable',
  text: [
    'It is Wednesday. Dad, Mum, my baby brother and I go to the park for a picnic.',
    'We eat sandwiches and red apples. Dad has a green ball. Oh no! A big black dog takes our sandwiches! Mum laughs. Goodbye, dog!',
  ],
  translation: [
    'C’est mercredi. Papa, Maman, mon petit frère et moi allons au parc pour un pique-nique.',
    'Nous mangeons des sandwichs et des pommes rouges. Papa a un ballon vert. Oh non ! Un gros chien noir prend nos sandwichs ! Maman rit. Au revoir, le chien !',
  ],
  questions: [
    {
      ask: 'Quel jour est le pique-nique ?',
      answer: '📅 mercredi',
      wrong: ['📅 samedi', '📅 mardi'],
      proof: 'It is Wednesday',
    },
    {
      ask: 'Où va la famille ?',
      answer: '🌳 au parc',
      wrong: ['🏖️ à la plage', '🚜 à la ferme'],
      proof: 'go to the park',
    },
    {
      ask: 'De quelle couleur sont les pommes ?',
      answer: '❤️ rouges',
      wrong: ['💚 vertes', '💛 jaunes'],
      proof: 'red apples',
    },
    {
      ask: 'De quelle couleur est le ballon de Papa ?',
      answer: '💚 vert',
      wrong: ['💙 bleu', '🧡 orange'],
      proof: 'green ball',
    },
    {
      ask: 'Quel animal prend les sandwichs ?',
      answer: '🐕 un chien',
      wrong: ['🐈 un chat', '🐦 un oiseau'],
      proof: 'takes our sandwiches',
    },
    {
      ask: 'Que fait Maman ?',
      answer: '😀 elle rit',
      wrong: ['😢 elle pleure', '😠 elle crie'],
      proof: 'Mum laughs',
    },
  ],
};
