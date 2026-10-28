import type { Story } from './index';

// D'après le conte des frères Grimm (1812), sans ce que le dessin animé y a ajouté : les nains
// n'ont pas de nom, et Blanche-Neige se réveille quand le morceau de pomme sort de sa gorge.
export const blancheNeige: Story = {
  id: 'blanche-neige',
  title: 'Blanche-Neige',
  icon: '🍎',
  level: 4,
  source: 'conte des frères Grimm',
  text: [
    'Il était une fois une reine qui eut une petite fille à la peau blanche comme la neige, aux lèvres rouges comme le sang et aux cheveux noirs comme l’ébène. On l’appela Blanche-Neige. Hélas, la reine mourut, et le roi épousa une autre femme, très belle mais très orgueilleuse.',
    'La nouvelle reine possédait un miroir magique. Chaque matin, elle lui demandait : « Miroir, petit miroir, qui est la plus belle de tout le pays ? » Et le miroir répondait : « C’est vous, ma reine. » Mais quand Blanche-Neige eut sept ans, le miroir répondit : « C’est Blanche-Neige, maintenant. »',
    'Folle de jalousie, la reine ordonna à un chasseur d’emmener l’enfant dans la forêt et de la faire disparaître. Mais le chasseur eut pitié d’elle : il la laissa s’enfuir.',
    'Blanche-Neige courut longtemps entre les arbres. Le soir, elle découvrit une petite maison où tout était minuscule : sept petites assiettes, sept petits verres et sept petits lits. Épuisée, elle s’endormit. C’était la maison de sept nains qui travaillaient dans la montagne. En rentrant, ils trouvèrent Blanche-Neige et décidèrent de la garder avec eux. « Méfie-toi de la reine, lui dirent-ils, et n’ouvre à personne. »',
    'Mais le miroir apprit à la reine que Blanche-Neige était vivante. La reine se déguisa en vieille marchande et prépara une pomme empoisonnée. Elle frappa à la fenêtre des nains et offrit la pomme à Blanche-Neige. La jeune fille en croqua un morceau et tomba sur le sol, comme morte.',
    'Les nains, très tristes, la placèrent dans un cercueil de verre, au sommet d’une colline. Un jour, un prince passa par là et demanda à emporter le cercueil dans son château. En le portant, ses serviteurs trébuchèrent sur une racine : le morceau de pomme sortit de la gorge de Blanche-Neige, et elle ouvrit les yeux. Le prince lui demanda de l’épouser, et on fit une grande fête.',
  ],
  // Dans l’ordre de l’histoire.
  events: [
    {
      text: 'La reine demande à son miroir qui est la plus belle.',
      proof: 'Chaque matin, elle lui demandait',
    },
    { text: 'Le chasseur laisse Blanche-Neige s’enfuir.', proof: 'il la laissa s’enfuir' },
    {
      text: 'Blanche-Neige découvre une petite maison.',
      proof: 'elle découvrit une petite maison',
    },
    { text: 'Les nains décident de garder Blanche-Neige.', proof: 'décidèrent de la garder' },
    { text: 'La reine se déguise en vieille marchande.', proof: 'se déguisa en vieille marchande' },
    { text: 'Blanche-Neige croque la pomme empoisonnée.', proof: 'en croqua un morceau' },
    { text: 'Un prince veut emporter le cercueil.', proof: 'Un jour, un prince passa' },
    { text: 'Blanche-Neige ouvre les yeux.', proof: 'elle ouvrit les yeux' },
  ],
  questions: [
    {
      ask: 'Pourquoi l’appelle-t-on Blanche-Neige ?',
      answer: 'Sa peau est blanche comme la neige.',
      wrong: ['Elle porte toujours une robe blanche.', 'Elle habite dans une montagne enneigée.'],
      proof: 'peau blanche comme la neige',
      why: true,
    },
    {
      ask: 'Que demande la reine à son miroir, chaque matin ?',
      answer: 'Qui est la plus belle du pays ?',
      wrong: ['Où se cache Blanche-Neige ?', 'Quel temps fera-t-il demain ?'],
      proof: 'qui est la plus belle de tout le pays',
    },
    {
      ask: 'Pourquoi la reine veut-elle faire disparaître Blanche-Neige ?',
      answer: 'Elle est jalouse de sa beauté.',
      wrong: ['Blanche-Neige a cassé son miroir.', 'Blanche-Neige ne veut pas lui obéir.'],
      proof: 'Folle de jalousie',
      why: true,
    },
    {
      ask: 'Qu’est-ce qui se passe en premier dans l’histoire ?',
      answer: 'Le chasseur emmène Blanche-Neige dans la forêt.',
      wrong: [
        'La reine prépare une pomme empoisonnée.',
        'Les nains placent Blanche-Neige dans un cercueil de verre.',
      ],
      proof: 'ordonna à un chasseur',
    },
    {
      ask: 'Que fait le chasseur ?',
      answer: 'Il laisse Blanche-Neige s’enfuir.',
      wrong: ['Il ramène Blanche-Neige au château.', 'Il cache Blanche-Neige chez lui.'],
      proof: 'il la laissa s’enfuir',
    },
    {
      ask: 'Dans l’histoire, que veut dire « épuisée » ?',
      answer: 'très fatiguée',
      wrong: ['très contente', 'très affamée'],
      proof: 'Épuisée, elle s’endormit',
    },
    {
      claim: 'Les nains travaillent dans la montagne.',
      truth: true,
      proof: 'qui travaillaient dans la montagne',
    },
    {
      ask: 'Comment la reine se déguise-t-elle ?',
      answer: 'en vieille marchande',
      wrong: ['en chasseur', 'en princesse'],
      proof: 'se déguisa en vieille marchande',
    },
    {
      ask: 'Que se passe-t-il juste après que Blanche-Neige a croqué la pomme ?',
      answer: 'Elle tombe sur le sol, comme morte.',
      wrong: ['Le prince arrive.', 'Elle rentre au château.'],
      proof: 'tomba sur le sol, comme morte',
    },
    {
      ask: 'Comment Blanche-Neige se réveille-t-elle ?',
      answer: 'Les serviteurs trébuchent, et le morceau de pomme sort de sa gorge.',
      wrong: ['Le prince lui donne un baiser.', 'Les nains lui font boire une potion.'],
      proof: 'trébuchèrent sur une racine',
    },
  ],
};
