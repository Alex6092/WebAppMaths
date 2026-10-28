import type { Story } from './index';

export const lumierePhare: Story = {
  id: 'lumiere-phare',
  title: 'La lumière du phare',
  icon: '⛵',
  level: 4,
  source: 'histoire inventée pour le Cartable',
  text: [
    'Capucine passait toujours ses vacances d’été chez son oncle Yann, le gardien du phare de l’île aux Mouettes. Elle aimait grimper les cent vingt marches de l’escalier en colimaçon et regarder, tout en haut, l’énorme lampe qui guidait les bateaux pendant la nuit.',
    'Un soir, le vent se mit à souffler très fort. Les vagues frappaient les rochers et la pluie fouettait les vitres. Soudain, toutes les lumières s’éteignirent : la tempête avait coupé l’électricité de l’île. La grande lampe du phare ne tournait plus !',
    '« Il y a encore des bateaux de pêche en mer, dit l’oncle Yann, inquiet. Sans le phare, ils risquent de se fracasser sur les rochers. » Il descendit au sous-sol pour mettre en marche le vieux générateur, mais la machine toussa et refusa de démarrer.',
    'Capucine se souvint alors de ce que son oncle lui avait montré l’été précédent : dans un placard, il gardait une ancienne lampe à pétrole et des miroirs, comme on en utilisait autrefois. Elle courut les chercher, en grimpant les marches quatre à quatre. Ses mains tremblaient un peu, mais elle ne laissa rien tomber. Ensemble, ils allumèrent la lampe et placèrent les miroirs tout autour, pour que sa lumière brille le plus loin possible.',
    'Vers minuit, ils aperçurent enfin trois petites lumières qui avançaient dans la nuit : c’étaient les bateaux de pêche, qui rentraient au port en suivant la lueur du phare. Le lendemain matin, les pêcheurs vinrent remercier Capucine avec un panier rempli de crabes et de crevettes. Son oncle lui posa la main sur l’épaule : « Tu feras une excellente gardienne de phare. »',
  ],
  // Dans l’ordre de l’histoire.
  events: [
    { text: 'Le vent se met à souffler très fort.', proof: 'le vent se mit à souffler' },
    { text: 'La tempête coupe l’électricité de l’île.', proof: 'la tempête avait coupé' },
    { text: 'Le vieux générateur refuse de démarrer.', proof: 'refusa de démarrer' },
    {
      text: 'Capucine va chercher une lampe à pétrole et des miroirs.',
      proof: 'Elle courut les chercher',
    },
    { text: 'Ils placent les miroirs autour de la lampe.', proof: 'placèrent les miroirs' },
    { text: 'Les bateaux de pêche rentrent au port.', proof: 'Vers minuit' },
    {
      text: 'Les pêcheurs offrent un panier de crabes à Capucine.',
      proof: 'un panier rempli de crabes',
    },
    {
      text: 'L’oncle Yann dit qu’elle fera une excellente gardienne.',
      proof: 'une excellente gardienne',
    },
  ],
  questions: [
    {
      ask: 'Quel est le métier de l’oncle Yann ?',
      answer: 'gardien de phare',
      wrong: ['pêcheur', 'capitaine de bateau'],
      proof: 'le gardien du phare',
    },
    {
      ask: 'Combien de marches compte l’escalier du phare ?',
      answer: 'cent vingt',
      wrong: ['cinquante', 'deux cents'],
      proof: 'les cent vingt marches',
    },
    {
      ask: 'Pourquoi la lampe du phare ne tourne-t-elle plus ?',
      answer: 'La tempête a coupé l’électricité.',
      wrong: ['L’oncle Yann l’a éteinte.', 'Capucine a cassé la lampe.'],
      proof: 'la tempête avait coupé l’électricité',
    },
    {
      ask: 'Pourquoi l’oncle Yann est-il inquiet ?',
      answer: 'Sans le phare, les bateaux risquent de se briser sur les rochers.',
      wrong: ['Il a peur du vent.', 'Capucine a disparu.'],
      proof: 'ils risquent de se fracasser',
      why: true,
    },
    {
      ask: 'Dans l’histoire, que veut dire « se fracasser » ?',
      answer: 'se briser en morceaux',
      wrong: ['se perdre', 'rentrer au port'],
      proof: 'Sans le phare',
    },
    {
      ask: 'Qu’est-ce qui refuse de démarrer ?',
      answer: 'le vieux générateur',
      wrong: ['le bateau de l’oncle', 'la grande lampe'],
      proof: 'refusa de démarrer',
    },
    {
      ask: 'Pourquoi place-t-on des miroirs autour de la lampe ?',
      answer: 'Pour que sa lumière brille plus loin.',
      wrong: ['Pour se regarder.', 'Pour décorer le phare.'],
      proof: 'brille le plus loin possible',
    },
    {
      ask: 'Que se passe-t-il vers minuit ?',
      answer: 'Les bateaux de pêche rentrent au port.',
      wrong: ['La tempête commence.', 'Les pêcheurs apportent des crabes.'],
      proof: 'Vers minuit',
    },
    {
      claim: 'Les pêcheurs offrent à Capucine un panier de poissons.',
      truth: false,
      proof: 'un panier rempli de crabes',
    },
    {
      ask: 'Que pense l’oncle Yann de Capucine, à la fin ?',
      answer: 'Elle a été courageuse et maligne.',
      wrong: ['Elle a fait une bêtise.', 'Elle a eu trop peur.'],
      proof: 'une excellente gardienne de phare',
      why: true,
    },
  ],
};
