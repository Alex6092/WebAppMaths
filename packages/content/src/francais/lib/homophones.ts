import { defineLevels, definePlugin, type Blank, type Rng } from '@app/core';
import { capitalize } from './indicateurs';
import { FIRST_NAMES } from './sujets';

/**
 * Les homophones du CE1 : deux mots qui se disent pareil et s'écrivent autrement (a / à,
 * et / est, on / ont, son / sont). Chaque phrase a un trou « ___ » et le mot qui va dedans ;
 * {N} et {M} sont remplacés par deux prénoms différents.
 */

export interface HomophonePair {
  id: string;
  /** Les deux mots, dans l'ordre de la leçon. */
  words: [string, string];
  /** L'astuce de chaque mot : « On peut dire avait. » */
  tips: [string, string];
  /** Les phrases de chaque mot. */
  sentences: [string[], string[]];
  icon: string;
}

export const PAIRS = {
  a: {
    id: 'a-a',
    words: ['a', 'à'],
    tips: [
      'On peut dire « avait » à la place : c’est le verbe avoir, on écrit **a** sans accent.',
      'On ne peut pas dire « avait » : on écrit **à** avec un accent.',
    ],
    sentences: [
      [
        '{N} ___ un chat noir.',
        '{N} ___ sept ans.',
        'Mon frère ___ un vélo rouge.',
        '{N} ___ perdu sa gomme.',
        'Le chien ___ faim.',
        '{N} ___ mal au ventre.',
        'Papa ___ une voiture bleue.',
        'La maîtresse ___ un grand sac.',
        '{N} ___ trouvé un trésor.',
        'Le chat ___ mangé la souris.',
        'Mamie ___ fait un gâteau.',
        '{N} ___ froid aux mains.',
        'Le lapin ___ de grandes oreilles.',
      ],
      [
        '{N} va ___ l’école.',
        'Nous allons ___ la piscine.',
        '{N} joue ___ cache-cache.',
        'Le train part ___ huit heures.',
        '{N} habite ___ Lyon.',
        'Je donne un bonbon ___ {N}.',
        'Nous jouons ___ la marelle.',
        '{N} rentre ___ la maison.',
        'Le film commence ___ midi.',
        '{N} écrit une lettre ___ {M}.',
        'Les enfants vont ___ la plage.',
        'Le goûter est ___ quatre heures.',
        '{N} pense ___ son anniversaire.',
      ],
    ],
    icon: '🅰️',
  },
  et: {
    id: 'et-est',
    words: ['et', 'est'],
    tips: [
      'On peut dire « et puis » à la place : on écrit **et**.',
      'On peut dire « était » à la place : c’est le verbe être, on écrit **est**.',
    ],
    sentences: [
      [
        '{N} ___ {M} jouent au ballon.',
        'J’aime les pommes ___ les poires.',
        'Il prend son sac ___ son manteau.',
        'Le chat ___ le chien dorment.',
        '{N} mange ___ boit.',
        'Papa ___ maman sont au jardin.',
        'Il fait froid ___ il pleut.',
        'Je prends un crayon ___ une gomme.',
        'Le lion ___ le tigre rugissent.',
        '{N} lit ___ dessine.',
        'Nous chantons ___ nous dansons.',
        'Il y a du pain ___ du fromage.',
      ],
      [
        '{N} ___ malade.',
        'Le ciel ___ bleu.',
        'La soupe ___ chaude.',
        'Mon chat ___ noir.',
        '{N} ___ à la piscine.',
        'Le gâteau ___ délicieux.',
        'La porte ___ ouverte.',
        '{N} ___ en retard.',
        'Le bébé ___ endormi.',
        'La mer ___ calme.',
        'Le loup ___ méchant.',
        'Ce livre ___ à {N}.',
      ],
    ],
    icon: '🔗',
  },
  on: {
    id: 'on-ont',
    words: ['on', 'ont'],
    tips: [
      'On peut dire « il » à la place : on écrit **on**.',
      'On peut dire « avaient » à la place : c’est le verbe avoir, on écrit **ont**.',
    ],
    sentences: [
      [
        '___ va au cinéma.',
        'Demain, ___ part en vacances.',
        '___ mange des crêpes.',
        'À la récré, ___ joue aux billes.',
        'Le soir, ___ lit une histoire.',
        '___ entend les oiseaux.',
        'Avec {N}, ___ fait un gâteau.',
        '___ chante une chanson.',
        'Ce matin, ___ arrose les fleurs.',
        'Dans la cour, ___ court très vite.',
        'Le dimanche, ___ va chez mamie.',
        '___ regarde les étoiles.',
      ],
      [
        'Les enfants ___ faim.',
        '{N} et {M} ___ un chat.',
        'Mes parents ___ une voiture.',
        'Les oiseaux ___ des plumes.',
        'Ils ___ perdu leur ballon.',
        'Les élèves ___ fini.',
        'Mes cousins ___ un chien.',
        'Elles ___ froid.',
        'Les chats ___ des moustaches.',
        'Les filles ___ gagné le match.',
        'Les lapins ___ de longues oreilles.',
        'Mes amis ___ un cadeau pour {N}.',
      ],
    ],
    icon: '👥',
  },
  son: {
    id: 'son-sont',
    words: ['son', 'sont'],
    tips: [
      'On peut dire « mon » à la place : on écrit **son**.',
      'On peut dire « étaient » à la place : c’est le verbe être, on écrit **sont**.',
    ],
    sentences: [
      [
        '{N} range ___ cartable.',
        'Il promène ___ chien.',
        '{N} cherche ___ doudou.',
        'Le chat mange dans ___ bol.',
        '{N} prête ___ vélo à {M}.',
        'Elle met ___ manteau.',
        'Papa lave ___ auto.',
        '{N} fête ___ anniversaire.',
        'Il a cassé ___ crayon.',
        '{N} lit ___ livre.',
        'Le chien remue ___ oreille.',
        'Mamie arrose ___ jardin.',
      ],
      [
        'Les enfants ___ dans la cour.',
        'Mes amis ___ gentils.',
        'Les fleurs ___ belles.',
        '{N} et {M} ___ à la piscine.',
        'Les pommes ___ rouges.',
        'Ils ___ fatigués.',
        'Les chats ___ sur le toit.',
        'Les élèves ___ sages.',
        'Mes chaussures ___ sales.',
        'Les nuages ___ gris.',
        'Les biscuits ___ dans la boîte.',
        'Mes cousins ___ chez {N}.',
      ],
    ],
    icon: '🔊',
  },
} as const satisfies Record<string, HomophonePair>;

/** Les prénoms à la place de {N} et {M}. */
export function withNames(rng: Rng, sentence: string): string {
  const [n, m] = rng.sample(FIRST_NAMES, 2);
  return sentence.replace('{N}', n!).replace('{M}', m!);
}

/** « {0} va au cinéma. » : en début de phrase, les étiquettes prennent une majuscule. */
function blankIn(sentence: string, index: number): { text: string; start: boolean } {
  return { text: sentence.replace('___', `{${index}}`), start: sentence.startsWith('___') };
}

interface Params {
  /** one : une phrase ; both : deux phrases, une de chaque mot ; typed : le mot à écrire. */
  mode: 'one' | 'both' | 'typed';
}

interface Data {
  /** Le bon mot de chaque trou (0 ou 1), et s'il commence la phrase. */
  answers: { word: 0 | 1; start: boolean }[];
}

/** Le type d'exercice d'une paire : « COMPLÈTE avec a ou à ». */
export function homophonePlugin(pair: HomophonePair) {
  const [w0, w1] = pair.words;
  const form = (word: 0 | 1, start: boolean) =>
    start ? capitalize(pair.words[word]) : pair.words[word];
  return definePlugin<'fill-blank', Params, Data>('fill-blank', {
    id: `francais.orthographe.${pair.id}`,
    version: 1,
    title: `« ${w0} » ou « ${w1} » ?`,
    description: `Complète avec « ${w0} » ou « ${w1} ».`,
    icon: pair.icon,
    notions: [`francais.orthographe.${pair.id}`],
    expectedLevel: 2,
    levels: defineLevels<Params>([
      { label: 'Une phrase', grade: 'CE1', params: { mode: 'one' } },
      { label: 'Les deux mots', grade: 'CE1', params: { mode: 'both' } },
      { label: 'Le mot à écrire', grade: 'CE1', params: { mode: 'typed' } },
    ]),

    generate({ rng, params }) {
      const words: (0 | 1)[] =
        params.mode === 'both' ? rng.shuffle([0, 1] as const) : [rng.pick([0, 1] as const)];
      const parts = words.map((word, i) =>
        blankIn(withNames(rng, rng.pick(pair.sentences[word])), i),
      );
      const blanks: Blank[] = parts.map(({ start }) =>
        params.mode === 'typed'
          ? { kind: 'text', size: 5 }
          : { kind: 'choice', options: [form(0, start), form(1, start)] },
      );
      return {
        widget: 'fill-blank',
        instruction:
          params.mode === 'typed'
            ? `ÉCRIS « ${w0} » ou « ${w1} ».`
            : `COMPLÈTE avec « ${w0} » ou « ${w1} ».`,
        prompt: parts.map((p) => p.text).join('\n'),
        blanks,
        data: { answers: words.map((word, i) => ({ word, start: parts[i]!.start })) },
      };
    },

    solve: (q) => ({ values: q.data.answers.map((a) => form(a.word, a.start)) }),

    explain: (q) =>
      q.data.answers
        .map((a) => pair.tips[a.word].replace(/\*\*/g, ''))
        .filter((tip, i, all) => all.indexOf(tip) === i)
        .join(' '),
  });
}
