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

export type Question = ColumnOpQuestion | NumberInputQuestion | McqQuestion;
export type WidgetId = Question['widget'];

export interface AnswerMap {
  'column-op': ColumnOpAnswer;
  'number-input': NumberInputAnswer;
  mcq: McqAnswer;
}

export type QuestionOf<W extends WidgetId> = Extract<Question, { widget: W }>;
export type AnswerOf<Q extends Question> = AnswerMap[Q['widget']];

/** Question telle que produite par un plugin : le widget, plus les données privées du plugin. */
export type PluginQuestion<W extends WidgetId = WidgetId, D = unknown> = QuestionOf<W> & {
  data: D;
};

export type Mark = 'ok' | 'wrong' | 'missing';

export interface CheckResult {
  correct: boolean;
  /** Score entre 0 et 1 (réussite partielle). */
  score: number;
  /** Marques par élément du widget (index de case, id de choix…). */
  marks: Record<string, Mark>;
  /** Message affiché après la correction. */
  feedback?: string;
}
