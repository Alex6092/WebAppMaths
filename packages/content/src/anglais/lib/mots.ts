import { defineLevels, definePlugin, type LessonBlock, type Notion } from '@app/core';

/**
 * Le vocabulaire d'anglais du CE1, à l'oral d'abord : on écoute le mot et on touche l'image.
 * Le mot écrit n'arrive qu'au dernier niveau. Un thème = une notion et un exercice.
 */

/** La voix anglaise : l'accent britannique, comme à l'école. */
export const ENGLISH = 'en-GB';

export interface Word {
  /** Le mot anglais : « red ». */
  en: string;
  /** Son sens : « rouge ». */
  fr: string;
  icon?: string;
}

export interface Theme {
  /** anglais.vocabulaire.couleurs */
  id: string;
  domain: 'anglais.vocabulaire' | 'anglais.ecoute';
  /** « Les couleurs » */
  title: string;
  icon: string;
  words: Word[];
  /** Au premier niveau, seulement les premiers mots (one à ten). */
  easy?: number;
}

const word = (en: string, fr: string, icon?: string): Word =>
  icon ? { en, fr, icon } : { en, fr };

export const COLOURS: Theme = {
  id: 'anglais.vocabulaire.couleurs',
  domain: 'anglais.vocabulaire',
  title: 'Les couleurs',
  icon: '🎨',
  words: [
    word('red', 'rouge', '❤️'),
    word('blue', 'bleu', '💙'),
    word('green', 'vert', '💚'),
    word('yellow', 'jaune', '💛'),
    word('orange', 'orange', '🧡'),
    word('purple', 'violet', '💜'),
    word('pink', 'rose', '🩷'),
    word('black', 'noir', '🖤'),
    word('white', 'blanc', '🤍'),
    word('brown', 'marron', '🤎'),
    word('grey', 'gris', '🩶'),
  ],
};

const NUMBER_WORDS = [
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
  'twenty',
];

export const NUMBERS: Theme = {
  id: 'anglais.vocabulaire.nombres',
  domain: 'anglais.vocabulaire',
  title: 'Les nombres jusqu’à 20',
  icon: '🔢',
  words: NUMBER_WORDS.map((en, i) => word(en, String(i + 1))),
  easy: 10,
};

export const ANIMALS: Theme = {
  id: 'anglais.vocabulaire.animaux',
  domain: 'anglais.vocabulaire',
  title: 'Les animaux',
  icon: '🐶',
  words: [
    word('a dog', 'un chien', '🐕'),
    word('a cat', 'un chat', '🐈'),
    word('a bird', 'un oiseau', '🐦'),
    word('a fish', 'un poisson', '🐟'),
    word('a horse', 'un cheval', '🐎'),
    word('a cow', 'une vache', '🐄'),
    word('a pig', 'un cochon', '🐖'),
    word('a rabbit', 'un lapin', '🐇'),
    word('a mouse', 'une souris', '🐁'),
    word('a duck', 'un canard', '🦆'),
    word('a sheep', 'un mouton', '🐑'),
    word('a lion', 'un lion', '🦁'),
    word('an elephant', 'un éléphant', '🐘'),
    word('a monkey', 'un singe', '🐒'),
    word('a frog', 'une grenouille', '🐸'),
  ],
};

export const FAMILY: Theme = {
  id: 'anglais.vocabulaire.famille',
  domain: 'anglais.vocabulaire',
  title: 'La famille',
  icon: '👨‍👩‍👧',
  words: [
    word('mum', 'maman', '👩'),
    word('dad', 'papa', '👨'),
    word('sister', 'la sœur', '👧'),
    word('brother', 'le frère', '👦'),
    word('baby', 'le bébé', '👶'),
    word('grandma', 'mamie', '👵'),
    word('grandpa', 'papi', '👴'),
  ],
};

export const DAYS: Theme = {
  id: 'anglais.vocabulaire.jours',
  domain: 'anglais.vocabulaire',
  title: 'Les jours de la semaine',
  icon: '📅',
  words: [
    word('Monday', 'lundi'),
    word('Tuesday', 'mardi'),
    word('Wednesday', 'mercredi'),
    word('Thursday', 'jeudi'),
    word('Friday', 'vendredi'),
    word('Saturday', 'samedi'),
    word('Sunday', 'dimanche'),
  ],
};

export const GREETINGS: Theme = {
  id: 'anglais.ecoute.salutations',
  domain: 'anglais.ecoute',
  title: 'Dire bonjour, se présenter',
  icon: '👋',
  words: [
    word('Hello!', 'Bonjour !', '👋'),
    word('Goodbye!', 'Au revoir !', '🚶'),
    word('Good night!', 'Bonne nuit !', '🌙'),
    word('Thank you!', 'Merci !', '🎁'),
    word('Please.', 'S’il te plaît.', '🙏'),
    word('Yes.', 'Oui.', '👍'),
    word('No.', 'Non.', '👎'),
    word('Sorry!', 'Pardon !', '😔'),
    word('How are you?', 'Comment vas-tu ?', '🙂'),
    word('I’m fine.', 'Je vais bien.', '😀'),
    word('What’s your name?', 'Comment t’appelles-tu ?', '❓'),
    word('Happy birthday!', 'Joyeux anniversaire !', '🎂'),
  ],
};

export const THEMES: readonly Theme[] = [COLOURS, NUMBERS, ANIMALS, FAMILY, DAYS, GREETINGS];

export const themeNotion = (theme: Theme): Notion => ({
  id: theme.id,
  domain: theme.domain,
  title: `${theme.title} en anglais`,
  grades: ['CE1'],
  competence: `Comprendre à l’oral : ${theme.title.charAt(0).toLowerCase()}${theme.title.slice(1)}.`,
  lesson: themeLesson(theme),
});

function themeLesson(theme: Theme): LessonBlock[] {
  return [
    'Touche un mot pour l’**écouter**, puis répète-le à voix haute.',
    {
      kind: 'words',
      lang: ENGLISH,
      items: theme.words.map((w) => ({
        word: w.en,
        meaning: w.fr,
        ...(w.icon ? { icon: w.icon } : {}),
      })),
    },
  ];
}

interface Params {
  choices: number;
  /** Seulement les premiers mots du thème. */
  easy: boolean;
  /** Le mot est écrit au lieu d'être dit. */
  read: boolean;
}

interface Data {
  answer: number;
}

/** « ÉCOUTE et COCHE la bonne image » : le mot est dit en anglais, l'enfant touche son image. */
export function listenPlugin(theme: Theme) {
  const pictures = theme.words.every((w) => w.icon);
  const what = pictures ? 'la bonne image' : 'la bonne réponse';
  return definePlugin<'mcq', Params, Data>('mcq', {
    id: theme.id,
    version: 1,
    title: `${theme.title} en anglais`,
    description: `Écoute le mot en anglais et touche ${what}.`,
    icon: theme.icon,
    notions: [theme.id],
    expectedLevel: 2,
    levels: defineLevels<Params>([
      {
        label: theme.easy ? `Écoute : jusqu’à ${theme.easy}` : 'Écoute : trois choix',
        grade: 'CE1',
        params: { choices: 3, easy: true, read: false },
      },
      {
        label: 'Écoute : quatre choix',
        grade: 'CE1',
        params: { choices: 4, easy: false, read: false },
      },
      {
        label: 'Lis le mot',
        grade: 'CE1',
        params: { choices: 4, easy: false, read: true },
      },
    ]),

    generate({ rng, params }) {
      const pool = theme.words
        .map((_, i) => i)
        .slice(0, params.easy && theme.easy ? theme.easy : undefined);
      const picked = rng.sample(pool, params.choices);
      const answer = rng.pick(picked);
      const { en } = theme.words[answer]!;
      const choices = (theme.easy ? picked.sort((a, b) => a - b) : picked).map((i) => {
        const w = theme.words[i]!;
        return { id: String(i), label: w.fr, ...(w.icon ? { icon: w.icon } : {}) };
      });
      const listen = params.read ? {} : { listen: en, listenLang: ENGLISH };
      return {
        widget: 'mcq',
        instruction: params.read
          ? `LIS le mot anglais et COCHE ${what}.`
          : `ÉCOUTE et COCHE ${what}.`,
        ...listen,
        ...(params.read ? { prompt: en } : {}),
        choices,
        multiple: false,
        // Les phrases (« Comment vas-tu ? ») une par ligne ; les mots en grille.
        layout: choices.some((c) => c.label.length > 12) ? 'list' : 'grid',
        data: { answer },
      };
    },

    solve: (q) => ({ selected: [String(q.data.answer)] }),

    explain: (q) => {
      const w = theme.words[q.data.answer]!;
      return `« ${w.en} » veut dire « ${w.fr} ».`;
    },
  });
}
