/**
 * Contrat d'API partagé entre le serveur (apps/server) et l'interface (apps/web).
 */
import type { Streak } from './daily';
import type { EvaluationCode } from './evaluation';
import type { GradeId } from './grades';
import type { NotionMastery } from './mastery';
import type { LevelChange } from './progression';
import type { CheckResult } from './question';
import type { NotionReview } from './spaced';

export type Role = 'admin' | 'parent';

/** Rôle d'un compte dans une école. */
export type SchoolRole = 'direction' | 'enseignant';

/** Ce qu'ouvre un code d'invitation. */
export type InvitationKind = 'admin' | 'parent' | SchoolRole | 'eleve';

export interface ChildDto {
  id: number;
  firstName: string;
  avatar: string;
  grade: GradeId;
  themeId: string;
  coins: number;
  /** Les petits sons de l'app (bonne réponse, pièces…). */
  sound: boolean;
  /** La classe de l'enfant, s'il est inscrit dans une école. */
  classroom: { id: number; name: string; schoolName: string } | null;
}

/** Une école du compte connecté, et les classes qu'il y gère. */
export interface MeSchool {
  id: number;
  name: string;
  role: SchoolRole;
  classes: { id: number; name: string }[];
}

export interface MeResponse {
  user: { id: number; email: string; role: Role };
  /** null : compte d'enseignant sans famille. */
  family: { id: number; name: string } | null;
  /** L'espace parent est déverrouillé jusqu'à cette date (ms), sinon null. */
  parentVerifiedUntil: number | null;
  activeChildId: number | null;
  children: ChildDto[];
  schools: MeSchool[];
  version: string;
}

export interface LevelStateDto {
  level: number;
  recent: boolean[];
  consecutiveErrors: number;
}

export interface ChildStateResponse {
  child: ChildDto;
  /** Niveau courant par plugin (absent = jamais joué). */
  levels: Record<string, LevelStateDto>;
  /** Acquisition de chaque notion du catalogue. */
  notions: Record<string, NotionMastery>;
  owned: { themeId: string; rewardId: string }[];
  /** Ambiances débloquées (celles qui sont gratuites comprises). */
  themes: string[];
  badges: EarnedBadge[];
  daily: DailyState;
  /** Questions ratées qui restent à revoir. */
  mistakes: number;
  /** Notions vues en classe : « Tout mélanger » et le défi du jour ne prennent qu'elles. */
  activeNotions: string[];
  /** Devoirs à faire, et ceux finis ces derniers jours. */
  assignments: AssignmentDto[];
  /** Révision espacée des notions acquises. */
  reviews: Record<string, NotionReview>;
  /** Évaluations blanches à faire, et celles finies ces derniers jours. */
  evaluations: EvaluationDto[];
  /** Notions de la leçon en cours dans la classe (« En ce moment en classe »). */
  focusNotions: string[];
  /** Notions à retravailler : évaluées ECA ou NA par l'enseignant ces dernières semaines. */
  toRework: string[];
}

/** Une question d'évaluation : la notion évaluée, et la question exacte. */
export interface EvaluationItem extends ReviewItem {
  notionId: string;
}

/** Une évaluation blanche préparée par le parent. */
export interface EvaluationDto {
  id: number;
  title: string;
  notions: string[];
  perNotion: number;
  /** Nombre de questions. */
  total: number;
  /** Questions déjà répondues. */
  answered: number;
  createdAt: number;
  completedAt: number | null;
}

export interface NewEvaluation {
  title: string;
  notions: string[];
  perNotion: number;
}

/** Une ligne de compétence du bilan : barème ( points / total ) et code de l'école. */
export interface EvaluationLine {
  notionId: string;
  points: number;
  total: number;
  code: EvaluationCode;
}

/** Une question du bilan, avec la réponse de l'enfant (null : pas encore répondue). */
export interface EvaluationQuestion extends EvaluationItem {
  pluginVersion: number;
  answers: unknown[] | null;
  correct: boolean | null;
  answeredAt: number | null;
}

/** Le bilan d'une évaluation, au format des évaluations de l'école. */
export interface EvaluationReport extends EvaluationDto {
  firstName: string;
  grade: GradeId;
  /** Première réponse (ms), null si l'évaluation n'est pas commencée. */
  startedAt: number | null;
  points: number;
  lines: EvaluationLine[];
  questions: EvaluationQuestion[];
}

/** Un devoir donné par le parent ou par l'enseignant. */
export interface AssignmentDto {
  id: number;
  /** Qui l'a donné : la famille, ou l'école (devoir de la classe). */
  from: 'famille' | 'ecole';
  title: string;
  notions: string[];
  questions: number;
  /** Questions déjà faites. */
  answered: number;
  dueOn: string;
  createdAt: number;
  completedAt: number | null;
}

export interface NewAssignment {
  title: string;
  notions: string[];
  questions: number;
  dueOn: string;
}

export interface EarnedBadge {
  id: string;
  earnedAt: number;
}

/** Le défi du jour de l'enfant. */
export interface DailyState {
  day: string;
  /** Questions déjà faites dans le défi d'aujourd'hui. */
  answered: number;
  streak: Streak;
  /** Défis réussis depuis le début. */
  total: number;
}

/**
 * training : un seul exercice ; mix : un mélange des exercices de plusieurs notions ;
 * daily : le défi du jour, un mélange de toutes les notions de la classe ;
 * review : les questions ratées, reposées à l'identique ; homework : un devoir du parent ;
 * evaluation : une évaluation blanche (un seul essai, sans correction).
 */
export type PracticeMode = 'training' | 'mix' | 'daily' | 'review' | 'homework' | 'evaluation';

export type StartSessionRequest =
  | { mode: 'training'; selection: { pluginId: string } }
  | { mode: 'mix'; selection: { notions: string[] } }
  | { mode: 'daily'; selection: Record<string, never> }
  | { mode: 'review'; selection: Record<string, never> }
  | { mode: 'homework'; selection: { assignmentId: number } }
  | { mode: 'evaluation'; selection: { evaluationId: number } };

/** Une question à reposer telle quelle : même exercice, même niveau, même graine. */
export interface ReviewItem {
  pluginId: string;
  level: number;
  seed: number;
}

export interface StartSessionResponse {
  id: number;
  /** Questions déjà faites : on reprend le défi du jour là où il s'était arrêté. */
  answered: number;
  /**
   * Pour « Revoir mes erreurs » : les questions, dans l'ordre ; pour une évaluation : celles
   * qui restent à faire.
   */
  items?: ReviewItem[];
  /** Pour le défi du jour et un devoir : les notions qu'il mélange. */
  notions?: string[];
  /** Pour un devoir ou une évaluation : le nombre de questions à faire. */
  total?: number;
}

export interface AttemptRequest {
  sessionId: number;
  pluginId: string;
  pluginVersion: number;
  level: number;
  seed: number;
  /** Une réponse par essai, dans l'ordre. */
  answers: unknown[];
  durationMs: number;
  /** Temps jusqu'à la première réponse : la rapidité de l'enfant. */
  firstTryMs?: number;
}

export interface AttemptResponse {
  firstTryCorrect: boolean;
  solved: boolean;
  tries: number;
  score: number;
  coinsEarned: number;
  coins: number;
  level: number;
  levelChange: LevelChange;
  results: CheckResult[];
  /** Acquisition mise à jour des notions de l'exercice. */
  notions: Record<string, NotionMastery>;
  /** Badges gagnés avec cette réponse. */
  badges: string[];
  /** Le défi du jour, pour une question du défi. */
  daily: DailyState | null;
  /** Pièces du défi du jour, si cette réponse le termine. */
  dailyBonus: number;
  /** Le devoir, pour une question d'un devoir. */
  assignment: AssignmentDto | null;
  /** Pièces du devoir, si cette réponse le termine. */
  homeworkBonus: number;
  /** Révision espacée mise à jour des notions de l'exercice. */
  reviews: Record<string, NotionReview>;
  /** L'évaluation, pour une question d'évaluation. */
  evaluation: EvaluationDto | null;
}

export interface RewardResponse {
  coins: number;
  badges: string[];
}

export interface ThemeResponse {
  coins: number;
  themeId: string;
  themes: string[];
}

/** Une question ratée (pas juste du premier coup), avec les réponses de l'enfant. */
export interface MistakeDto extends ReviewItem {
  pluginVersion: number;
  answers: unknown[];
  solved: boolean;
  createdAt: number;
}

/** Bilan d'un enfant pour l'espace parent. */
export interface ChildReport {
  child: ChildDto;
  notions: Record<string, NotionMastery>;
  daily: DailyState;
  /** Activité par jour, du plus ancien au plus récent (jours sans activité compris). */
  days: { day: string; questions: number; firstTry: number; minutes: number }[];
  /** Dernières séances, de la plus récente à la plus ancienne. */
  sessions: {
    id: number;
    mode: string;
    pluginId: string | null;
    notions: number;
    startedAt: number;
    durationMs: number;
    nQuestions: number;
    nFirstTry: number;
  }[];
  /** Exercices les plus ratés sur la période, avec les dernières questions ratées. */
  mistakes: { pluginId: string; attempts: number; errors: number; recent: MistakeDto[] }[];
  /** Questions ratées qui restent à revoir. */
  toReview: number;
  /** Temps de première réponse des dernières questions de chaque exercice, de la plus ancienne à la plus récente. */
  timing: { pluginId: string; points: TimingPoint[] }[];
  /** Notions vues en classe. */
  activeNotions: string[];
  /** Qui règle les notions vues : le parent, ou l'enseignant si l'enfant est inscrit. */
  notionsSetBy: 'famille' | 'ecole';
  /** Notions de la leçon en cours dans la classe de l'enfant. */
  focusNotions: string[];
  reviews: Record<string, NotionReview>;
  /** Le dernier avis de l'enseignant sur chaque notion évaluée. */
  assessments: Record<string, AssessmentDto>;
}

/** L'avis de l'enseignant sur une notion, après une évaluation sur papier. */
export interface AssessmentDto {
  result: EvaluationCode;
  /** AAAA-MM-JJ. */
  assessedOn: string;
  title: string;
}

export interface TimingPoint {
  ms: number;
  level: number;
  firstTry: boolean;
  at: number;
}

export interface SessionSummary {
  id: number;
  nQuestions: number;
  nFirstTry: number;
  coinsEarned: number;
  durationMs: number;
}

export interface InvitationDto {
  id: number;
  role: InvitationKind;
  note: string | null;
  familyName: string | null;
  createdAt: number;
  expiresAt: number;
  usedAt: number | null;
  usedByEmail: string | null;
}

export interface CreatedInvitation {
  code: string;
  expiresAt: number;
}

/** Ce que montre un code avant de l'utiliser (écran d'activation). */
export interface InvitationPreview {
  kind: InvitationKind;
  schoolName: string | null;
  /** Fiche parent : l'élève à rattacher. */
  pupil: { firstName: string; className: string | null } | null;
}

export interface RedeemRequest {
  code: string;
  /** Fiche parent : fusionner l'élève avec ce profil de la famille (sinon, nouveau profil). */
  mergeInto?: number;
}

/** Un enseignant (ou la direction) d'une école. */
export interface SchoolMemberDto {
  userId: number;
  email: string;
  role: SchoolRole;
  /** Les classes dont il est l'enseignant. */
  classIds: number[];
}

export interface ClassroomDto {
  id: number;
  name: string;
  grades: GradeId[];
  schoolYear: string;
  teacherIds: number[];
  pupils: number;
}

export interface SchoolDto {
  id: number;
  name: string;
  city: string | null;
  /** Le rôle du compte connecté dans cette école. */
  role: SchoolRole;
  members: SchoolMemberDto[];
  classes: ClassroomDto[];
  /** Invitations d'enseignants pas encore utilisées (pour la direction). */
  invitations: InvitationDto[];
}

/** Une école, vue par l'administrateur de l'instance. */
export interface AdminSchoolDto {
  id: number;
  name: string;
  city: string | null;
  members: number;
  classes: number;
  pupils: number;
  createdAt: number;
}

export interface PupilDto {
  id: number;
  firstName: string;
  lastName: string | null;
  avatar: string;
  grade: GradeId;
  /** Un parent a activé la fiche : l'élève a une famille. */
  linked: boolean;
  /** Dernière fiche parent imprimée et pas encore utilisée (ms), sinon null. */
  codeIssuedAt: number | null;
}

export interface ClassroomDetail extends ClassroomDto {
  schoolId: number;
  schoolName: string;
  focusNotions: string[];
  /** Notions vues en classe, pour chaque niveau de la classe. */
  activeNotions: string[];
  pupilList: PupilDto[];
}

export interface NewPupil {
  firstName: string;
  lastName?: string;
  grade?: GradeId;
}

/** Une fiche parent à imprimer : le code n'est montré qu'une fois. */
export interface PupilCode {
  pupilId: number;
  code: string;
  expiresAt: number;
}

/** Un devoir donné à la classe, avec l'avancement de chaque élève. */
export interface ClassAssignmentDto {
  batch: string;
  title: string;
  notions: string[];
  questions: number;
  dueOn: string;
  createdAt: number;
  pupils: { pupilId: number; answered: number; completedAt: number | null }[];
}

export interface NewClassAssignment extends NewAssignment {
  /** Les élèves concernés ; absent = toute la classe. */
  pupilIds?: number[];
}

/** Une évaluation sur papier saisie par l'enseignant. */
export interface ClassAssessmentDto {
  batch: string;
  title: string;
  assessedOn: string;
  notions: string[];
  createdAt: number;
  /** pupilId → notionId → résultat (absent : pas évalué). */
  results: Record<number, Record<string, EvaluationCode>>;
}

export interface NewClassAssessment {
  title: string;
  assessedOn: string;
  notions: string[];
  results: Record<number, Record<string, EvaluationCode>>;
}

/** Le suivi de la classe : une ligne par élève. */
export interface ClassOverview {
  pupils: {
    pupilId: number;
    /** Questions faites ces 7 derniers jours (école et maison). */
    questions7d: number;
    /** Dernière activité (ms), null si jamais. */
    lastActiveAt: number | null;
    /** Devoirs de la classe en cours / finis. */
    homeworkDone: number;
    homeworkTotal: number;
    /** Questions ratées qui restent à revoir. */
    toReview: number;
    /** Acquisition des notions de la leçon en cours. */
    focus: Record<string, NotionMastery>;
    /** Notions à retravailler : dernier avis de l'enseignant ECA ou NA, depuis moins de 6 semaines. */
    toRework: number;
    /** Le dernier avis de l'enseignant sur chaque notion de la leçon en cours. */
    focusAssessments: Record<string, AssessmentDto>;
  }[];
}

/** Le choix de la direction pour un élève à la rentrée : une classe et un niveau, ou il part. */
export type RolloverChoiceDto = { classId: number; grade: GradeId } | 'quitte' | null;

/** Préparer la rentrée : les classes de l'année qui finit, et celles de l'année suivante. */
export interface RolloverDto {
  /** L'année qui finit (« 2026-2027 ») et la suivante. */
  from: string;
  to: string;
  fromClasses: {
    id: number;
    name: string;
    grades: GradeId[];
    pupils: (PupilDto & { choice: RolloverChoiceDto })[];
  }[];
  toClasses: ClassroomDto[];
}

/** Un choix : classId (avec un niveau facultatif), leaves, ou ni l'un ni l'autre (à répartir). */
export interface RolloverChoice {
  pupilId: number;
  classId?: number | null;
  grade?: GradeId;
  leaves?: boolean;
}

export interface RolloverResult {
  /** Élèves passés dans leur nouvelle classe. */
  moved: number;
  /** Élèves partis qui restent à leur famille. */
  detached: number;
  /** Élèves partis sans famille : supprimés. */
  deleted: number;
}

/** Ce que montre une fiche de réinitialisation avant de l'utiliser. */
export interface ResetPreview {
  /** Fiche de l'école : l'école et l'élève pour qui elle a été imprimée. */
  schoolName: string | null;
  pupil: { firstName: string } | null;
}

export interface ResetRequest {
  code: string;
  email: string;
  password: string;
}

export interface ApiError {
  error: string;
  message: string;
}
