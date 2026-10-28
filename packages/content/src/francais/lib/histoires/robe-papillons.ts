import type { Story } from './index';

export const robePapillons: Story = {
  id: 'robe-papillons',
  title: 'La robe aux papillons',
  icon: '👗',
  level: 3,
  source: 'histoire inventée pour le Cartable',
  text: [
    'Margot adore dessiner des vêtements. Dans son carnet, il y a des robes à fleurs, des chapeaux à plumes et des bottes de toutes les couleurs. Un lundi, la maîtresse annonce une grande nouvelle : samedi, l’école organise un défilé de mode, et chaque élève pourra présenter un habit qu’il a créé.',
    'Margot choisit sa plus belle idée : une robe bleue comme la mer, avec un long ruban argenté. Toute la semaine, elle découpe, elle coud et elle essaie, avec l’aide de sa grand-mère, qui a une machine à coudre.',
    'Le samedi matin, catastrophe ! Au petit déjeuner, Margot renverse son bol de chocolat sur la robe. Une grosse tache marron apparaît juste au milieu. Margot a les larmes aux yeux : le défilé commence dans une heure.',
    'Sa grand-mère ouvre alors sa boîte à couture. « Et si on transformait cette tache en idée ? » propose-t-elle. Ensemble, elles découpent des papillons dans un tissu doré et les cousent sur la robe. Bientôt, on ne voit plus la tache, cachée sous les ailes brillantes.',
    'Au défilé, Margot marche sur l’estrade en souriant. Tout le monde applaudit la robe aux papillons. Le soir, dans son carnet, Margot dessine une nouvelle robe… avec des papillons, bien sûr.',
  ],
  // Dans l’ordre de l’histoire.
  events: [
    { text: 'La maîtresse annonce un défilé de mode.', proof: 'annonce une grande nouvelle' },
    { text: 'Margot coud une robe bleue avec sa grand-mère.', proof: 'elle découpe, elle coud' },
    { text: 'Margot renverse son chocolat sur la robe.', proof: 'renverse son bol' },
    {
      text: 'Margot et sa grand-mère cousent des papillons dorés.',
      proof: 'découpent des papillons',
    },
    { text: 'Tout le monde applaudit la robe au défilé.', proof: 'Tout le monde applaudit' },
    {
      text: 'Margot dessine une nouvelle robe dans son carnet.',
      proof: 'dessine une nouvelle robe',
    },
  ],
  questions: [
    {
      ask: 'Qu’est-ce que Margot adore faire ?',
      answer: '✏️ dessiner des vêtements',
      wrong: ['⚽ jouer au football', '🍰 faire des gâteaux'],
      proof: 'Margot adore dessiner des vêtements',
    },
    {
      ask: 'Quel jour a lieu le défilé ?',
      answer: 'samedi',
      wrong: ['lundi', 'dimanche'],
      proof: 'samedi, l’école organise',
    },
    {
      ask: 'De quelle couleur est la robe de Margot ?',
      answer: 'bleue',
      wrong: ['rose', 'verte'],
      proof: 'une robe bleue comme la mer',
    },
    {
      ask: 'Qui aide Margot à coudre sa robe ?',
      answer: 'sa grand-mère',
      wrong: ['sa maîtresse', 'son papa'],
      proof: 'avec l’aide de sa grand-mère',
    },
    {
      ask: 'Pourquoi Margot a-t-elle les larmes aux yeux ?',
      answer: 'Sa robe est tachée et le défilé commence bientôt.',
      wrong: [
        'Elle s’est piqué le doigt avec une aiguille.',
        'Elle a perdu son carnet de dessins.',
      ],
      proof: 'Margot a les larmes aux yeux',
      why: true,
    },
    {
      ask: 'Pourquoi coud-on des papillons sur la robe ?',
      answer: 'Pour cacher la tache.',
      wrong: ['Parce que Margot a froid.', 'Pour rendre la robe plus longue.'],
      proof: 'on ne voit plus la tache',
      why: true,
    },
    {
      ask: 'Comment se sent Margot pendant le défilé ?',
      answer: 'fière et heureuse',
      wrong: ['triste', 'en colère'],
      proof: 'Margot marche sur l’estrade en souriant',
      why: true,
    },
    {
      claim: 'À la fin, Margot ne veut plus jamais dessiner de robes.',
      truth: false,
      proof: 'Margot dessine une nouvelle robe',
    },
  ],
};
