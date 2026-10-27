import type { Domain, LessonBlock, Notion } from '@app/core';
import { FAMILY_LABEL, FOOD_FAMILIES, FOODS } from './lib/aliments';
import { BABIES, COVER_LABEL, LIFE_CYCLES } from './lib/animaux';
import { CHANGE_RULE, STATE_ICON, WATERS } from './lib/eau';
import {
  DAY_MOMENTS,
  DAYS,
  LIFE_STAGES,
  MONTHS,
  SEASON_COLOR,
  SEASON_ICON,
  SEASON_LABEL,
  SEASON_SCENES,
  SEASONS,
} from './lib/temps';
import { PLANT_PARTS, SENSES } from './lib/vivant';

export const domains: Domain[] = [
  { id: 'qlm.temps', subject: 'qlm', title: 'Se repérer dans le temps', icon: '🕰️', order: 1 },
  { id: 'qlm.espace', subject: 'qlm', title: 'Se repérer dans l’espace', icon: '🧭', order: 2 },
  { id: 'qlm.vivant', subject: 'qlm', title: 'Le vivant', icon: '🌱', order: 3 },
  { id: 'qlm.matiere', subject: 'qlm', title: 'La matière', icon: '💧', order: 4 },
];

const cell = (name: string) => {
  const food = FOODS.find((f) => f.name === name)!;
  return `${food.icon} ${food.name}`;
};

// SCI 2, leçon 1 : d'où proviennent nos aliments ?
const ORIGINE_LESSON: LessonBlock[] = [
  'Nos aliments viennent de l’**agriculture** (fruits, légumes, céréales), de l’**élevage** (lait, œufs, viande) ou de la **pêche** (poissons).',
  'Ils ont des **origines** différentes :',
  {
    kind: 'table',
    columns: [
      {
        title: 'origine animale',
        cells: ['le poulet', 'les œufs', 'le lait', 'le poisson'].map(cell),
      },
      {
        title: 'origine végétale',
        cells: ['la salade', 'la pomme', 'le riz', 'la carotte'].map(cell),
      },
      { title: 'origine minérale', cells: ['l’eau', 'le sel'].map(cell) },
    ],
  },
  'La plupart des aliments sont **transformés** : on les fabrique en mélangeant et en modifiant des aliments d’origines différentes. *La pizza, le gâteau, le pain…*',
];

// SCI 2, leçon 2 : les familles d'aliments (la fiche à classer).
const FAMILLES_LESSON: LessonBlock[] = [
  'Aucun aliment n’est interdit, mais il faut **manger varié** : un peu de chaque **famille d’aliments**, en bonnes **quantités**.',
  ...[FOOD_FAMILIES.slice(0, 3), FOOD_FAMILIES.slice(3)].map((families): LessonBlock => ({
    kind: 'table',
    columns: families.map((family) => ({
      title: FAMILY_LABEL[family],
      cells: FOODS.filter((f) => f.family === family)
        .slice(0, 4)
        .map((f) => `${f.icon} ${f.name}`),
    })),
  })),
];

const SEMAINE_LESSON: LessonBlock[] = [
  'Une **semaine** dure **7 jours**. Ils reviennent toujours dans le même ordre :',
  { kind: 'example', lines: [DAYS.join(', ')] },
  'Après dimanche, une nouvelle semaine commence : c’est de nouveau lundi. Le samedi et le dimanche, c’est le **week-end**.',
  {
    kind: 'timeline',
    steps: [
      { title: 'avant-hier', text: 'lundi', color: '#e3f2fd' },
      { title: 'hier', text: 'mardi', color: '#e3f2fd' },
      { title: 'aujourd’hui', text: '**mercredi**', color: '#fff8e1' },
      { title: 'demain', text: 'jeudi', color: '#e8f5e9' },
      { title: 'après-demain', text: 'vendredi', color: '#e8f5e9' },
    ],
  },
];

const MOIS_SAISONS_LESSON: LessonBlock[] = [
  'Une **année** dure **12 mois** :',
  { kind: 'list', ordered: true, items: [...MONTHS] },
  'Une année a aussi **4 saisons**. Chacune dure environ 3 mois et commence vers le 21 :',
  {
    kind: 'table',
    columns: SEASONS.map((season, i) => ({
      title: `${SEASON_ICON[season]} ${SEASON_LABEL[season]}`,
      color: SEASON_COLOR[season],
      cells: [
        `à partir du 21 ${MONTHS[2 + 3 * i]}`,
        ...SEASON_SCENES[season].slice(0, 2).map((scene) => `${scene.icon} ${scene.text}`),
      ],
    })),
  },
];

const CALENDRIER_LESSON: LessonBlock[] = [
  'Le **calendrier** montre les jours d’un mois. Chaque **colonne** est un jour de la semaine, chaque **ligne** est une semaine.',
  { kind: 'calendar', year: 2026, month: 10, marks: [27], caption: 'Le 27 est entouré.' },
  'Pour lire une date, je cherche le nombre, puis je regarde le jour **en haut de sa colonne** : *le 27 octobre 2026 est un mardi*.',
  'On écrit la date avec le jour, le nombre, le mois et l’année : *mardi 27 octobre 2026*.',
];

const CHRONOLOGIE_LESSON: LessonBlock[] = [
  'Le temps passe toujours dans le même sens : ce qui s’est passé **avant**, ce qui se passe **maintenant**, ce qui viendra **après**.',
  {
    kind: 'timeline',
    steps: [
      { title: 'avant', text: 'le passé', color: '#e3f2fd' },
      { title: 'maintenant', text: 'le présent', color: '#fff8e1' },
      { title: 'après', text: 'le futur', color: '#e8f5e9' },
    ],
  },
  {
    kind: 'list',
    items: [DAY_MOMENTS.steps.join(' → '), LIFE_STAGES.steps.join(' → ')],
  },
];

const VIVANT_LESSON: LessonBlock[] = [
  'Un **être vivant** naît, se nourrit, grandit, se reproduit et meurt. Les animaux, les plantes et les êtres humains sont vivants.',
  {
    kind: 'table',
    columns: [
      {
        title: 'vivant',
        color: '#e8f5e9',
        cells: ['🐈 le chat', '🌳 l’arbre', '🌰 la graine', '🍄 le champignon'],
      },
      {
        title: 'non vivant',
        color: '#eceff1',
        cells: ['🪨 le caillou', '🚗 la voiture', '🤖 le robot', '☁️ le nuage'],
      },
    ],
  },
  'Attention : une voiture ou un robot **bougent**, mais ils ne grandissent pas et ne se nourrissent pas. Une graine ne bouge pas, mais elle est **vivante** : elle peut germer.',
];

const ANIMAUX_LESSON: LessonBlock[] = [
  'On peut **classer** les animaux selon ce qui **couvre leur corps** :',
  {
    kind: 'table',
    columns: [
      { title: COVER_LABEL.poils, cells: ['🐈 le chat', '🐄 la vache', '🦁 le lion'] },
      { title: COVER_LABEL.plumes, cells: ['🐔 la poule', '🦉 le hibou', '🦆 le canard'] },
      { title: COVER_LABEL.ecailles, cells: ['🐟 le poisson', '🐍 le serpent', '🦎 le lézard'] },
    ],
  },
  'On peut aussi les classer selon leur façon de **se déplacer** : ils **marchent** (le chien), **volent** (le papillon), **nagent** (le dauphin) ou **rampent** (l’escargot).',
];

const CYCLES_LESSON: LessonBlock[] = [
  'Tous les êtres vivants **naissent**, **grandissent**, se **reproduisent** et **meurent** : c’est le **cycle de la vie**.',
  {
    kind: 'list',
    items: LIFE_CYCLES.map((c) => `**${c.title}** : ${c.steps.join(' → ')}`),
  },
  'Le petit d’un animal a souvent un nom à lui :',
  {
    kind: 'table',
    columns: [
      { title: 'l’animal', cells: BABIES.slice(0, 6).map((b) => `${b.icon} ${b.parent}`) },
      { title: 'son petit', cells: BABIES.slice(0, 6).map((b) => b.baby) },
    ],
  },
];

const PLANTES_LESSON: LessonBlock[] = [
  'Une plante est un **être vivant**. Pour vivre et grandir, elle a besoin d’**eau** 💧, de **lumière** ☀️ et de **chaleur** 🌡️.',
  'Sans eau, elle se fane. Dans le noir, elle jaunit. Dans le froid, la graine ne germe pas.',
  {
    kind: 'table',
    columns: [
      { title: 'la partie', cells: PLANT_PARTS.map((p) => `${p.icon} ${p.part}`) },
      { title: 'son rôle', cells: PLANT_PARTS.map((p) => p.role) },
    ],
  },
];

const SENS_LESSON: LessonBlock[] = [
  'Nous avons **cinq sens** pour découvrir le monde. Chacun a son **organe** :',
  {
    kind: 'table',
    columns: [
      { title: 'l’organe', cells: SENSES.map((s) => `${s.icon} ${s.organ}`) },
      { title: 'le sens', cells: SENSES.map((s) => s.sense) },
      { title: 'pour…', cells: ['voir', 'entendre', 'sentir les odeurs', 'goûter', 'toucher'] },
    ],
  },
];

const waters = (state: 'solide' | 'liquide') =>
  WATERS.filter((w) => w.state === state)
    .slice(0, 2)
    .map((w) => `${w.icon} ${w.name}`);

const ETATS_EAU_LESSON: LessonBlock[] = [
  'L’eau existe sous **trois états** :',
  {
    kind: 'table',
    columns: [
      {
        title: `${STATE_ICON.solide} solide`,
        color: '#e3f2fd',
        cells: ['elle garde sa forme', ...waters('solide')],
      },
      {
        title: `${STATE_ICON.liquide} liquide`,
        color: '#e0f7fa',
        cells: ['elle coule et prend la forme du récipient', ...waters('liquide')],
      },
      {
        title: `${STATE_ICON.gaz} gazeuse`,
        color: '#f3e5f5',
        cells: ['la vapeur d’eau', 'on ne la voit pas : elle est dans l’air'],
      },
    ],
  },
  { kind: 'list', items: Object.values(CHANGE_RULE) },
];

export const notions: Notion[] = [
  {
    id: 'qlm.temps.semaine',
    domain: 'qlm.temps',
    title: 'Les jours de la semaine',
    grades: ['CE1'],
    competence: 'Connaître les jours de la semaine ; se repérer avec hier, aujourd’hui, demain.',
    lesson: SEMAINE_LESSON,
  },
  {
    id: 'qlm.temps.mois-saisons',
    domain: 'qlm.temps',
    title: 'Les mois et les saisons',
    grades: ['CE1'],
    competence: 'Connaître les mois de l’année et les saisons.',
    lesson: MOIS_SAISONS_LESSON,
  },
  {
    id: 'qlm.temps.calendrier',
    domain: 'qlm.temps',
    title: 'Lire un calendrier',
    grades: ['CE1'],
    competence: 'Lire une date sur un calendrier ; compter des jours.',
    lesson: CALENDRIER_LESSON,
  },
  {
    id: 'qlm.temps.chronologie',
    domain: 'qlm.temps',
    title: 'Avant, après',
    grades: ['CE1'],
    competence: 'Ranger des moments et des événements dans l’ordre du temps.',
    lesson: CHRONOLOGIE_LESSON,
  },
  {
    id: 'qlm.vivant.vivant-non-vivant',
    domain: 'qlm.vivant',
    title: 'Vivant ou non vivant',
    grades: ['CE1'],
    competence: 'Distinguer le vivant du non-vivant.',
    lesson: VIVANT_LESSON,
  },
  {
    id: 'qlm.vivant.animaux',
    domain: 'qlm.vivant',
    title: 'Classer les animaux',
    grades: ['CE1'],
    competence: 'Classer les animaux selon ce qui couvre leur corps et leur façon de se déplacer.',
    lesson: ANIMAUX_LESSON,
  },
  {
    id: 'qlm.vivant.cycles',
    domain: 'qlm.vivant',
    title: 'Naître et grandir',
    grades: ['CE1'],
    competence: 'Connaître les étapes de la vie d’un animal et d’une plante.',
    lesson: CYCLES_LESSON,
  },
  {
    id: 'qlm.vivant.plantes',
    domain: 'qlm.vivant',
    title: 'Les besoins des plantes',
    grades: ['CE1'],
    competence: 'Connaître les besoins des plantes et les parties d’une plante.',
    lesson: PLANTES_LESSON,
  },
  {
    id: 'qlm.vivant.sens',
    domain: 'qlm.vivant',
    title: 'Les cinq sens',
    grades: ['CE1'],
    competence: 'Associer chaque sens à son organe.',
    lesson: SENS_LESSON,
  },
  {
    id: 'qlm.matiere.etats-eau',
    domain: 'qlm.matiere',
    title: 'Les états de l’eau',
    grades: ['CE1'],
    competence: 'Connaître les états de l’eau et ses changements d’état.',
    lesson: ETATS_EAU_LESSON,
  },
  {
    id: 'qlm.vivant.origine-aliments',
    domain: 'qlm.vivant',
    title: 'D’où viennent nos aliments ?',
    grades: ['CE1'],
    competence: 'Connaître l’origine des aliments : animale, végétale ou minérale.',
    lesson: ORIGINE_LESSON,
  },
  {
    id: 'qlm.vivant.familles-aliments',
    domain: 'qlm.vivant',
    title: 'Les familles d’aliments',
    grades: ['CE1'],
    competence: 'Classer les aliments en familles.',
    lesson: FAMILLES_LESSON,
  },
];
