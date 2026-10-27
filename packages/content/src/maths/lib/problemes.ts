import type { Rng } from '@app/core';
import { retry } from '../../lib/numbers';

/**
 * Problèmes à énoncés générés, comme sur les fiches « Résolution de problèmes » du cahier :
 * un énoncé (ce qu'on sait), une question (ce qu'on cherche) et une phrase-réponse.
 */

/** Commence par une voyelle : « d’élèves », « l’étagère » (mais « de yaourts »). */
const vowel = (word: string) => /^[aeiouàâéèêëîïôœû]/i.test(word);
/** « de » devant un nom : « de fleurs », « d’élèves ». */
export const de = (word: string) => (vowel(word) ? `d’${word}` : `de ${word}`);
/** « que Léa », « qu’Etan ». */
export const que = (name: string) => (vowel(name) ? `qu’${name}` : `que ${name}`);
/** Une espace insécable avant le point d'interrogation : il ne part pas seul à la ligne. */
const ASK = '\u00a0?';
export const capitalize = (text: string) => text.charAt(0).toLocaleUpperCase('fr') + text.slice(1);

/** Un lieu : le jardin, la classe, l’étagère. */
export interface Place {
  noun: string;
  f?: boolean;
  /** On est « sur » l'étagère, pas « dans ». */
  on?: boolean;
  /** Nombre le plus grand qu'on y trouve (pas 300 élèves dans une classe). */
  max: number;
}
/** « le jardin », « la classe », « l’étagère ». */
export const the = (p: Place) => (vowel(p.noun) ? `l’${p.noun}` : `${p.f ? 'la' : 'le'} ${p.noun}`);
/** L'article de « du jardin », « de la classe », « de l’étagère » (le nom vient après). */
export const ofArticle = (p: Place) => (vowel(p.noun) ? 'de l’' : p.f ? 'de la ' : 'du ');
/** « ce panier », « cette caisse », « cet enclos ». */
export const thisPlace = (p: Place) => `${p.f ? 'cette' : vowel(p.noun) ? 'cet' : 'ce'} ${p.noun}`;

/** Une sorte de choses : les tulipes (parmi les fleurs), les billes rouges (parmi les billes). */
export interface Sort {
  word: string;
  icon?: string;
  /** Pour « billes rouges » : « rouges » (« 12 billes sont rouges »). */
  adj?: string;
}

/** Un mot qui regroupe, ses sortes et les lieux où on les trouve. */
export interface Scene {
  whole: string;
  sorts: Sort[];
  places: Place[];
  /** Les mots qui regroupent aussi ces sortes : les fourmis sont aussi des animaux. */
  broader?: string[];
}

const sort = (word: string, icon?: string): Sort => ({ word, ...(icon ? { icon } : {}) });
/** « billes rouges » : la sorte, faite du mot qui regroupe et d'un adjectif. */
const tinted = (whole: string, adj: string, icon?: string): Sort => ({
  word: `${whole} ${adj}`,
  adj,
  ...(icon ? { icon } : {}),
});

export const SCENES: readonly Scene[] = [
  {
    whole: 'fleurs',
    sorts: [
      sort('tulipes', '🌷'),
      sort('roses', '🌹'),
      sort('marguerites', '🌼'),
      sort('tournesols', '🌻'),
    ],
    places: [
      { noun: 'jardin', max: 100 },
      { noun: 'vase', max: 30 },
      { noun: 'bouquet', max: 40 },
      { noun: 'jardinière', f: true, max: 30 },
    ],
  },
  {
    whole: 'fruits',
    sorts: [
      sort('pommes', '🍎'),
      sort('poires', '🍐'),
      sort('bananes', '🍌'),
      sort('oranges', '🍊'),
      sort('fraises', '🍓'),
      sort('cerises', '🍒'),
    ],
    places: [
      { noun: 'panier', max: 60 },
      { noun: 'corbeille', f: true, max: 40 },
      { noun: 'cagette', f: true, max: 80 },
    ],
  },
  {
    whole: 'jouets',
    sorts: [
      sort('petites voitures', '🚗'),
      sort('ours en peluche', '🧸'),
      sort('ballons', '⚽'),
      sort('robots', '🤖'),
      sort('poupées'),
      sort('figurines'),
    ],
    places: [
      { noun: 'coffre', max: 80 },
      { noun: 'caisse', f: true, max: 100 },
      { noun: 'chambre', f: true, max: 60 },
    ],
  },
  {
    whole: 'livres',
    sorts: [sort('BD'), sort('romans'), sort('albums'), sort('dictionnaires')],
    places: [
      { noun: 'bibliothèque', f: true, max: 100 },
      { noun: 'étagère', f: true, on: true, max: 80 },
    ],
  },
  {
    whole: 'animaux',
    sorts: [
      sort('vaches', '🐄'),
      sort('moutons', '🐑'),
      sort('poules', '🐔'),
      sort('cochons', '🐖'),
      sort('chèvres', '🐐'),
      sort('canards', '🦆'),
    ],
    places: [
      { noun: 'ferme', f: true, max: 100 },
      { noun: 'pré', max: 60 },
    ],
  },
  {
    whole: 'élèves',
    broader: ['personnes', 'enfants'],
    sorts: [sort('filles', '👧'), sort('garçons', '👦')],
    places: [
      { noun: 'classe', f: true, max: 30 },
      { noun: 'cour', f: true, max: 100 },
      { noun: 'cantine', f: true, max: 100 },
    ],
  },
  {
    whole: 'personnes',
    sorts: [sort('adultes'), sort('enfants')],
    places: [
      { noun: 'cinéma', max: 100 },
      { noun: 'bus', max: 60 },
      { noun: 'salle de spectacle', f: true, max: 100 },
    ],
  },
  {
    whole: 'billes',
    sorts: [
      tinted('billes', 'rouges', '🔴'),
      tinted('billes', 'vertes', '🟢'),
      tinted('billes', 'bleues', '🔵'),
      tinted('billes', 'jaunes', '🟡'),
    ],
    places: [
      { noun: 'sac', max: 100 },
      { noun: 'boîte', f: true, max: 100 },
      { noun: 'bocal', max: 100 },
    ],
  },
  {
    whole: 'crayons',
    sorts: [tinted('crayons', 'bleus'), tinted('crayons', 'verts'), tinted('crayons', 'rouges')],
    places: [
      { noun: 'pot', max: 40 },
      { noun: 'trousse', f: true, max: 30 },
    ],
  },
  {
    whole: 'chocolats',
    sorts: [
      tinted('chocolats', 'au lait'),
      tinted('chocolats', 'noirs'),
      tinted('chocolats', 'blancs'),
    ],
    places: [{ noun: 'boîte', f: true, max: 60 }],
  },
  {
    whole: 'véhicules',
    sorts: [
      sort('voitures', '🚗'),
      sort('camions', '🚚'),
      sort('motos', '🏍️'),
      sort('vélos', '🚲'),
    ],
    places: [
      { noun: 'parking', max: 100 },
      { noun: 'garage', max: 40 },
    ],
  },
  {
    whole: 'jeux',
    sorts: [sort('balançoires'), sort('toboggans')],
    places: [
      { noun: 'parc', max: 30 },
      { noun: 'square', max: 20 },
    ],
  },
  {
    whole: 'légumes',
    sorts: [sort('carottes', '🥕'), sort('tomates', '🍅'), sort('salades', '🥬'), sort('poireaux')],
    places: [
      { noun: 'potager', max: 100 },
      { noun: 'cagette', f: true, max: 60 },
    ],
  },
  {
    whole: 'vêtements',
    sorts: [
      sort('tee-shirts', '👕'),
      sort('pantalons', '👖'),
      sort('robes', '👗'),
      sort('chaussettes', '🧦'),
    ],
    places: [
      { noun: 'armoire', f: true, max: 60 },
      { noun: 'valise', f: true, max: 30 },
      { noun: 'placard', max: 60 },
    ],
  },
  {
    whole: 'insectes',
    broader: ['animaux'],
    sorts: [
      sort('fourmis', '🐜'),
      sort('coccinelles', '🐞'),
      sort('abeilles', '🐝'),
      sort('papillons', '🦋'),
    ],
    places: [
      { noun: 'jardin', max: 100 },
      { noun: 'prairie', f: true, max: 100 },
    ],
  },
  {
    whole: 'poissons',
    broader: ['animaux'],
    sorts: [
      tinted('poissons', 'rouges'),
      tinted('poissons', 'noirs'),
      tinted('poissons', 'jaunes'),
    ],
    places: [
      { noun: 'aquarium', max: 60 },
      { noun: 'bassin', max: 60 },
    ],
  },
];

/** Les scènes dont deux sortes au moins ont une image : pour compter sur un dessin. */
export const PICTURE_SCENES = SCENES.filter((s) => s.sorts.filter((k) => k.icon).length >= 2);

/** Le mot convient-il pour regrouper ces sortes ? (« enfants » et « élèves » pour des filles…) */
export const groups = (scene: Scene, words: readonly string[]) =>
  words.every((w) => scene.sorts.some((k) => k.word === w));

/** Prénoms des problèmes, avec « il » ou « elle ». */
export interface Child {
  name: string;
  f: boolean;
}
export const CHILDREN: readonly Child[] = [
  ...[
    'Léa',
    'Inès',
    'Maya',
    'Lina',
    'Nina',
    'Zoé',
    'Mia',
    'Chloé',
    'Emma',
    'Jade',
    'Aya',
    'Ambre',
    'Julie',
    'Lila',
  ].map((name) => ({ name, f: true })),
  ...[
    'Tom',
    'Léo',
    'Hugo',
    'Sam',
    'Jules',
    'Paul',
    'Salim',
    'Yanis',
    'Adam',
    'Noah',
    'Rayan',
    'Malo',
    'Etan',
    'Jude',
  ].map((name) => ({ name, f: false })),
];
const pronoun = (c: Child) => (c.f ? 'elle' : 'il');

/**
 * Les sortes de problèmes. Composition : trouver le tout ou une partie. Transformation : il en
 * perd (il en reste), il en gagne. Comparaison : de plus que, de moins que. Multiplication.
 */
export type ProblemKind = 'tout' | 'partie' | 'reste' | 'gagne' | 'plus' | 'moins' | 'fois';
export const COMPOSITION: readonly ProblemKind[] = ['tout', 'partie'];
export const ALL_KINDS: readonly ProblemKind[] = [
  'tout',
  'partie',
  'reste',
  'gagne',
  'plus',
  'moins',
  'fois',
];

export interface ProblemParams {
  kinds: readonly ProblemKind[];
  /** Le plus grand nombre de l'énoncé ou de la réponse. */
  max: number;
  /** Faux : additions sans retenue et soustractions sans emprunt. */
  carry: boolean;
}

export type Operation = '+' | '−' | '×';

export interface Problem {
  kind: ProblemKind;
  /** Les phrases de l'énoncé. */
  statement: string[];
  question: string;
  /** La phrase-réponse, avec « {?} » à la place du nombre. */
  reply: string;
  /** Des phrases-réponses fausses (mauvais mot, mauvais nombre), le nombre déjà écrit. */
  wrongReplies: string[];
  /** Les deux nombres du calcul, dans l'ordre où on les écrit. */
  operands: [number, number];
  op: Operation;
  result: number;
  /** Pourquoi ce calcul (« On cherche le tout : les tulipes et les roses ensemble. »). */
  reason: string;
  /** Pour « Parmi les … » : la scène, le lieu, les deux sortes et leurs nombres. */
  group?: Group;
}

export interface Group {
  scene: Scene;
  place: Place;
  sorts: [Sort, Sort];
  counts: [number, number];
}

export const fill = (reply: string, n: number) => reply.replace('{?}', String(n));
export const calcText = (p: Problem) => `${p.operands[0]} ${p.op} ${p.operands[1]} = ${p.result}`;
export const statementText = (p: Problem) => p.statement.join(' ');

/** Deux nombres a et b d'au moins 2, a + b ≤ max ; sans retenue si carry est faux. */
function sumPair(rng: Rng, max: number, carry: boolean): [number, number] {
  return retry(
    () => {
      const a = rng.int(2, max - 2);
      return [a, rng.int(2, max - a)] as [number, number];
    },
    ([a, b]) => carry || (a % 10) + (b % 10) < 10,
  );
}

/** Un tout et une partie : la partie et le reste font au moins 2 ; sans emprunt si carry est faux. */
function differencePair(rng: Rng, max: number, carry: boolean): [number, number] {
  const [a, b] = sumPair(rng, max, carry);
  return [a + b, a];
}

const LOSSES = [
  { thing: 'billes', start: 'a', lose: 'À la récré, {p} en perd {n}.', own: true },
  { thing: 'crêpes', start: 'cuisine', lose: '{P} en vend {n}.', own: false },
  { thing: 'bonbons', start: 'a', lose: '{P} en mange {n}.', own: true },
  { thing: 'images', start: 'a', lose: '{P} en donne {n} à son frère.', own: true },
  { thing: 'euros', start: 'a', lose: '{P} en dépense {n}.', own: true },
  { thing: 'biscuits', start: 'prépare', lose: 'Ses amis en mangent {n}.', own: false },
  { thing: 'timbres', start: 'a', lose: '{P} en colle {n} sur des lettres.', own: true },
] as const;

const GAINS = [
  { thing: 'billes', gain: 'À la récré, {p} en gagne {n}.' },
  { thing: 'images', gain: 'Sa mamie lui en donne {n}.' },
  { thing: 'coquillages', gain: 'Sur la plage, {p} en ramasse encore {n}.' },
  { thing: 'euros', gain: 'Pour son anniversaire, {p} en reçoit {n}.' },
  { thing: 'timbres', gain: '{P} en achète {n}.' },
  { thing: 'cartes', gain: 'Son cousin lui en donne {n}.' },
] as const;

const COMPARED = ['billes', 'images', 'livres', 'cartes', 'timbres', 'coquillages', 'points'];

const PACKS = [
  { pack: 'filets', of: 'clémentines', sizes: [6, 7, 8, 9] },
  { pack: 'paquets', of: 'yaourts', sizes: [4, 6, 8] },
  { pack: 'boîtes', of: 'œufs', sizes: [6, 10] },
  { pack: 'sachets', of: 'bonbons', sizes: [5, 10] },
  { pack: 'paquets', of: 'gâteaux', sizes: [4, 6, 8] },
  { pack: 'boîtes', of: 'crayons', sizes: [10] },
  { pack: 'barquettes', of: 'fraises', sizes: [8, 9, 10] },
] as const;

/** Remplace {p} et {P} par le pronom (« il », « Il ») et {n} par le nombre. */
const say = (template: string, child: Child, n: number) =>
  template
    .replace('{P}', capitalize(pronoun(child)))
    .replace('{p}', pronoun(child))
    .replace('{n}', String(n));

/** Deux nombres faux pour une phrase-réponse : ceux de l'énoncé. */
const otherNumbers = (result: number, operands: readonly number[]) =>
  [...new Set(operands)].filter((n) => n !== result);

/** Un problème de composition dans un lieu : le tout (tulipes + roses) ou une partie. */
export function groupProblem(
  rng: Rng,
  kind: 'tout' | 'partie',
  params: ProblemParams,
  scenes: readonly Scene[] = SCENES,
): Problem {
  const scene = rng.pick(scenes);
  const place = rng.pick(scene.places);
  const [k1, k2] = rng.sample(scene.sorts, 2) as [Sort, Sort];
  const max = Math.min(params.max, place.max);
  const at = `${place.on ? 'sur' : 'dans'} ${the(place)}`;
  const At = capitalize(at);
  const ask = (noun: string, tail: string) =>
    rng.chance(0.5)
      ? `Combien y a-t-il ${de(noun)}${tail}${ASK}`
      : `Combien ${de(noun)} y a-t-il${tail}${ASK}`;

  if (kind === 'tout') {
    const [a, b] = sumPair(rng, max, params.carry);
    const tail = rng.chance(0.5) ? ` ${at}` : ' en tout';
    const reply = `Il y a {?} ${scene.whole}${tail}.`;
    return {
      kind,
      statement: [`${At}, il y a ${a} ${k1.word} et ${b} ${k2.word}.`],
      question: ask(scene.whole, tail),
      reply,
      wrongReplies: [
        `Il y a ${a + b} ${k1.word}${tail}.`,
        `Il y a ${a + b} ${k2.word}${tail}.`,
        ...otherNumbers(a + b, [a, b]).map((n) => fill(reply, n)),
      ],
      operands: [a, b],
      op: '+',
      result: a + b,
      reason: `On cherche le tout : les ${k1.word} et les ${k2.word} ensemble.`,
      group: { scene, place, sorts: [k1, k2], counts: [a, b] },
    };
  }
  const [whole, a] = differencePair(rng, max, params.carry);
  const part = k1.adj
    ? `${a} ${scene.whole} sont ${k1.adj}.`
    : `${a} ${scene.whole} sont des ${k1.word}.`;
  const reply = `Il y a {?} ${k2.word} ${at}.`;
  return {
    kind,
    // Avec plus de deux sortes (des billes de quatre couleurs), on dit ce que sont les autres.
    statement: [
      `${At}, il y a ${whole} ${scene.whole} en tout.`,
      capitalize(part),
      ...(scene.sorts.length > 2
        ? [k2.adj ? `Les autres sont ${k2.adj}.` : `Les autres sont des ${k2.word}.`]
        : []),
    ],
    question: ask(k2.word, ''),
    reply,
    wrongReplies: [
      `Il y a ${whole - a} ${k1.word} ${at}.`,
      `Il y a ${whole - a} ${scene.whole} ${at}.`,
      ...otherNumbers(whole - a, [whole, a]).map((n) => fill(reply, n)),
    ],
    operands: [whole, a],
    op: '−',
    result: whole - a,
    reason: `On connaît le tout (${whole} ${scene.whole}) et une partie (${a} ${k1.word}) : on cherche l’autre partie.`,
    group: { scene, place, sorts: [k1, k2], counts: [a, whole - a] },
  };
}

export function makeProblem(rng: Rng, kind: ProblemKind, params: ProblemParams): Problem {
  if (kind === 'tout' || kind === 'partie') return groupProblem(rng, kind, params);
  const child = rng.pick(CHILDREN);
  const P = capitalize(pronoun(child));

  if (kind === 'reste') {
    const item = rng.pick(LOSSES);
    const [start, lost] = differencePair(rng, params.max, params.carry);
    const result = start - lost;
    const reply = item.own ? `Il lui reste {?} ${item.thing}.` : `Il reste {?} ${item.thing}.`;
    const other = rng.pick(LOSSES.filter((l) => l.thing !== item.thing)).thing;
    return {
      kind,
      statement: [
        `${child.name} ${item.start} ${start} ${item.thing}.`,
        say(item.lose, child, lost),
      ],
      question: item.own
        ? `Combien ${de(item.thing)} lui reste-t-il${ASK}`
        : `Combien ${de(item.thing)} reste-t-il${ASK}`,
      reply,
      wrongReplies: [
        reply.replace('{?}', String(result)).replace(item.thing, other),
        ...otherNumbers(result, [start, lost]).map((n) => fill(reply, n)),
      ],
      operands: [start, lost],
      op: '−',
      result,
      reason: `Il y en a ${lost} en moins : on enlève.`,
    };
  }

  if (kind === 'gagne') {
    const item = rng.pick(GAINS);
    const [start, won] = sumPair(rng, params.max, params.carry);
    const result = start + won;
    const reply = `${child.name} a maintenant {?} ${item.thing}.`;
    const other = rng.pick(GAINS.filter((g) => g.thing !== item.thing)).thing;
    return {
      kind,
      statement: [`${child.name} a ${start} ${item.thing}.`, say(item.gain, child, won)],
      question: `Combien ${de(item.thing)} ${child.name} a-t-${pronoun(child)} maintenant${ASK}`,
      reply,
      wrongReplies: [
        `${child.name} a maintenant ${result} ${other}.`,
        ...otherNumbers(result, [start, won]).map((n) => fill(reply, n)),
      ],
      operands: [start, won],
      op: '+',
      result,
      reason: `Il y en a ${won} de plus : on ajoute.`,
    };
  }

  if (kind === 'plus' || kind === 'moins') {
    const a = child;
    const b = rng.pick(CHILDREN.filter((c) => c.name !== child.name));
    const thing = rng.pick(COMPARED);
    const verb = rng.chance(0.3) ? 'possède' : 'a';
    // Plus : b + écart ; moins : b − écart.
    // Un écart raisonnable : « 18 billes de plus », pas « 97 images de moins ».
    const [base, gap] = retry(
      () =>
        kind === 'plus'
          ? sumPair(rng, params.max, params.carry)
          : differencePair(rng, params.max, params.carry),
      ([n, d]) => d <= 30 && d < n,
    );
    const result = kind === 'plus' ? base + gap : base - gap;
    const statement = [
      `${a.name} ${verb} ${gap} ${thing} de ${kind} ${que(b.name)}.`,
      `${b.name} ${verb} ${base} ${thing}.`,
    ];
    const reply = `${a.name} ${verb} {?} ${thing}.`;
    return {
      kind,
      statement: rng.chance(0.35) ? [statement[1]!, statement[0]!] : statement,
      question: `Combien ${de(thing)} ${a.name} ${verb}-t-${pronoun(a)}${ASK}`,
      reply,
      wrongReplies: [
        `${b.name} ${verb} ${result} ${thing}.`,
        ...otherNumbers(result, [base, gap]).map((n) => fill(reply, n)),
      ],
      operands: [base, gap],
      op: kind === 'plus' ? '+' : '−',
      result,
      reason:
        kind === 'plus'
          ? `${a.name} en a ${gap} de plus ${que(b.name)} : on ajoute ${gap}.`
          : `${a.name} en a ${gap} de moins ${que(b.name)} : on enlève ${gap}.`,
    };
  }

  const pack = rng.pick(PACKS);
  const size = rng.pick(pack.sizes);
  const count = rng.int(2, Math.min(5, Math.floor(params.max / size)));
  const result = count * size;
  const verb = rng.chance(0.5) ? 'achète' : 'a';
  const reply = verb === 'achète' ? `${P} achète {?} ${pack.of}.` : `${P} a {?} ${pack.of}.`;
  return {
    kind,
    statement: [`${child.name} ${verb} ${count} ${pack.pack} de ${size} ${pack.of}.`],
    question:
      verb === 'achète'
        ? `Combien ${de(pack.of)} achète-t-${pronoun(child)}${ASK}`
        : `Combien ${de(pack.of)} ${child.name} a-t-${pronoun(child)}${ASK}`,
    reply,
    wrongReplies: [
      reply.replace('{?}', String(result)).replace(pack.of, pack.pack),
      ...otherNumbers(result, [count, size, count + size]).map((n) => fill(reply, n)),
    ],
    operands: [count, size],
    op: '×',
    result,
    reason: `${count} ${pack.pack} de ${size} : ${Array(count).fill(size).join(' + ')}.`,
  };
}

/** Un problème au hasard parmi les sortes du niveau. */
export const randomProblem = (rng: Rng, params: ProblemParams) =>
  makeProblem(rng, rng.pick(params.kinds), params);

/** L'explication après une erreur : pourquoi ce calcul, le calcul, la phrase-réponse. */
export const problemExplanation = (p: Problem) =>
  `${p.reason} ${calcText(p)}. ${fill(p.reply, p.result)}`;

/** Les niveaux des problèmes à résoudre : la composition d'abord, puis le reste. */
export const SOLVE_LEVELS = [
  {
    label: 'Trouver le tout',
    grade: 'CE1',
    params: { kinds: ['tout'], max: 99, carry: false },
  },
  {
    label: 'Trouver une partie',
    grade: 'CE1',
    params: { kinds: ['partie'], max: 99, carry: false },
  },
  {
    label: 'Le tout ou une partie',
    grade: 'CE1',
    params: { kinds: COMPOSITION, max: 100, carry: true },
  },
  {
    label: 'Il en reste, il en gagne',
    grade: 'CE1',
    params: { kinds: ['reste', 'gagne'], max: 100, carry: true },
  },
  {
    label: 'De plus que, de moins que',
    grade: 'CE1',
    params: { kinds: ['plus', 'moins'], max: 100, carry: true },
  },
  {
    label: '3 filets de 9 clémentines',
    grade: 'CE1',
    params: { kinds: ['fois'], max: 50, carry: true },
  },
  {
    label: 'Tous les problèmes',
    grade: 'CE1',
    params: { kinds: ALL_KINDS, max: 100, carry: true },
  },
] as const satisfies readonly { label: string; grade: string; params: ProblemParams }[];
