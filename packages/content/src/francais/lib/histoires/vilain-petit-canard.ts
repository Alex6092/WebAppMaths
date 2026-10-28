import type { Story } from './index';

export const vilainPetitCanard: Story = {
  id: 'vilain-petit-canard',
  title: 'Le Vilain Petit Canard',
  icon: '🦢',
  level: 4,
  source: 'conte de Hans Christian Andersen',
  text: [
    'C’était l’été à la campagne. Au bord d’un étang, une cane couvait ses œufs. Un à un, ils s’ouvrirent, et de jolis canetons jaunes en sortirent. Mais le plus gros œuf mit plus longtemps à éclore, et il en sortit un caneton gris, grand et maladroit.',
    '« Comme il est laid ! » dirent les animaux de la basse-cour. Les canards le pinçaient, les poules le picoraient, et même ses frères se moquaient de lui. Le pauvre caneton était si malheureux qu’un matin, il s’enfuit à travers les haies.',
    'Il arriva dans un grand marais où vivaient des canards sauvages. Ils ne voulurent pas de lui non plus. Puis une vieille femme le recueillit, mais son chat et sa poule se moquaient de lui parce qu’il ne savait ni ronronner ni pondre. Alors il repartit, tout seul.',
    'L’automne arriva. Un soir, il vit passer dans le ciel de grands oiseaux d’un blanc éclatant, au long cou souple : c’étaient des cygnes. Le caneton les regarda s’envoler vers les pays chauds avec un sentiment étrange, comme s’il les aimait sans les connaître.',
    'L’hiver fut terrible. L’étang gela, et le caneton faillit rester prisonnier de la glace. Un paysan le trouva et le ramena chez lui, mais les enfants voulaient jouer avec lui, et le caneton, effrayé, renversa le lait et la farine avant de s’échapper.',
    'Quand le printemps revint, il sentit que ses ailes étaient devenues fortes. Il s’envola jusqu’à un beau jardin où nageaient trois cygnes. Il s’approcha en baissant la tête, prêt à être chassé… et il vit son reflet dans l’eau. Il n’était plus un caneton gris et maladroit : il était devenu un magnifique cygne blanc ! Les autres cygnes l’entourèrent et le caressèrent avec leur bec. Il était très heureux, mais il ne devint pas orgueilleux : un bon cœur ne l’est jamais.',
  ],
  questions: [
    {
      ask: 'Où la cane couve-t-elle ses œufs ?',
      answer: 'au bord d’un étang',
      wrong: ['dans un arbre', 'dans une grange'],
      proof: 'Au bord d’un étang',
    },
    {
      ask: 'Comment est le dernier caneton ?',
      answer: 'gris, grand et maladroit',
      wrong: ['jaune et tout petit', 'blanc et très beau'],
      proof: 'un caneton gris, grand et maladroit',
    },
    {
      ask: 'Pourquoi le caneton s’enfuit-il ?',
      answer: 'Tout le monde se moque de lui et le maltraite.',
      wrong: ['Il veut voir la mer.', 'Sa maman le chasse.'],
      proof: 'Le pauvre caneton était si malheureux',
      why: true,
    },
    {
      ask: 'Pourquoi le chat et la poule se moquent-ils de lui ?',
      answer: 'Il ne sait ni ronronner ni pondre.',
      wrong: ['Il nage trop bien.', 'Il est trop petit.'],
      proof: 'il ne savait ni ronronner ni pondre',
    },
    {
      ask: 'Quels oiseaux voit-il passer à l’automne ?',
      answer: 'des cygnes',
      wrong: ['des hirondelles', 'des aigles'],
      proof: 'c’étaient des cygnes',
    },
    {
      ask: 'Que se passe-t-il pendant l’hiver ?',
      answer: 'L’étang gèle, et le caneton est presque prisonnier de la glace.',
      wrong: ['Le caneton retrouve sa maman.', 'Le caneton devient un cygne.'],
      proof: 'L’étang gela',
    },
    {
      ask: 'Que voit le caneton dans l’eau, au printemps ?',
      answer: 'Son reflet : il est devenu un cygne.',
      wrong: ['Un poisson doré.', 'Ses frères canards.'],
      proof: 'il vit son reflet dans l’eau',
    },
    {
      ask: 'Que veut dire « orgueilleux » ?',
      answer: 'qui se croit meilleur que les autres',
      wrong: ['qui a peur de tout', 'qui est très gentil'],
      proof: 'il ne devint pas orgueilleux',
    },
    {
      claim: 'Le vilain petit canard était en réalité un bébé cygne.',
      truth: true,
      proof: 'il était devenu un magnifique cygne blanc',
    },
    {
      ask: 'Comment se sent-il quand les cygnes l’entourent ?',
      answer: 'très heureux',
      wrong: ['effrayé', 'jaloux'],
      proof: 'Il était très heureux',
      why: true,
    },
  ],
};
