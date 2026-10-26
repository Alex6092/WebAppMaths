/**
 * Contrat d'API partagé entre le serveur (apps/server) et l'interface (apps/web).
 */
import type { Streak } from './daily';
import type { GradeId } from './grades';
import type { NotionMastery } from './mastery';
import type { LevelChange } from './progression';
import type { CheckResult } from './question';
import type { NotionReview } from './spaced';

export type Role = 'admin' | 'parent';

export interface ChildDto {
  id: number;
  firstName: string;
  avatar: string;
  grade: GradeId;
  themeId: string;
  coins: number;
  /** Les petits sons de l'app (bonne réponse, pièces…). */
  sound: boolean;
}

export interface MeResponse {
  user: { id: number; email: string; role: Role };
  family: { id: number; name: string };
  /** L'espace parent est déverrouillé jusqu'à cette date (ms), sinon null. */
  parentVerifiedUntil: number | null;
  activeChildId: number | null;
  children: ChildDto[];
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
}

/** Un devoir donné par le parent. */
export interface AssignmentDto {
  id: number;
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
 * review : les questions ratées, reposées à l'identique ; homework : un devoir du parent.
 */
export type PracticeMode = 'training' | 'mix' | 'daily' | 'review' | 'homework';

export type StartSessionRequest =
  | { mode: 'training'; selection: { pluginId: string } }
  | { mode: 'mix'; selection: { notions: string[] } }
  | { mode: 'daily'; selection: Record<string, never> }
  | { mode: 'review'; selection: Record<string, never> }
  | { mode: 'homework'; selection: { assignmentId: number } };

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
  /** Pour « Revoir mes erreurs » : les questions, dans l'ordre. */
  items?: ReviewItem[];
  /** Pour le défi du jour et un devoir : les notions qu'il mélange. */
  notions?: string[];
  /** Pour un devoir : le nombre de questions à faire. */
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
  reviews: Record<string, NotionReview>;
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
  role: Role;
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

export interface ApiError {
  error: string;
  message: string;
}
