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
  {
    id: 'maths.geometrie.alignes-identifier',
    domain: 'maths.geometrie',
    title: 'Identifier des points alignés',
    grades: ['CE1'],
    competence: 'Identifier des points alignés.',
    lesson:
      'Des points sont **alignés** quand un seul trait droit, tracé à la règle, passe par tous ces points.\n\n' +
      'Pour vérifier, je pose le bord de ma règle sur deux des points : les points alignés sont ' +
      'aussi **sur le bord** de la règle, pas juste à côté.',
  },
  {
    id: 'maths.geometrie.alignes-placer',
    domain: 'maths.geometrie',
    title: 'Placer des points alignés',
    grades: ['CE1'],
    competence: 'Placer des points alignés.',
    lesson:
      'Je pose ma règle sur les points et je trace une **droite** qui passe par tous ces points.\n\n' +
      'Je place les nouveaux points **sur ce trait** : ils sont alors alignés avec les autres.',
  },
  {
    id: 'maths.geometrie.segment',
    domain: 'maths.geometrie',
    title: 'Segment et extrémités',
    grades: ['CE1'],
    competence: 'Connaître le vocabulaire : segment, extrémités, milieu.',
    lesson:
      'Un **segment** est un trait droit qui s’arrête à deux points : ses **extrémités**.\n\n' +
      'Le segment d’extrémités A et B s’écrit **[AB]**.\n\n' +
      'Le **milieu** M du segment [AB] partage le segment en deux segments de même **longueur**.',
  },
  {
    id: 'maths.geometrie.milieu-reconnaitre',
    domain: 'maths.geometrie',
    title: 'Reconnaître le milieu d’un segment',
    grades: ['CE1'],
    competence: 'Reconnaître le milieu d’un segment.',
    lesson:
      'Le point M est le **milieu** du segment [AB] s’il est sur le segment et si les deux morceaux ' +
      'ont la **même longueur** : AM = MB.\n\n' +
      'Je mesure AM et MB avec ma règle : si les deux longueurs sont égales, M est le milieu.',
  },
  {
    id: 'maths.geometrie.milieu-longueurs',
    domain: 'maths.geometrie',
    title: 'Les longueurs d’un segment et de son milieu',
    grades: ['CE1'],
    competence: 'Utiliser les longueurs d’un segment et de son milieu.',
    lesson:
      'Si M est le milieu du segment [AB], alors **AM = MB**.\n\n' +
      'AB est le **double** de AM : AB = AM + MB. AM est la **moitié** de AB.\n\n' +
      'Exemple : AM = 3 cm, donc MB = 3 cm et AB = 6 cm.',
  },
  {
    id: 'maths.geometrie.milieu-tracer',
    domain: 'maths.geometrie',
    title: 'Trouver et placer le milieu d’un segment',
    grades: ['CE1'],
    competence: 'Trouver, mesurer et tracer le milieu d’un segment.',
    lesson:
      'Je pose le **0** de ma règle sur une extrémité, je lis la longueur du segment, je calcule ' +
      'la **moitié** de cette longueur, puis je place le point M à cette graduation.\n\n' +
      'Exemple : [AB] mesure 8 cm, la moitié de 8 est 4, je place M à 4 cm de A.',
  },
  {
    id: 'maths.mesures.mesurer-segment',
    domain: 'maths.mesures',
    title: 'Mesurer et tracer un segment',
    grades: ['CE1'],
    competence: 'Mesurer et tracer un segment d’une longueur donnée, en centimètres.',
    lesson:
      'Je pose le **0** de ma règle exactement sur une extrémité du segment, le bord de la règle ' +
      'le long du segment.\n\nJe lis le nombre en face de l’autre extrémité : c’est la longueur, en **cm**.',
  },
];
