/**
 * Questions et réponses, par widget. Une question est un objet JSON sérialisable :
 * on peut la stocker, la rejouer et l'imprimer.
 */

export interface QuestionBase {
  /** Consigne, avec le verbe d'action en majuscules comme à l'école (« POSE et CALCULE »). */
  instruction: string;
  /** Texte lu à voix haute à la place de la consigne et de l'énoncé. */
  speech?: string;
  /** Un texte à lire avant de répondre, sous la consigne : l'énoncé d'un problème. */
  text?: string;
  /** Ce qu'il faut écouter pour répondre (la dictée) : lu à voix haute, il ne s'affiche pas. */
  listen?: string;
  /** La langue de ce qu'il faut écouter (« en-GB » pour l'anglais) ; le français sinon. */
  listenLang?: string;
}

/** Point d'une figure. Les coordonnées sont en centimètres, origine en haut à gauche. */
export interface FigPoint {
  id: string;
  x: number;
  y: number;
  /** Nom affiché à côté du point (aucun s'il est absent). */
  label?: string;
  /** cross : croix ×, tick : petit trait sur un segment, dot : point rond, none : invisible. */
  mark?: 'cross' | 'tick' | 'dot' | 'none';
  /** Côté où s'écrit le nom (n par défaut). */
  labelAt?: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
}
export interface FigSegment {
  from: string;
  to: string;
  /** line : droite, prolongée jusqu'aux bords de la figure. */
  kind?: 'segment' | 'line';
  dashed?: boolean;
}
/** Trait libre (courbe, ligne brisée) : pour reconnaître un segment parmi d'autres lignes. */
export interface FigPath {
  id: string;
  points: [number, number][];
  smooth?: boolean;
  /** Petits points ronds aux deux bouts. */
  dots?: boolean;
  /** Légende sous le trait (« a/ »). */
  caption?: string;
}
export interface FigText {
  x: number;
  y: number;
  text: string;
}
/** Figure de géométrie dessinée à l'échelle : 1 unité = 1 cm sur la règle de l'app. */
export interface Figure {
  width: number;
  height: number;
  points: FigPoint[];
  segments?: FigSegment[];
  paths?: FigPath[];
  texts?: FigText[];
  /** Cadre autour de la figure (les « cases » des évaluations). */
  frame?: boolean;
  /** Une règle graduée à déplacer et tourner. */
  ruler?: boolean;
}

/**
 * Une image à regarder avec l'énoncé : une horloge à aiguilles, des pièces et des billets,
 * ou des objets à compter dans un cadre (les fruits d'un panier).
 */
export type Picture =
  | {
      kind: 'clock';
      /** L'heure montrée, en minutes depuis 12 h (0 à 719). */
      minutes: number;
      /** Les minutes écrites autour du cadran (5, 10, 15…). */
      minuteLabels?: boolean;
    }
  /** Valeurs en centimes : 50 pour la pièce de 50 c, 1000 pour le billet de 10 €. */
  | { kind: 'money'; values: number[] }
  /** Des emoji, dans l'ordre où ils sont rangés dans le cadre. */
  | { kind: 'icons'; icons: string[] }
  /** La page d'un mois (1 à 12) ; les jours de marks sont entourés (un anniversaire). */
  | { kind: 'calendar'; year: number; month: number; marks?: number[] };

/** Opération posée en colonnes, avec cases de retenue. */
export interface ColumnOpQuestion extends QuestionBase {
  widget: 'column-op';
  op: '+' | '-';
  operands: number[];
  showCarries: boolean;
}
export interface ColumnOpAnswer {
  /** Un chiffre par colonne, de gauche à droite ('' = case vide). */
  digits: string[];
  /** Retenue notée au-dessus de chaque colonne (aide, non notée). */
  carries: number[];
}

/** Réponse numérique ; « {?} » dans l'énoncé marque la case réponse. */
export interface NumberInputQuestion extends QuestionBase {
  widget: 'number-input';
  prompt: string;
  unit?: string;
  maxLength?: number;
  figure?: Figure;
  picture?: Picture;
}
export interface NumberInputAnswer {
  value: string;
}

export interface McqChoice {
  id: string;
  label: string;
  icon?: string;
  /** Une horloge ou un porte-monnaie à choisir (« Quelle horloge indique 3 h ? »). */
  picture?: Picture;
}
/** Choix unique ou multiple (VRAI/FAUX, COCHE, signe <, >, =…). */
export interface McqQuestion extends QuestionBase {
  widget: 'mcq';
  /** « {?} » y marque une case qui montre le choix en cours (« 12 {?} 15 »). */
  prompt?: string;
  choices: McqChoice[];
  multiple: boolean;
  layout?: 'row' | 'grid' | 'list';
  figure?: Figure;
  picture?: Picture;
}
export interface McqAnswer {
  selected: string[];
}

export interface WordToken {
  text: string;
  /** Peut être touché (vrai par défaut ; faux pour la ponctuation). */
  selectable?: boolean;
  /** Collé au mot précédent, sans espace (« J' » + « aime », ponctuation). */
  glue?: boolean;
}
export interface PickColor {
  id: string;
  /** « le PASSÉ en bleu » */
  label: string;
  /** Couleur CSS. */
  color: string;
}
/** Mots à toucher dans une grille ou une phrase : COLORIE, ENTOURE, SOULIGNE. */
export interface WordSelectQuestion extends QuestionBase {
  widget: 'word-select';
  layout: 'grid' | 'sentence';
  mark: 'color' | 'circle' | 'underline';
  tokens: WordToken[];
  /** Une seule couleur : on touche pour marquer ou démarquer ; plusieurs : une palette. */
  colors: PickColor[];
}
export interface WordSelectAnswer {
  /** Couleur choisie pour chaque mot (null = non marqué). */
  picks: (string | null)[];
}

export interface ClassifyCategory {
  id: string;
  label: string;
  color?: string;
}
/** Ranger des étiquettes dans des colonnes, ou cocher une colonne par ligne d'un tableau. */
export interface ClassifyQuestion extends QuestionBase {
  widget: 'classify';
  layout: 'columns' | 'table';
  items: { text: string; icon?: string }[];
  categories: ClassifyCategory[];
}
export interface ClassifyAnswer {
  /** Catégorie de chaque étiquette (null = pas encore rangée). */
  placed: (string | null)[];
}

export type Blank =
  | { kind: 'choice'; options: string[] }
  /**
   * upper : les lettres tapées s'écrivent en majuscules (noms de points : [AB]) ;
   * digits : un nombre, tapé au pavé numérique.
   */
  | { kind: 'text'; size?: number; upper?: boolean; digits?: boolean };
/** Texte à trous : étiquettes à choisir ou mots à taper (clavier à l'écran). */
export interface FillBlankQuestion extends QuestionBase {
  widget: 'fill-blank';
  /** Texte avec les trous {0}, {1}… ; « \n » passe à la ligne. */
  prompt: string;
  blanks: Blank[];
  /** Les majuscules comptent (faux par défaut). Les accents comptent toujours. */
  caseSensitive?: boolean;
  figure?: Figure;
  picture?: Picture;
}

/**
 * Outils de la géométrie : ENTOURER des points ou des traits, TRACER entre deux points,
 * PLACER des points nommés. Un tracé « help » sert d'aide et n'est pas corrigé.
 */
export type GeoTool =
  | { kind: 'pick'; targets: string[] }
  | { kind: 'draw'; as: 'segment' | 'line'; help?: boolean }
  | { kind: 'place'; labels: string[] };
export interface GeometryQuestion extends QuestionBase {
  widget: 'geometry';
  figure: Figure;
  tools: GeoTool[];
  /** Écart permis pour un point placé, en cm (0,3 par défaut). */
  tolerance?: number;
}
export interface PlacedPoint {
  id: string;
  x: number;
  y: number;
}
export interface GeometryAnswer {
  /** Points ou traits entourés (identifiants). */
  picked: string[];
  /** Traits tracés entre deux points de la figure. */
  drawn: [string, string][];
  placed: PlacedPoint[];
}
export interface FillBlankAnswer {
  values: string[];
}

/** Une étiquette à remettre en place. */
export interface OrderTile {
  text: string;
  /** Collée à l'étiquette d'avant, sans espace (le point à la fin de la phrase). */
  glue?: boolean;
}
/** Remettre des étiquettes dans l'ordre (les mots d'une phrase…), en les touchant une à une. */
export interface OrderQuestion extends QuestionBase {
  widget: 'order';
  /** Les étiquettes, dans l'ordre où elles sont montrées (mélangé). */
  tiles: OrderTile[];
  /** Une liste de mots (l'ordre alphabétique), pas une phrase : on l'écrit avec des virgules. */
  list?: boolean;
}
export interface OrderAnswer {
  /** Numéros des étiquettes posées, dans l'ordre. */
  order: number[];
}

/** Régler une horloge : l'enfant tourne les aiguilles jusqu'à l'heure demandée. */
export interface ClockQuestion extends QuestionBase {
  widget: 'clock';
  /** L'heure à montrer, écrite au-dessus de l'horloge (« 3 h 30 », « 15 h »). */
  prompt: string;
  /** La grande aiguille avance de step minutes (60, 30, 15, 5 ou 1). */
  step: number;
  /** Les aiguilles au départ, en minutes depuis 12 h (0 à 719). */
  start: number;
  minuteLabels?: boolean;
}
export interface ClockAnswer {
  /** L'heure montrée par les aiguilles, en minutes depuis 12 h (0 à 719). */
  minutes: number;
}

/** Payer : parmi les pièces et les billets étalés, l'enfant entoure ceux qu'il donne. */
export interface MoneyQuestion extends QuestionBase {
  widget: 'money';
  /** Ce qu'il faut payer (« La glace coûte 7 € »). */
  prompt: string;
  /** L'objet acheté. */
  icon?: string;
  /** Les pièces et les billets, en centimes, dans l'ordre où ils sont étalés. */
  purse: number[];
}
export interface MoneyAnswer {
  /** Numéros des pièces et des billets entourés. */
  picked: number[];
}

/** Une carte à relier : un texte (un énoncé, une fin de phrase…), parfois avec une image. */
export interface MatchCard {
  text: string;
  icon?: string;
}
export interface MatchColumn {
  /** « énoncés », « questions », « phrases-réponses ». */
  title?: string;
  cards: MatchCard[];
}
/**
 * Relier : des colonnes de cartes côte à côte. Chaque carte se relie par un trait à une carte
 * de la colonne suivante (l'énoncé à sa question, la question à sa phrase-réponse).
 */
export interface MatchQuestion extends QuestionBase {
  widget: 'match';
  /** 2 ou 3 colonnes, avec autant de cartes chacune, dans l'ordre affiché (mélangé). */
  columns: MatchColumn[];
}
export interface MatchAnswer {
  /** links[c][i] : la carte de la colonne c + 1 reliée à la carte i de la colonne c (null : aucune). */
  links: (number | null)[][];
}

/** Une question sur l'histoire : une seule bonne réponse parmi les choix. */
export interface ComprehensionItem {
  /** « Où vivent les trois ours ? », ou une phrase suivie de « Vrai ou faux ? ». */
  ask: string;
  choices: McqChoice[];
  /** La phrase de l'histoire qui donne la réponse (son rang, en comptant tous les paragraphes). */
  proof: number;
}
/**
 * Écouter une histoire, puis répondre à quelques questions. L'histoire est lue à voix haute ;
 * elle ne s'affiche qu'après la correction, avec les phrases qui donnent les réponses surlignées.
 */
export interface ComprehensionQuestion extends QuestionBase {
  widget: 'comprehension';
  title: string;
  icon?: string;
  /** Les paragraphes de l'histoire, chacun découpé en phrases. */
  story: string[][];
  /** Un texte à lire seul (Lecture) : affiché dès le début, sans voix. Sinon, il s'écoute. */
  read?: boolean;
  items: ComprehensionItem[];
  /** Des événements de l'histoire à remettre dans l'ordre, montrés mélangés. */
  events?: ComprehensionEvent[];
}
/** Un événement de l'histoire, à ranger à sa place. */
export interface ComprehensionEvent {
  /** « Le loup souffle sur la maison de paille. » */
  text: string;
  /** La phrase de l'histoire où il se passe (son rang, en comptant tous les paragraphes). */
  proof: number;
}
export interface ComprehensionAnswer {
  /** Le choix de chaque question ('' = pas encore répondu). */
  selected: string[];
  /** Avec des événements : l'événement posé dans chaque case, de la première à la dernière (-1 = vide). */
  order?: number[];
}

export type Question =
  | ColumnOpQuestion
  | NumberInputQuestion
  | McqQuestion
  | WordSelectQuestion
  | ClassifyQuestion
  | FillBlankQuestion
  | GeometryQuestion
  | OrderQuestion
  | ClockQuestion
  | MoneyQuestion
  | MatchQuestion
  | ComprehensionQuestion;
export type WidgetId = Question['widget'];

export interface AnswerMap {
  'column-op': ColumnOpAnswer;
  'number-input': NumberInputAnswer;
  mcq: McqAnswer;
  'word-select': WordSelectAnswer;
  classify: ClassifyAnswer;
  'fill-blank': FillBlankAnswer;
  geometry: GeometryAnswer;
  order: OrderAnswer;
  clock: ClockAnswer;
  money: MoneyAnswer;
  match: MatchAnswer;
  comprehension: ComprehensionAnswer;
}

export type QuestionOf<W extends WidgetId> = Extract<Question, { widget: W }>;
export type AnswerOf<Q extends Question> = AnswerMap[Q['widget']];

/** Question telle que produite par un plugin : le widget, plus les données privées du plugin. */
export type PluginQuestion<W extends WidgetId = WidgetId, D = unknown> = QuestionOf<W> & {
  data: D;
};

/** near : faux, mais juste à un accent près. */
export type Mark = 'ok' | 'near' | 'wrong' | 'missing';

export interface CheckResult {
  correct: boolean;
  /** Score entre 0 et 1 (réussite partielle). */
  score: number;
  /** Marques par élément du widget (index de case, id de choix…). */
  marks: Record<string, Mark>;
  /** Message affiché après la correction. */
  feedback?: string;
}
