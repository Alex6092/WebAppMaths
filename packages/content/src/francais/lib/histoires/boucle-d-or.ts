import type { Story } from './index';

export const boucleDor: Story = {
  id: 'boucle-d-or',
  title: 'Boucle d’or et les trois ours',
  icon: '🐻',
  level: 2,
  source: 'conte traditionnel',
  text: [
    'Il était une fois trois ours qui vivaient dans une petite maison, au milieu de la forêt : le papa ours, la maman ours et le bébé ours. Un matin, la maman ours prépare de la soupe. Elle est trop chaude, alors les trois ours vont se promener en attendant qu’elle refroidisse.',
    'Pendant ce temps, une petite fille aux cheveux blonds arrive devant la maison. On l’appelle Boucle d’or. La porte n’est pas fermée : elle entre. Sur la table, il y a trois bols. Boucle d’or goûte la soupe du grand bol : elle est trop chaude. Elle goûte la soupe du bol moyen : elle est trop froide. La soupe du petit bol est parfaite, et elle la mange toute !',
    'Ensuite, Boucle d’or monte dans la chambre. Le grand lit est trop dur, le lit moyen est trop mou, mais le petit lit est juste comme il faut. Elle s’y couche et s’endort.',
    'Les trois ours rentrent de leur promenade. « Quelqu’un a mangé ma soupe ! » pleure le bébé ours. Ils montent dans la chambre et découvrent Boucle d’or, endormie dans le petit lit. La petite fille se réveille, voit les trois ours et saute par la fenêtre. Elle court jusque chez elle sans se retourner.',
  ],
  questions: [
    {
      ask: 'Où vivent les trois ours ?',
      answer: '🌲 dans la forêt',
      wrong: ['🏖️ au bord de la mer', '🏙️ en ville'],
      proof: 'au milieu de la forêt',
    },
    {
      ask: 'Pourquoi les ours vont-ils se promener ?',
      answer: 'La soupe est trop chaude.',
      wrong: ['Ils cherchent du miel.', 'Ils ont perdu le bébé ours.'],
      proof: 'alors les trois ours vont se promener',
    },
    {
      ask: 'Comment sont les cheveux de Boucle d’or ?',
      answer: 'blonds',
      wrong: ['bruns', 'roux'],
      proof: 'aux cheveux blonds',
    },
    {
      ask: 'Comment est la soupe du petit bol ?',
      answer: 'parfaite',
      wrong: ['trop chaude', 'trop froide'],
      proof: 'La soupe du petit bol est parfaite',
    },
    {
      claim: 'Boucle d’or s’endort dans le grand lit.',
      truth: false,
      proof: 'le petit lit est juste comme il faut',
    },
    {
      ask: 'Qui pleure : « Quelqu’un a mangé ma soupe ! » ?',
      answer: 'le bébé ours',
      wrong: ['le papa ours', 'la maman ours'],
      proof: 'pleure le bébé ours',
    },
    {
      ask: 'Que fait Boucle d’or quand elle voit les trois ours ?',
      answer: 'Elle saute par la fenêtre.',
      wrong: ['Elle dit bonjour aux ours.', 'Elle se cache sous le lit.'],
      proof: 'saute par la fenêtre',
    },
  ],
};
