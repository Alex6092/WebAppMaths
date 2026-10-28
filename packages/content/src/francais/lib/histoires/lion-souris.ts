import type { Story } from './index';

export const lionSouris: Story = {
  id: 'lion-souris',
  title: 'Le lion et la souris',
  icon: '🦁',
  level: 3,
  source: 'fable d’Ésope et de La Fontaine',
  text: [
    'Au milieu de la savane, un grand lion fait la sieste à l’ombre d’un arbre. Une petite souris, qui court sans regarder devant elle, passe sur son museau. Le lion se réveille en grognant et l’attrape entre ses griffes.',
    '« Pitié, majesté ! supplie la souris. Laissez-moi partir. Un jour, peut-être, je pourrai vous aider. » Le lion éclate de rire : comment une si petite bête pourrait-elle aider le roi des animaux ? Mais il n’a pas très faim, et la souris l’a fait rire. Alors il ouvre sa patte et la laisse s’en aller.',
    'Quelques jours plus tard, des chasseurs tendent un grand filet entre les arbres. Le lion, qui se promène, tombe dedans. Il se débat, il tire, il mord les cordes : plus il bouge, plus le filet le serre. Il rugit si fort que toute la savane l’entend.',
    'La petite souris reconnaît sa voix et accourt. Sans perdre de temps, elle se met à ronger les cordes avec ses petites dents pointues. Une corde cède, puis une autre, et bientôt le filet a un grand trou. Le lion est libre !',
    '« Tu vois, dit la souris, même un petit animal peut aider un grand. » Le lion la remercie, et depuis ce jour, ils sont les meilleurs amis du monde.',
  ],
  // Dans l’ordre de l’histoire.
  events: [
    { text: 'Une souris passe sur le museau du lion.', proof: 'passe sur son museau' },
    { text: 'La souris supplie le lion de la laisser partir.', proof: 'supplie la souris' },
    { text: 'Le lion laisse partir la souris.', proof: 'la laisse s’en aller' },
    { text: 'Le lion tombe dans le filet des chasseurs.', proof: 'tombe dedans' },
    { text: 'La souris ronge les cordes du filet.', proof: 'se met à ronger les cordes' },
    { text: 'Le lion et la souris deviennent amis.', proof: 'meilleurs amis du monde' },
  ],
  questions: [
    {
      ask: 'Où se passe l’histoire ?',
      answer: 'dans la savane',
      wrong: ['dans la forêt', 'à la montagne'],
      proof: 'Au milieu de la savane',
    },
    {
      ask: 'Pourquoi le lion se réveille-t-il ?',
      answer: 'La souris passe sur son museau.',
      wrong: ['Un chasseur fait du bruit.', 'Il a faim.'],
      proof: 'passe sur son museau',
    },
    {
      ask: 'Que promet la souris au lion ?',
      answer: 'De l’aider un jour.',
      wrong: ['De lui apporter à manger.', 'De ne plus jamais revenir.'],
      proof: 'je pourrai vous aider',
    },
    {
      ask: 'Pourquoi le lion éclate-t-il de rire ?',
      answer: 'Il ne croit pas qu’une si petite bête puisse l’aider.',
      wrong: ['La souris lui raconte une blague.', 'Il est content de manger.'],
      proof: 'Le lion éclate de rire',
      why: true,
    },
    {
      claim: 'Le lion mange la souris au début de l’histoire.',
      truth: false,
      proof: 'la laisse s’en aller',
    },
    {
      ask: 'Dans quoi le lion est-il pris ?',
      answer: 'dans un filet',
      wrong: ['dans une cage', 'dans un trou'],
      proof: 'tendent un grand filet',
    },
    {
      ask: 'Comment la souris sait-elle que le lion a besoin d’aide ?',
      answer: 'Elle reconnaît son rugissement.',
      wrong: ['Elle voit les chasseurs.', 'Un oiseau la prévient.'],
      proof: 'reconnaît sa voix',
    },
    {
      ask: 'Comment la souris libère-t-elle le lion ?',
      answer: 'Elle ronge les cordes.',
      wrong: ['Elle appelle les autres animaux.', 'Elle défait le nœud.'],
      proof: 'ronger les cordes',
    },
    {
      ask: 'Que veut nous apprendre cette histoire ?',
      answer: 'Même un petit peut aider un grand.',
      wrong: ['Il faut se méfier des souris.', 'Les lions sont les plus forts.'],
      proof: 'même un petit animal peut aider un grand',
      why: true,
    },
  ],
};
