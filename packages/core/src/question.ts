/**
 * Questions et réponses, par widget. Une question est un objet JSON sérialisable :
 * on peut la stocker, la rejouer et l'imprimer.
 */

export interface QuestionBase {
  /** Consigne, avec le verbe d'action en majuscules comme à l'école (« POSE et CALCULE »). */
  instruction: string;
  /** Texte lu à voix haute à la place de la consigne et de l'énoncé. */
  speech?: string;
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
}
export interface NumberInputAnswer {
  value: string;
}

export interface McqChoice {
  id: string;
  label: string;
  icon?: string;
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
  /** upper : les lettres tapées s'écrivent en majuscules (noms de points : [AB]). */
  | { kind: 'text'; size?: number; upper?: boolean };
/** Texte à trous : étiquettes à choisir ou mots à taper (clavier à l'écran). */
export interface FillBlankQuestion extends QuestionBase {
  widget: 'fill-blank';
  /** Texte avec les trous {0}, {1}… ; « \n » passe à la ligne. */
  prompt: string;
  blanks: Blank[];
  /** Les majuscules comptent (faux par défaut). Les accents comptent toujours. */
  caseSensitive?: boolean;
  figure?: Figure;
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

export type Question =
  | ColumnOpQuestion
  | NumberInputQuestion
  | McqQuestion
  | WordSelectQuestion
  | ClassifyQuestion
  | FillBlankQuestion
  | GeometryQuestion;
export type WidgetId = Question['widget'];

export interface AnswerMap {
  'column-op': ColumnOpAnswer;
  'number-input': NumberInputAnswer;
  mcq: McqAnswer;
  'word-select': WordSelectAnswer;
  classify: ClassifyAnswer;
  'fill-blank': FillBlankAnswer;
  geometry: GeometryAnswer;
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
