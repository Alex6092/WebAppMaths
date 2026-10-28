import type { Story } from './index';

export const septChevreaux: Story = {
  id: 'sept-chevreaux',
  title: 'Le loup et les sept chevreaux',
  icon: '🐐',
  level: 2,
  source: 'conte des frères Grimm',
  text: [
    'Une maman chèvre vit avec ses sept chevreaux. Un jour, elle part chercher à manger dans la forêt. « N’ouvrez à personne, dit-elle. Le loup a une grosse voix et des pattes toutes noires. »',
    'Bientôt, on frappe à la porte. « Ouvrez, c’est maman ! » dit une grosse voix. « Tu as une grosse voix : tu es le loup ! » répondent les chevreaux. Le loup mange alors de la craie pour avoir une voix douce. Il revient, mais il pose sa patte noire sur la fenêtre. « Tu as une patte noire : tu es le loup ! »',
    'Le loup trempe sa patte dans la farine pour qu’elle devienne blanche. Cette fois, les chevreaux ouvrent la porte… et le loup les avale tous, sauf le plus petit, caché dans l’horloge.',
    'Quand la maman rentre, le petit chevreau lui raconte tout. Ils trouvent le loup endormi sous un arbre, le ventre bien rond. La maman ouvre son ventre avec des ciseaux : les six chevreaux sortent, sains et saufs ! Ils remplissent le ventre du loup de grosses pierres. À son réveil, le loup a soif, il se penche au-dessus du puits… et il tombe dedans.',
  ],
  questions: [
    {
      ask: 'Combien de chevreaux la maman chèvre a-t-elle ?',
      answer: 'sept',
      wrong: ['trois', 'dix'],
      proof: 'avec ses sept chevreaux',
    },
    {
      ask: 'Pourquoi le loup mange-t-il de la craie ?',
      answer: 'Pour avoir une voix douce.',
      wrong: ['Parce qu’il a faim.', 'Pour avoir les dents blanches.'],
      proof: 'mange alors de la craie',
    },
    {
      ask: 'Comment le loup rend-il sa patte blanche ?',
      answer: 'Il la trempe dans la farine.',
      wrong: ['Il la peint.', 'Il met un gant.'],
      proof: 'trempe sa patte dans la farine',
    },
    {
      ask: 'Pourquoi les chevreaux ouvrent-ils la porte la dernière fois ?',
      answer: 'Le loup a une voix douce et une patte blanche, comme leur maman.',
      wrong: ['Ils ont faim.', 'Ils veulent jouer avec le loup.'],
      proof: 'Cette fois, les chevreaux ouvrent la porte',
      why: true,
    },
    {
      ask: 'Où se cache le plus petit chevreau ?',
      answer: '🕰️ dans l’horloge',
      wrong: ['🛏️ sous le lit', '🔥 dans la cheminée'],
      proof: 'caché dans l’horloge',
    },
    {
      claim: 'Le loup mange aussi le plus petit chevreau.',
      truth: false,
      proof: 'sauf le plus petit',
    },
    {
      ask: 'Comment la maman sait-elle ce qui s’est passé ?',
      answer: 'Le petit chevreau lui raconte tout.',
      wrong: ['Elle voit le loup partir.', 'Un oiseau la prévient.'],
      proof: 'le petit chevreau lui raconte tout',
    },
    {
      ask: 'Que met-on dans le ventre du loup ?',
      answer: 'des pierres',
      wrong: ['de la farine', 'de l’eau'],
      proof: 'de grosses pierres',
    },
  ],
};
