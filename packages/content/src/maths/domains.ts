import type { Domain, Notion } from '@app/core';

export const domains: Domain[] = [
  { id: 'maths.nombres', subject: 'maths', title: 'Nombres', icon: '🔢', order: 1 },
  { id: 'maths.calcul', subject: 'maths', title: 'Calcul', icon: '➕', order: 2 },
  { id: 'maths.geometrie', subject: 'maths', title: 'Géométrie', icon: '📐', order: 3 },
  { id: 'maths.mesures', subject: 'maths', title: 'Grandeurs et mesures', icon: '📏', order: 4 },
  { id: 'maths.problemes', subject: 'maths', title: 'Problèmes', icon: '🧩', order: 5 },
];

export const notions: Notion[] = [
  {
    id: 'maths.nombres.comparer',
    domain: 'maths.nombres',
    title: 'Comparer des nombres',
    grades: ['CP', 'CE1'],
    competence: 'Comparer des nombres avec les signes <, > et =.',
    lesson:
      'Le signe **<** se lit « est plus petit que », le signe **>** « est plus grand que ».\n\n' +
      'La pointe montre toujours le plus petit nombre : **3 < 8**, **8 > 3**.\n\n' +
      'Pour comparer, je regarde d’abord le nombre de chiffres, puis les centaines, puis les dizaines, puis les unités.',
  },
  {
    id: 'maths.calcul.poser-addition',
    domain: 'maths.calcul',
    title: 'Poser et calculer une addition',
    grades: ['CP', 'CE1', 'CE2'],
    competence: 'Calculer une addition posée, avec ou sans retenue.',
    lesson:
      'Je range bien les chiffres : les unités sous les unités, les dizaines sous les dizaines.\n\n' +
      'Je commence par la colonne des **unités**, à droite. Si le résultat dépasse 9, j’écris les unités ' +
      'et je pose une **retenue** en haut de la colonne suivante.',
  },
  {
    id: 'maths.calcul.poser-soustraction',
    domain: 'maths.calcul',
    title: 'Poser et calculer une soustraction',
    grades: ['CP', 'CE1', 'CE2'],
    competence: 'Calculer une soustraction posée, avec ou sans retenue.',
    lesson:
      'Je commence par les **unités**, à droite. Si le chiffre du haut est plus petit que celui du bas, ' +
      'j’ajoute 10 en haut, et je mets une **retenue** de 1 en bas dans la colonne suivante.',
  },
  {
    id: 'maths.calcul.mental',
    domain: 'maths.calcul',
    title: 'Calculer mentalement',
    grades: ['CP', 'CE1'],
    competence: 'Calculer mentalement des sommes, des différences, des doubles et des moitiés.',
  },
];
