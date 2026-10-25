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
  prompt?: string;
  choices: McqChoice[];
  multiple: boolean;
  layout?: 'row' | 'grid' | 'list';
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

export type Blank = { kind: 'choice'; options: string[] } | { kind: 'text'; size?: number };
/** Texte à trous : étiquettes à choisir ou mots à taper (clavier à l'écran). */
export interface FillBlankQuestion extends QuestionBase {
  widget: 'fill-blank';
  /** Texte avec les trous {0}, {1}… ; « \n » passe à la ligne. */
  prompt: string;
  blanks: Blank[];
  /** Les majuscules comptent (faux par défaut). Les accents comptent toujours. */
  caseSensitive?: boolean;
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
  | FillBlankQuestion;
export type WidgetId = Question['widget'];

export interface AnswerMap {
  'column-op': ColumnOpAnswer;
  'number-input': NumberInputAnswer;
  mcq: McqAnswer;
  'word-select': WordSelectAnswer;
  classify: ClassifyAnswer;
  'fill-blank': FillBlankAnswer;
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
