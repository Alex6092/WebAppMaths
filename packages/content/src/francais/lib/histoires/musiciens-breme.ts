import type { Story } from './index';

export const musiciensBreme: Story = {
  id: 'musiciens-breme',
  title: 'Les musiciens de Brême',
  icon: '🎶',
  level: 3,
  source: 'conte des frères Grimm',
  text: [
    'Un vieil âne a travaillé toute sa vie pour son maître. Maintenant, il est trop faible pour porter les sacs de blé, et son maître ne veut plus de lui. L’âne décide de partir pour Brême, une grande ville, où il veut devenir musicien.',
    'Sur la route, il rencontre un chien trop vieux pour chasser, un chat qui n’attrape plus les souris et un coq que sa fermière voulait mettre dans la soupe. « Venez avec moi, dit l’âne. Ensemble, nous ferons de la musique ! » Et les voilà partis tous les quatre.',
    'Le soir, ils arrivent dans une forêt. Le coq, perché en haut d’un arbre, aperçoit une lumière : c’est une maison. Par la fenêtre, les animaux voient des voleurs assis autour d’une table pleine de bonnes choses à manger.',
    'Les animaux ont une idée. L’âne pose ses pattes sur la fenêtre, le chien grimpe sur son dos, le chat sur le dos du chien, et le coq tout en haut. Puis ils chantent de toutes leurs forces : l’âne brait, le chien aboie, le chat miaule et le coq crie cocorico. Les voleurs, terrifiés, croient voir un monstre et s’enfuient dans la nuit.',
    'Les quatre amis mangent à leur faim et s’installent dans la maison. Ils s’y trouvent si bien qu’ils n’arrivent jamais à Brême… mais ils font de la musique tous les soirs.',
  ],
  // Dans l’ordre de l’histoire.
  events: [
    { text: 'L’âne part pour la ville de Brême.', proof: 'décide de partir pour Brême' },
    { text: 'L’âne rencontre un chien, un chat et un coq.', proof: 'Sur la route, il rencontre' },
    { text: 'Le coq aperçoit une lumière dans la forêt.', proof: 'aperçoit une lumière' },
    { text: 'Les animaux montent les uns sur les autres.', proof: 'le chien grimpe sur son dos' },
    { text: 'Les voleurs s’enfuient, terrifiés.', proof: 's’enfuient dans la nuit' },
    { text: 'Les quatre amis s’installent dans la maison.', proof: 's’installent dans la maison' },
  ],
  questions: [
    {
      ask: 'Pourquoi l’âne quitte-t-il son maître ?',
      answer: 'Il est trop vieux, et son maître ne veut plus de lui.',
      wrong: ['Il veut voir la mer.', 'Il s’est disputé avec le chien.'],
      proof: 'son maître ne veut plus de lui',
      why: true,
    },
    {
      ask: 'Que veut devenir l’âne à Brême ?',
      answer: 'musicien',
      wrong: ['boulanger', 'jardinier'],
      proof: 'veut devenir musicien',
    },
    {
      ask: 'Quel animal risquait de finir dans la soupe ?',
      answer: 'le coq',
      wrong: ['le chat', 'le chien'],
      proof: 'mettre dans la soupe',
    },
    {
      ask: 'Qui voit la lumière de la maison ?',
      answer: 'le coq, du haut d’un arbre',
      wrong: ['l’âne, depuis le chemin', 'le chat, par la fenêtre'],
      proof: 'aperçoit une lumière',
    },
    {
      ask: 'Qui est assis autour de la table ?',
      answer: 'des voleurs',
      wrong: ['des musiciens', 'des chasseurs'],
      proof: 'des voleurs assis',
    },
    {
      ask: 'Quel animal est tout en bas de la pyramide ?',
      answer: 'l’âne',
      wrong: ['le chien', 'le chat'],
      proof: 'L’âne pose ses pattes sur la fenêtre',
    },
    {
      ask: 'Pourquoi les voleurs s’enfuient-ils ?',
      answer: 'Ils croient voir un monstre.',
      wrong: ['Les gendarmes arrivent.', 'Ils n’aiment pas la musique.'],
      proof: 'croient voir un monstre',
      why: true,
    },
    {
      claim: 'Les quatre amis arrivent enfin à Brême.',
      truth: false,
      proof: 'n’arrivent jamais à Brême',
    },
  ],
};
