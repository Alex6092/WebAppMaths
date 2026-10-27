import type { Domain, LessonBlock, Notion } from '@app/core';
import { MOMENT_LABEL, MOMENTS } from './lib/conjugaison';
import { MOMENT_COLOR, PINK } from './lib/couleurs';
import { CLASS_DICTATIONS, classDictationNotion } from './lib/dictee-classe';
import { PAIRS, type HomophonePair } from './lib/homophones';
import { capitalize, indicatorsOf } from './lib/indicateurs';
import { RULE_TEXT } from './lib/pluriel';

export const domains: Domain[] = [
  { id: 'francais.conjugaison', subject: 'francais', title: 'Conjugaison', icon: '⏳', order: 1 },
  { id: 'francais.grammaire', subject: 'francais', title: 'Grammaire', icon: '🧱', order: 2 },
  { id: 'francais.orthographe', subject: 'francais', title: 'Orthographe', icon: '✏️', order: 3 },
  { id: 'francais.vocabulaire', subject: 'francais', title: 'Vocabulaire', icon: '📚', order: 4 },
  { id: 'francais.lecture', subject: 'francais', title: 'Lecture', icon: '👀', order: 5 },
];

// CONJ 1 : le verbe, forme infinitive et conjuguée.
const CONJ1_LESSON: LessonBlock[] = [
  'Le **verbe à l’infinitif** est le verbe « tout seul », comme dans le dictionnaire. On peut dire « il faut… » devant lui : il faut *chanter*.',
  'Le **verbe conjugué** change selon la personne et le moment. Devant lui, il y a une personne : je, tu, il, Léa, les enfants…',
  {
    kind: 'table',
    columns: [
      { title: 'à l’infinitif', color: PINK[0]!.color, cells: ['chanter', 'finir', 'prendre'] },
      { title: 'conjugué', cells: ['je chante', 'nous finissons', 'tu prendras'] },
    ],
  },
  'Dans une phrase, je **souligne** le verbe conjugué :',
  { kind: 'example', lines: ['*Les enfants __plongent__ dans la piscine.*'] },
  'Pour trouver l’infinitif, je dis « il faut… » :',
  {
    kind: 'example',
    lines: ['nous plongeons → il faut **plonger**', 'tu finis → il faut **finir**'],
  },
];

// CONJ 2 : les temps, passé, présent, futur (la frise et le tableau de la fiche de l'école).
const CONJ2_LESSON: LessonBlock[] = [
  'Dans une phrase, le **verbe conjugué** indique le **moment** où se passe l’action.',
  {
    kind: 'timeline',
    steps: [
      {
        title: 'passé',
        color: MOMENT_COLOR.passe,
        text: 'ce qui s’est passé **AVANT** : *L’année dernière, j’__allais__ à l’école.*',
      },
      {
        title: 'présent',
        color: MOMENT_COLOR.present,
        text: 'ce qui se passe **MAINTENANT** : *Aujourd’hui, je __vais__ à l’école.*',
      },
      {
        title: 'futur',
        color: MOMENT_COLOR.futur,
        text: 'ce qui se passera **APRÈS** : *Demain, j’__irai__ à l’école.*',
      },
    ],
  },
  'Pour connaître le temps d’une action, je repère le **temps du verbe** : *il chantait* → on dit « hier il chantait » → passé.',
  'Je repère aussi les **indicateurs de temps** :',
  {
    kind: 'table',
    columns: MOMENTS.map((m) => ({
      title: MOMENT_LABEL[m],
      color: MOMENT_COLOR[m],
      cells: indicatorsOf(m, true).map((i) => i.text.replace("'", '’')),
    })),
  },
];

// Leçon « La phrase » du cahier.
const PHRASE_LESSON: LessonBlock[] = [
  'Une **phrase** est une suite de mots qui **veut dire quelque chose** : elle a un **sens**.',
  'Elle commence par une **MAJUSCULE** et se termine par un **point**.',
  { kind: 'example', lines: ['*__J__e vais à la piscine__.__*'] },
  'Attention : l’**ordre des mots** compte ! Quand les mots sont mélangés, la phrase ne veut plus rien dire.',
  {
    kind: 'example',
    lines: [
      '*Aujourd’hui mange une je glace.* → ce n’est pas une phrase',
      '*Aujourd’hui je mange une glace.* → c’est une phrase',
    ],
  },
];

// Leçon « La ponctuation » du cahier.
const PONCTUATION_LESSON: LessonBlock[] = [
  'Les **points** disent **comment lire** la phrase : où faire une pause, et si la voix **descend** ou **monte**.',
  {
    kind: 'list',
    items: [
      '**.** Le **point** : la phrase **donne une information**. La voix descend. *Tom lit un livre.*',
      '**!** Le **point d’exclamation** : pour un **ordre** ou une **émotion** (joie, surprise, peur…). *Waouh, quel beau dessin !*',
      '**?** Le **point d’interrogation** : la phrase **pose une question**. La voix monte. *Où est mon cartable ?*',
    ],
  },
];

// Leçon « Les familles de mots » du cahier.
const FAMILLES_LESSON: LessonBlock[] = [
  'Une **famille de mots**, ce sont tous les mots fabriqués à partir d’un **même mot**. Ils font penser à la **même idée**.',
  'Les mots d’une même famille ont une **partie commune** :',
  {
    kind: 'example',
    lines: [
      '**jardin** → **jardin**ier, **jardin**er, **jardin**age',
      '**nage** → **nage**ur, **nage**oire',
    ],
  },
  'On fabrique les mots de la famille en **ajoutant des lettres** au début ou à la fin du mot :',
  {
    kind: 'example',
    lines: [
      'à la fin : fleur → fleur__iste__, fleur__ir__',
      'au début : faire → __dé__faire, __re__faire',
      'au début et à la fin : terre → __at__terr__ir__',
    ],
  },
];

/** La leçon d'une paire d'homophones : l'astuce de chaque mot, et un exemple de chacun. */
function homophoneLesson(pair: HomophonePair): LessonBlock[] {
  const [a, b] = pair.words;
  const example = (word: 0 | 1) => {
    const sentence = pair.sentences[word][0]!.replace('{N}', 'Léa').replace('{M}', 'Tom');
    const form = sentence.startsWith('___') ? capitalize(pair.words[word]) : pair.words[word];
    return sentence.replace('___', `**${form}**`);
  };
  return [
    `« ${a} » et « ${b} » se disent pareil, mais ne s’écrivent pas pareil. Pour choisir, j’essaie de remplacer par un autre mot :`,
    { kind: 'list', items: [...pair.tips] },
    { kind: 'example', lines: [example(0), example(1)] },
  ];
}

const homophoneNotion = (pair: HomophonePair): Notion => ({
  id: `francais.orthographe.${pair.id}`,
  domain: 'francais.orthographe',
  title: `« ${pair.words[0]} » ou « ${pair.words[1]} »`,
  grades: ['CE1'],
  competence: `Choisir entre « ${pair.words[0]} » et « ${pair.words[1]} ».`,
  lesson: homophoneLesson(pair),
});

const PLURIEL_LESSON: LessonBlock[] = [
  'Le **singulier**, c’est **un seul** : un chat, la fleur. Le **pluriel**, c’est **plusieurs** : des chats, les fleurs.',
  'Le petit mot devant le nom m’aide : un, une, le, la, mon… pour un seul ; des, les, mes, deux… pour plusieurs.',
  {
    kind: 'table',
    columns: [
      { title: 'singulier', color: '#e3f2fd', cells: ['un chat', 'un gâteau', 'une souris'] },
      {
        title: 'pluriel',
        color: '#fce4ec',
        cells: ['des chat**s**', 'des gâteau**x**', 'des souris'],
      },
    ],
  },
  { kind: 'list', items: [RULE_TEXT.s, RULE_TEXT.x, RULE_TEXT.same] },
  `Au CE2 : ${RULE_TEXT.aux.charAt(0).toLowerCase()}${RULE_TEXT.aux.slice(1)} (un cheval → des chevaux)`,
];

const ACCORD_LESSON: LessonBlock[] = [
  'Dans un groupe de mots, le petit mot, le nom et l’adjectif **vont ensemble**.',
  'S’il y en a **plusieurs**, ils prennent tous la marque du pluriel :',
  {
    kind: 'example',
    lines: [
      'un ballon rouge → des ballon**s** rouge**s**',
      'une petite fleur → les petite**s** fleur**s**',
    ],
  },
];

const DICTEE_LESSON: LessonBlock[] = [
  'Pour bien écrire sous la dictée :',
  {
    kind: 'list',
    ordered: true,
    items: [
      'j’**écoute** le mot ou la phrase (je peux réécouter) ;',
      'je le **redis** dans ma tête et j’écoute **chaque son** : [ou], [on], [an], [oi]… ;',
      'j’**écris** un mot dans chaque case ;',
      'je **relis** : les accents, la majuscule au début de la phrase.',
    ],
  },
  {
    kind: 'example',
    lines: ['[on] : un ball**on**, un bonb**on**', '[oi] : un r**oi**, une ét**oi**le'],
  },
];

const ALPHABET_LESSON: LessonBlock[] = [
  'Dans le dictionnaire, les mots sont rangés dans l’**ordre alphabétique** : a b c d e f g h i j k l m n o p q r s t u v w x y z.',
  'Je regarde la **1re lettre** : *chat* est avant *lapin*, car c est avant l.',
  'Si la 1re lettre est la même, je regarde la **2e lettre** : *balle* est avant *bille*, car a est avant i.',
  { kind: 'example', lines: ['avion – chat – lapin – zèbre', 'balle – bébé – bille – bol'] },
];

const SYNONYMES_LESSON: LessonBlock[] = [
  'Des **synonymes** sont des mots qui veulent dire **presque la même chose**. Je peux remplacer l’un par l’autre dans une phrase.',
  {
    kind: 'example',
    lines: [
      'Léa est **contente**. → Léa est **heureuse**.',
      'une voiture = une auto ; finir = terminer',
    ],
  },
];

// La lettre T, d'après la fiche de la dictée 4 de la classe.
const LETTRE_T_LESSON: LessonBlock[] = [
  'La lettre **t** ne se prononce pas toujours de la même façon :',
  {
    kind: 'table',
    columns: [
      { title: 'j’entends [t]', color: '#e3f2fd', cells: ['une car**t**e', 'l’his**t**oire'] },
      { title: 'j’entends [s]', color: '#fce4ec', cells: ['la pollu**t**ion', 'spa**t**ial'] },
      { title: 'je ne l’entends pas', color: '#eeeeee', cells: ['souven**t**', 'le spor**t**'] },
    ],
  },
  'Devant **-ion**, **-ie**, **-iel**, **-ial**, le t se dit souvent [s] : une émotion, la patience.',
  'À la fin d’un mot, le t est souvent **muet**. Pour le trouver, je cherche un mot de la même famille, ou le féminin :',
  {
    kind: 'example',
    lines: [
      'sauter → un sau**t** ; chanter → un chan**t**',
      'petite → peti**t** ; forte → for**t**',
    ],
  },
];

const CONTRAIRES_LESSON: LessonBlock[] = [
  'Des **contraires** sont des mots qui veulent dire **l’inverse**.',
  { kind: 'example', lines: ['chaud ≠ froid ; ouvrir ≠ fermer ; le jour ≠ la nuit'] },
  'Parfois, on fait le contraire en ajoutant un petit mot devant : **in**-, **im**- (devant p, b, m), **dé**-, **mal**-, **mé**-.',
  {
    kind: 'example',
    lines: ['possible → **im**possible ; faire → **dé**faire ; heureux → **mal**heureux'],
  },
];

export const notions: Notion[] = [
  {
    id: 'francais.conjugaison.infinitif-conjugue',
    domain: 'francais.conjugaison',
    title: 'Verbe à l’infinitif ou conjugué',
    grades: ['CE1'],
    competence: 'Distinguer verbes à l’infinitif et verbes conjugués.',
    lesson: CONJ1_LESSON,
  },
  {
    id: 'francais.conjugaison.verbe-conjugue-phrase',
    domain: 'francais.conjugaison',
    title: 'Le verbe conjugué dans la phrase',
    grades: ['CE1'],
    competence: 'Identifier le verbe conjugué dans une phrase.',
    lesson: CONJ1_LESSON,
  },
  {
    id: 'francais.conjugaison.donner-infinitif',
    domain: 'francais.conjugaison',
    title: 'Donner l’infinitif',
    grades: ['CE1'],
    competence: 'Donner l’infinitif d’un verbe conjugué.',
    lesson: CONJ1_LESSON,
  },
  {
    id: 'francais.conjugaison.passe-present-futur',
    domain: 'francais.conjugaison',
    title: 'Passé, présent, futur',
    grades: ['CE1'],
    competence: 'Savoir ce que sont le passé, le présent et le futur.',
    lesson: CONJ2_LESSON,
  },
  {
    id: 'francais.conjugaison.indicateurs-temps',
    domain: 'francais.conjugaison',
    title: 'Les indicateurs de temps',
    grades: ['CE1'],
    competence: 'Repérer les indicateurs de temps.',
    lesson: CONJ2_LESSON,
  },
  {
    id: 'francais.conjugaison.temps-du-verbe',
    domain: 'francais.conjugaison',
    title: 'Le temps du verbe conjugué',
    grades: ['CE1'],
    competence: 'Reconnaître le temps grâce au verbe conjugué.',
    lesson: CONJ2_LESSON,
  },
  {
    id: 'francais.conjugaison.bon-temps',
    domain: 'francais.conjugaison',
    title: 'Utiliser le bon temps',
    grades: ['CE1'],
    competence: 'Utiliser le bon temps dans une phrase.',
    lesson: CONJ2_LESSON,
  },
  {
    id: 'francais.grammaire.phrase',
    domain: 'francais.grammaire',
    title: 'Reconnaître une phrase',
    grades: ['CE1'],
    competence: 'Reconnaître une phrase : elle a un sens, une majuscule et un point.',
    lesson: PHRASE_LESSON,
  },
  {
    id: 'francais.grammaire.ordre-mots',
    domain: 'francais.grammaire',
    title: 'Remettre les mots dans l’ordre',
    grades: ['CE1'],
    competence: 'Remettre les mots d’une phrase dans l’ordre.',
    lesson: PHRASE_LESSON,
  },
  {
    id: 'francais.grammaire.ponctuation',
    domain: 'francais.grammaire',
    title: 'La ponctuation',
    grades: ['CE1'],
    competence: 'Utiliser le point, le point d’exclamation et le point d’interrogation.',
    lesson: PONCTUATION_LESSON,
  },
  {
    id: 'francais.vocabulaire.familles',
    domain: 'francais.vocabulaire',
    title: 'Les familles de mots',
    grades: ['CE1'],
    competence: 'Trouver les mots d’une même famille.',
    lesson: FAMILLES_LESSON,
  },
  ...Object.values(PAIRS).map(homophoneNotion),
  {
    id: 'francais.orthographe.pluriel',
    domain: 'francais.orthographe',
    title: 'Le singulier et le pluriel',
    grades: ['CE1'],
    competence: 'Distinguer le singulier et le pluriel, et écrire un nom au pluriel.',
    lesson: PLURIEL_LESSON,
  },
  {
    id: 'francais.orthographe.accord',
    domain: 'francais.orthographe',
    title: 'L’accord dans le groupe de mots',
    grades: ['CE1'],
    competence: 'Accorder le nom et l’adjectif dans le groupe nominal.',
    lesson: ACCORD_LESSON,
  },
  {
    id: 'francais.orthographe.dictee',
    domain: 'francais.orthographe',
    title: 'La dictée',
    grades: ['CE1'],
    competence: 'Écrire sous la dictée des mots et des phrases courtes.',
    lesson: DICTEE_LESSON,
  },
  {
    id: 'francais.vocabulaire.ordre-alphabetique',
    domain: 'francais.vocabulaire',
    title: 'L’ordre alphabétique',
    grades: ['CE1'],
    competence: 'Ranger des mots dans l’ordre alphabétique.',
    lesson: ALPHABET_LESSON,
  },
  {
    id: 'francais.vocabulaire.synonymes',
    domain: 'francais.vocabulaire',
    title: 'Les synonymes',
    grades: ['CE1'],
    competence: 'Trouver un mot qui veut dire presque la même chose.',
    lesson: SYNONYMES_LESSON,
  },
  {
    id: 'francais.vocabulaire.contraires',
    domain: 'francais.vocabulaire',
    title: 'Les contraires',
    grades: ['CE1'],
    competence: 'Trouver le contraire d’un mot.',
    lesson: CONTRAIRES_LESSON,
  },
  {
    id: 'francais.orthographe.lettre-t',
    domain: 'francais.orthographe',
    title: 'La lettre t',
    grades: ['CE1'],
    competence: 'Savoir que la lettre t fait [t], [s], ou ne s’entend pas.',
    lesson: LETTRE_T_LESSON,
  },
  ...CLASS_DICTATIONS.map(classDictationNotion),
];
