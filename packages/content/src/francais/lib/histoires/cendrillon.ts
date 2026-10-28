import type { Story } from './index';

export const cendrillon: Story = {
  id: 'cendrillon',
  title: 'Cendrillon',
  icon: '👠',
  level: 4,
  source: 'conte de Charles Perrault',
  text: [
    'Il était une fois un gentilhomme qui se remaria avec une femme très orgueilleuse. Elle avait deux filles qui lui ressemblaient en tout. Le gentilhomme, lui, avait une fille d’une grande douceur. La belle-mère lui donna les travaux les plus durs de la maison : elle lavait la vaisselle, frottait les escaliers et dormait au grenier. Quand elle avait fini son travail, elle s’asseyait dans les cendres, près de la cheminée : c’est pourquoi on l’appelait Cendrillon.',
    'Un jour, le fils du roi donna un grand bal. Les deux sœurs, ravies, passèrent des jours à choisir leurs robes, et Cendrillon les coiffa. Quand elles partirent, Cendrillon se mit à pleurer, car elle aurait tant aimé y aller.',
    'Sa marraine, qui était fée, apparut alors. « Va me chercher une citrouille dans le jardin », lui dit-elle. D’un coup de baguette, la fée changea la citrouille en un carrosse doré, six souris en chevaux et un gros rat en cocher. Puis elle transforma les vieux habits de Cendrillon en une robe d’or et d’argent, et lui donna une paire de pantoufles de verre. « Mais attention, dit la fée : tu dois rentrer avant minuit, sinon tout redeviendra comme avant ! »',
    'Au bal, tout le monde admira la belle inconnue, et le prince ne dansa qu’avec elle. Cendrillon s’amusait tant qu’elle oublia l’heure. Au premier coup de minuit, elle s’enfuit en courant et, dans l’escalier, perdit une de ses pantoufles de verre. Le prince la ramassa précieusement.',
    'Le lendemain, le prince fit savoir qu’il épouserait celle dont le pied entrerait dans la pantoufle. On l’essaya à toutes les dames du royaume. Les deux sœurs forcèrent tant qu’elles purent, mais leurs pieds étaient bien trop grands. « Puis-je essayer ? » demanda Cendrillon. Les sœurs éclatèrent de rire, mais la pantoufle lui alla comme un gant. Elle sortit alors de sa poche l’autre pantoufle.',
    'Cendrillon épousa le prince. Et comme elle était aussi bonne que belle, elle pardonna à ses sœurs et les invita à vivre au palais.',
  ],
  questions: [
    {
      ask: 'Pourquoi l’appelle-t-on Cendrillon ?',
      answer: 'Elle s’assoit dans les cendres, près de la cheminée.',
      wrong: ['Elle a les cheveux gris.', 'Elle aime faire du feu.'],
      proof: 'elle s’asseyait dans les cendres',
      why: true,
    },
    {
      ask: 'Où dort Cendrillon ?',
      answer: 'au grenier',
      wrong: ['dans une belle chambre', 'dans la cuisine'],
      proof: 'dormait au grenier',
    },
    {
      ask: 'Pourquoi Cendrillon pleure-t-elle quand ses sœurs partent ?',
      answer: 'Elle voudrait tant aller au bal, elle aussi.',
      wrong: ['Ses sœurs lui ont fait mal.', 'Elle a perdu sa pantoufle.'],
      proof: 'Cendrillon se mit à pleurer',
      why: true,
    },
    {
      ask: 'En quoi la fée change-t-elle la citrouille ?',
      answer: 'en carrosse doré',
      wrong: ['en cheval', 'en robe de bal'],
      proof: 'changea la citrouille',
    },
    {
      ask: 'Que doit faire Cendrillon avant minuit ?',
      answer: 'rentrer chez elle',
      wrong: ['danser avec le prince', 'enlever ses pantoufles'],
      proof: 'tu dois rentrer avant minuit',
    },
    {
      ask: 'Que se passe-t-il au premier coup de minuit ?',
      answer: 'Cendrillon s’enfuit en courant.',
      wrong: ['Le prince essaie la pantoufle aux dames.', 'La fée apparaît.'],
      proof: 'Au premier coup de minuit',
    },
    {
      ask: 'Que perd Cendrillon dans l’escalier ?',
      answer: 'une pantoufle de verre',
      wrong: ['sa baguette', 'son collier'],
      proof: 'perdit une de ses pantoufles de verre',
    },
    {
      ask: 'Que veut dire « la pantoufle lui alla comme un gant » ?',
      answer: 'Elle était exactement à sa taille.',
      wrong: ['Elle était trop petite.', 'Elle ressemblait à un gant.'],
      proof: 'lui alla comme un gant',
    },
    {
      claim: 'À la fin, Cendrillon punit ses deux sœurs.',
      truth: false,
      proof: 'elle pardonna à ses sœurs',
    },
  ],
};
