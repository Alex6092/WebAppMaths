import type { Domain, FigPoint, LessonBlock, LessonColumn, Notion } from '@app/core';
import { PLACE_COLORS, type Place } from './lib/couleurs';

export const domains: Domain[] = [
  { id: 'maths.nombres', subject: 'maths', title: 'Nombres', icon: '🔢', order: 1 },
  { id: 'maths.calcul', subject: 'maths', title: 'Calcul', icon: '➕', order: 2 },
  { id: 'maths.geometrie', subject: 'maths', title: 'Géométrie', icon: '📐', order: 3 },
  { id: 'maths.mesures', subject: 'maths', title: 'Grandeurs et mesures', icon: '📏', order: 4 },
  { id: 'maths.problemes', subject: 'maths', title: 'Problèmes', icon: '🧩', order: 5 },
];

const PLACE_TITLES: Record<Place, string> = { c: 'centaines', d: 'dizaines', u: 'unités' };

/** Tableau C D U : une colonne par rang, une ligne par nombre (ses chiffres, de gauche à droite). */
function placeTable(...rows: string[][]): LessonBlock {
  const places: Place[] = ['c', 'd', 'u'];
  return {
    kind: 'table',
    columns: places.map((place, i): LessonColumn => ({
      title: PLACE_TITLES[place],
      color: PLACE_COLORS[place].fill,
      cells: rows.map((digits) => digits[i] ?? ''),
    })),
  };
}

/** Un point de figure ; les extrémités d'un segment sont marquées d'un petit trait, comme à l'école. */
const pt = (id: string, x: number, y: number, more: Partial<FigPoint> = {}): FigPoint => ({
  id,
  x,
  y,
  label: id,
  ...more,
});
const tick = { mark: 'tick' } as const;

/** Un segment horizontal [AB] avec un point sur le segment, et ses deux longueurs dessous. */
function cutSegment(name: string, length: number, cut: number, width = 10): LessonBlock {
  const x0 = (width - length) / 2;
  return {
    kind: 'figure',
    figure: {
      width,
      height: 3,
      points: [
        pt('A', x0, 1.5, tick),
        pt(name, x0 + cut, 1.5, tick),
        pt('B', x0 + length, 1.5, tick),
      ],
      segments: [{ from: 'A', to: 'B' }],
      texts: [
        { x: x0 + cut / 2, y: 2.4, text: `${cut} cm` },
        { x: x0 + (cut + length) / 2, y: 2.4, text: `${length - cut} cm` },
      ],
    },
  };
}

/** Un segment de length cm, avec la règle posée : le 0 sur A. */
function measuredSegment(length: number, caption: string, middle = false): LessonBlock {
  const points = [pt('A', 1, 1.2, tick), pt('B', 1 + length, 1.2, tick)];
  if (middle) points.push(pt('M', 1 + length / 2, 1.2));
  return {
    kind: 'figure',
    figure: { width: 10, height: 2.8, points, segments: [{ from: 'A', to: 'B' }] },
    ruler: { x: 1, y: 1.2 },
    caption,
  };
}

const TABLES = [2, 3, 4, 5, 10];

export const notions: Notion[] = [
  {
    id: 'maths.nombres.comparer',
    domain: 'maths.nombres',
    title: 'Comparer des nombres',
    grades: ['CP', 'CE1'],
    competence: 'Comparer des nombres avec les signes <, > et =.',
    lesson: [
      'Le signe **<** se lit « est plus petit que ». Le signe **>** se lit « est plus grand que ».',
      { kind: 'example', lines: ['3 **<** 8', '8 **>** 3'] },
      'La **pointe** du signe montre toujours le plus petit nombre. Le côté **ouvert** est tourné vers le plus grand.',
      'Pour comparer, je regarde d’abord le **nombre de chiffres**, puis les **centaines**, puis les **dizaines**, puis les **unités** :',
      placeTable(['3', '**4**', '7'], ['3', '**6**', '2']),
      'Les centaines sont pareilles. 4 dizaines, c’est moins que 6 dizaines, donc **347 < 362**.',
    ],
  },
  {
    id: 'maths.nombres.ecrire',
    domain: 'maths.nombres',
    title: 'Lire et écrire les nombres',
    grades: ['CP', 'CE1'],
    competence: 'Lire et écrire les nombres jusqu’à 1000, en chiffres et en lettres.',
    lesson: [
      'Je lis d’abord les **centaines**, puis le reste :',
      {
        kind: 'table',
        columns: [
          { title: 'centaines', color: PLACE_COLORS.c.fill, cells: ['3', 'trois cent'] },
          { title: 'le reste', cells: ['47', 'quarante-sept'] },
        ],
      },
      { kind: 'example', lines: ['347 → **trois cent quarante-sept**'] },
      'Sous cent, je mets des **traits d’union** : dix-sept, quatre-vingt-dix. Mais pas avec « et » : vingt **et** un, soixante **et** onze.',
      '**Cent** et **vingt** prennent un **s** quand ils sont multipliés et à la fin du nombre :',
      {
        kind: 'table',
        columns: [
          { title: 'avec un s', cells: ['deux cent**s**', 'quatre-vingt**s**'] },
          { title: 'sans s', cells: ['deux cent un', 'quatre-vingt-trois'] },
        ],
      },
    ],
  },
  {
    id: 'maths.nombres.decomposer',
    domain: 'maths.nombres',
    title: 'Centaines, dizaines, unités',
    grades: ['CE1'],
    competence: 'Décomposer un nombre en centaines, dizaines et unités.',
    lesson: [
      'Dans **347**, il y a 3 centaines, 4 dizaines et 7 unités :',
      { kind: 'base-ten', value: 347 },
      placeTable(['3', '4', '7']),
      { kind: 'example', lines: ['347 = 300 + 40 + 7'] },
      {
        kind: 'list',
        items: ['1 **centaine** = 10 dizaines = 100 unités.', '1 **dizaine** = 10 unités.'],
      },
    ],
  },
  {
    id: 'maths.nombres.ranger',
    domain: 'maths.nombres',
    title: 'Ranger des nombres',
    grades: ['CP', 'CE1'],
    competence: 'Ranger des nombres dans l’ordre croissant ou décroissant.',
    lesson: [
      'Ordre **croissant** : du plus petit au plus grand, avec le signe <.',
      { kind: 'example', lines: ['125 < 210 < 347 < 503'] },
      'Ordre **décroissant** : du plus grand au plus petit, avec le signe >.',
      { kind: 'example', lines: ['503 > 347 > 210 > 125'] },
      'Je compare d’abord les centaines, puis les dizaines, puis les unités.',
    ],
  },
  {
    id: 'maths.nombres.encadrer',
    domain: 'maths.nombres',
    title: 'Encadrer un nombre',
    grades: ['CE1'],
    competence: 'Trouver le nombre d’avant et d’après ; encadrer à la dizaine et à la centaine.',
    lesson: [
      'Le nombre juste **après** 399 est **400**. Le nombre juste **avant** 400 est **399**.',
      {
        kind: 'number-line',
        from: 396,
        to: 403,
        step: 1,
        labels: [396, 397, 398, 401, 402, 403],
        points: [399, 400],
      },
      'Encadrer 347 **à la dizaine** : entre les deux dizaines les plus proches.',
      { kind: 'number-line', from: 340, to: 350, step: 1, labels: [340, 350], points: [347] },
      { kind: 'example', lines: ['340 < 347 < 350'] },
      'Encadrer 347 **à la centaine** : entre les deux centaines les plus proches.',
      { kind: 'number-line', from: 300, to: 400, step: 10, labels: [300, 400], points: [347] },
      { kind: 'example', lines: ['300 < 347 < 400'] },
    ],
  },
  {
    id: 'maths.calcul.poser-addition',
    domain: 'maths.calcul',
    title: 'Poser et calculer une addition',
    grades: ['CP', 'CE1', 'CE2'],
    competence: 'Calculer une addition posée, avec ou sans retenue.',
    lesson: [
      'Je range bien les chiffres : les **unités** sous les unités, les **dizaines** sous les dizaines.',
      { kind: 'operation', op: '+', operands: [247, 135] },
      'Je commence par la colonne des **unités**, à droite : 7 + 5 = 12. J’écris **2** et je pose une **retenue** de 1 en haut de la colonne des dizaines.',
      'Puis les dizaines : 1 + 4 + 3 = 8. Puis les centaines : 2 + 1 = 3.',
    ],
  },
  {
    id: 'maths.calcul.poser-soustraction',
    domain: 'maths.calcul',
    title: 'Poser et calculer une soustraction',
    grades: ['CP', 'CE1', 'CE2'],
    competence: 'Calculer une soustraction posée, avec ou sans retenue.',
    lesson: [
      'Je range bien les chiffres, puis je commence par les **unités**, à droite.',
      { kind: 'operation', op: '-', operands: [352, 127] },
      'Unités : 2 est plus petit que 7. J’ajoute **10** en haut : 12 − 7 = 5. Et je mets une **retenue** de 1 en bas, dans la colonne des dizaines.',
      'Dizaines : 2 + 1 = 3, et 5 − 3 = 2. Centaines : 3 − 1 = 2.',
    ],
  },
  {
    id: 'maths.calcul.mental',
    domain: 'maths.calcul',
    title: 'Calculer mentalement',
    grades: ['CP', 'CE1'],
    competence: 'Calculer mentalement des sommes, des différences, des doubles et des moitiés.',
    lesson: [
      'Le **double** de 6, c’est 6 + 6 = 12. La **moitié** de 12, c’est 6.',
      {
        kind: 'table',
        columns: [
          { title: 'doubles', cells: [1, 2, 3, 4, 5].map((n) => `${n} + ${n} = ${2 * n}`) },
          { title: 'doubles', cells: [6, 7, 8, 9, 10].map((n) => `${n} + ${n} = ${2 * n}`) },
          { title: 'pour faire 10', cells: [1, 2, 3, 4, 5].map((n) => `${n} + ${10 - n}`) },
        ],
      },
      'Pour **ajouter 10**, le chiffre des dizaines augmente de 1 : 34 + 10 = **44**. Pour **retirer 10**, il diminue de 1 : 34 − 10 = **24**.',
      {
        kind: 'number-line',
        from: 20,
        to: 50,
        step: 1,
        labels: [20, 30, 40, 50],
        points: [24, 34, 44],
      },
    ],
  },
  {
    id: 'maths.calcul.tables',
    domain: 'maths.calcul',
    title: 'Tables de multiplication',
    grades: ['CE1', 'CE2'],
    competence: 'Connaître les tables de multiplication de 2, 3, 4, 5 et 10.',
    lesson: [
      '**3 × 4**, c’est 3 fois 4 : 4 + 4 + 4 = 12.',
      { kind: 'array', rows: 3, cols: 4, caption: '3 lignes de 4 ronds : 3 × 4 = 12' },
      'Je peux retourner : 3 × 4 = 4 × 3 = 12.',
      'Dans la table de **10**, j’ajoute un zéro : 7 × 10 = 70. Dans la table de **5**, les résultats finissent par 0 ou 5.',
      {
        kind: 'table',
        columns: TABLES.map((t) => ({
          title: `table de ${t}`,
          cells: Array.from({ length: 10 }, (_, i) => `${i + 1} × ${t} = **${(i + 1) * t}**`),
        })),
      },
    ],
  },
  {
    id: 'maths.geometrie.alignes-identifier',
    domain: 'maths.geometrie',
    title: 'Identifier des points alignés',
    grades: ['CE1'],
    competence: 'Identifier des points alignés.',
    lesson: [
      'Des points sont **alignés** quand un seul trait droit, tracé à la règle, passe par tous ces points.',
      {
        kind: 'figure',
        figure: {
          width: 10,
          height: 4.4,
          points: [
            pt('A', 1.5, 3.6, { labelAt: 'nw' }),
            pt('B', 4.5, 2.6, { labelAt: 'nw' }),
            pt('C', 7.5, 1.6, { labelAt: 'nw' }),
            pt('D', 6.5, 3.6, { labelAt: 'se' }),
          ],
          segments: [{ from: 'A', to: 'C', kind: 'line', dashed: true }],
        },
        caption: 'A, B et C sont alignés. D n’est pas aligné avec eux.',
      },
      'Pour vérifier, je pose le bord de ma règle sur deux des points : les points alignés sont aussi **sur le bord** de la règle, pas juste à côté.',
      {
        kind: 'figure',
        figure: {
          width: 10,
          height: 4.4,
          points: [pt('E', 1.5, 1.4), pt('F', 4.5, 2.2), pt('G', 6.5, 2.35), pt('H', 8.5, 3.3)],
          ruler: true,
        },
        caption: 'Essaie : pose la règle sur E et H. Quel point n’est pas sur le bord ?',
      },
    ],
  },
  {
    id: 'maths.geometrie.alignes-placer',
    domain: 'maths.geometrie',
    title: 'Placer des points alignés',
    grades: ['CE1'],
    competence: 'Placer des points alignés.',
    lesson: [
      'Je pose ma règle sur les points et je trace une **droite** qui passe par tous ces points.',
      'Je place les nouveaux points **sur ce trait** : ils sont alors alignés avec les autres.',
      {
        kind: 'figure',
        figure: {
          width: 10,
          height: 4,
          points: [pt('A', 1.5, 3.2), pt('B', 5, 2.2), pt('C', 8.5, 1.2)],
          segments: [{ from: 'A', to: 'B', kind: 'line' }],
        },
        caption: 'C est sur la droite qui passe par A et B : A, B et C sont alignés.',
      },
    ],
  },
  {
    id: 'maths.geometrie.segment',
    domain: 'maths.geometrie',
    title: 'Segment et extrémités',
    grades: ['CE1'],
    competence: 'Connaître le vocabulaire : segment, extrémités, milieu.',
    lesson: [
      'Un **segment** est un trait droit qui s’arrête à deux points : ses **extrémités**.',
      {
        kind: 'figure',
        figure: {
          width: 10,
          height: 2.4,
          points: [pt('A', 1.5, 1.5, tick), pt('B', 8.5, 1.5, tick)],
          segments: [{ from: 'A', to: 'B' }],
        },
        caption: 'Les points A et B sont les extrémités du segment.',
      },
      'Le segment d’extrémités A et B s’écrit **[AB]**.',
      'Le **milieu** M du segment [AB] partage le segment en deux segments de même **longueur**.',
      cutSegment('M', 6, 3),
    ],
  },
  {
    id: 'maths.geometrie.milieu-reconnaitre',
    domain: 'maths.geometrie',
    title: 'Reconnaître le milieu d’un segment',
    grades: ['CE1'],
    competence: 'Reconnaître le milieu d’un segment.',
    lesson: [
      'Le point M est le **milieu** du segment [AB] s’il est sur le segment et si les deux morceaux ont la **même longueur** : AM = MB.',
      cutSegment('M', 6, 3),
      'Ici, N est sur le segment, mais AN = 2 cm et NB = 4 cm : N n’est **pas** le milieu.',
      cutSegment('N', 6, 2),
      'Je mesure les deux morceaux avec ma règle : si les deux longueurs sont égales, c’est le milieu.',
    ],
  },
  {
    id: 'maths.geometrie.milieu-longueurs',
    domain: 'maths.geometrie',
    title: 'Les longueurs d’un segment et de son milieu',
    grades: ['CE1'],
    competence: 'Utiliser les longueurs d’un segment et de son milieu.',
    lesson: [
      'Si M est le milieu du segment [AB], alors **AM = MB**.',
      {
        kind: 'figure',
        figure: {
          width: 10,
          height: 4.4,
          points: [
            pt('A', 2, 1.5, tick),
            pt('M', 5, 1.5, tick),
            pt('B', 8, 1.5, tick),
            { id: 'a', x: 2, y: 3.1, mark: 'tick' },
            { id: 'b', x: 8, y: 3.1, mark: 'tick' },
          ],
          segments: [
            { from: 'A', to: 'B' },
            { from: 'a', to: 'b', dashed: true },
          ],
          texts: [
            { x: 3.5, y: 2.4, text: 'AM = 3 cm' },
            { x: 6.5, y: 2.4, text: 'MB = 3 cm' },
            { x: 5, y: 3.9, text: 'AB = 6 cm' },
          ],
        },
      },
      'AB est le **double** de AM : AB = AM + MB. AM est la **moitié** de AB.',
      { kind: 'example', lines: ['AM = 3 cm → MB = 3 cm → AB = 3 + 3 = **6 cm**'] },
    ],
  },
  {
    id: 'maths.geometrie.milieu-tracer',
    domain: 'maths.geometrie',
    title: 'Trouver et placer le milieu d’un segment',
    grades: ['CE1'],
    competence: 'Trouver, mesurer et tracer le milieu d’un segment.',
    lesson: [
      {
        kind: 'list',
        ordered: true,
        items: [
          'Je pose le **0** de ma règle sur une extrémité.',
          'Je lis la **longueur** du segment.',
          'Je calcule la **moitié** de cette longueur.',
          'Je place le point M à cette graduation.',
        ],
      },
      measuredSegment(
        8,
        '[AB] mesure 8 cm. La moitié de 8, c’est 4 : je place M à 4 cm de A.',
        true,
      ),
    ],
  },
  {
    id: 'maths.mesures.mesurer-segment',
    domain: 'maths.mesures',
    title: 'Mesurer et tracer un segment',
    grades: ['CE1'],
    competence: 'Mesurer et tracer un segment d’une longueur donnée, en centimètres.',
    lesson: [
      'Je pose le **0** de ma règle exactement sur une extrémité du segment, le bord de la règle le long du segment.',
      'Je lis le nombre en face de l’autre extrémité : c’est la longueur, en **cm**.',
      measuredSegment(5, 'Le 0 est sur A. En face de B, je lis 5 : [AB] mesure **5 cm**.'),
    ],
  },
  {
    id: 'maths.mesures.lire-heure',
    domain: 'maths.mesures',
    title: 'Lire l’heure',
    grades: ['CE1'],
    competence: 'Lire et indiquer l’heure sur une horloge à aiguilles.',
    lesson: [
      'Une horloge a **deux aiguilles** :',
      {
        kind: 'list',
        items: [
          'la **petite aiguille** (rouge) montre les **heures** ;',
          'la **grande aiguille** (bleue) montre les **minutes**.',
        ],
      },
      'Quand la grande aiguille est sur le **12**, c’est l’heure **pile** : je lis le nombre de la petite aiguille.',
      {
        kind: 'clocks',
        items: [
          { minutes: 180, caption: '3 h' },
          { minutes: 540, caption: '9 h' },
        ],
      },
      'En une heure, la grande aiguille fait **un tour** et la petite avance d’un nombre. De 1 à 2, de 2 à 3… sur le cadran, la grande aiguille avance de **5 minutes**.',
      {
        kind: 'clocks',
        minuteLabels: true,
        items: [
          { minutes: 195, caption: '3 h 15 : trois heures et quart' },
          { minutes: 210, caption: '3 h 30 : trois heures et demie' },
          { minutes: 225, caption: '3 h 45 : quatre heures moins le quart' },
        ],
      },
      'Quand la grande aiguille a avancé, la petite est **entre deux nombres** : je lis le plus petit (à 3 h 30, elle est entre le 3 et le 4).',
      'L’après-midi, on compte les heures après 12 : 3 h de l’après-midi, c’est **15 h**.',
      { kind: 'example', lines: ['2 h de l’après-midi → **14 h**', '6 h du soir → **18 h**'] },
    ],
  },
  {
    id: 'maths.mesures.durees',
    domain: 'maths.mesures',
    title: 'Les durées',
    grades: ['CE1'],
    competence:
      'Connaître les unités de durée (jour, heure, minute) et trouver une heure après une durée.',
    lesson: [
      {
        kind: 'example',
        lines: [
          '1 jour = **24 heures**',
          '1 heure = **60 minutes**',
          'une demi-heure = **30 minutes**',
          'un quart d’heure = **15 minutes**',
        ],
      },
      'Pour savoir quelle heure il sera **dans** une heure, je fais faire un tour à la grande aiguille.',
      {
        kind: 'clocks',
        items: [
          { minutes: 195, caption: 'Il est 3 h 15.' },
          { minutes: 255, caption: 'Dans 1 heure : 4 h 15.' },
          { minutes: 225, caption: 'Dans une demi-heure : 3 h 45.' },
        ],
      },
    ],
  },
  {
    id: 'maths.mesures.monnaie',
    domain: 'maths.mesures',
    title: 'Les pièces et les billets',
    grades: ['CE1'],
    competence: 'Connaître les pièces et les billets en euros, et calculer une somme.',
    lesson: [
      'Pour payer, on utilise des **pièces** et des **billets** en **euros** (€).',
      { kind: 'money', values: [100, 200], caption: 'Les pièces de 1 € et de 2 €.' },
      {
        kind: 'money',
        values: [500, 1000, 2000, 5000],
        caption: 'Les billets de 5 €, 10 €, 20 € et 50 €.',
      },
      'Pour compter une somme, je commence par les billets les **plus grands**, puis j’ajoute les pièces.',
      { kind: 'money', values: [1000, 500, 200, 100], caption: '10 + 5 + 2 + 1 = **18 €**' },
      'Il y a aussi des pièces en **centimes** (c). 100 centimes font **1 euro** : 1 € = 100 c.',
      {
        kind: 'money',
        values: [50, 20, 10, 5, 2, 1],
        caption: 'Les pièces de 50 c, 20 c, 10 c, 5 c, 2 c et 1 c.',
      },
    ],
  },
  {
    id: 'maths.mesures.payer',
    domain: 'maths.mesures',
    title: 'Payer et rendre la monnaie',
    grades: ['CE1'],
    competence: 'Payer une somme avec des pièces et des billets, et calculer la monnaie rendue.',
    lesson: [
      'Pour payer **17 €**, je peux donner un billet de 10 €, un billet de 5 € et une pièce de 2 € : 10 + 5 + 2 = 17.',
      { kind: 'money', values: [1000, 500, 200] },
      'Je peux aussi payer autrement : 5 + 5 + 5 + 2 = 17. Le plus pratique, c’est de donner le **moins** de pièces et de billets possible.',
      'Si je donne **plus** que le prix, on me **rend la monnaie** : je calcule la différence.',
      {
        kind: 'example',
        lines: [
          'Le livre coûte **7 €**. Je donne un billet de **10 €**.',
          'On me rend 10 − 7 = **3 €**.',
        ],
      },
    ],
  },
];
