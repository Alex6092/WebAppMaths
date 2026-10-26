/**
 * Contrat d'API partagé entre le serveur (apps/server) et l'interface (apps/web).
 */
import type { Streak } from './daily';
import type { GradeId } from './grades';
import type { NotionMastery } from './mastery';
import type { LevelChange } from './progression';
import type { CheckResult } from './question';

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
 * daily : le défi du jour, un mélange de toutes les notions de la classe.
 */
export type PracticeMode = 'training' | 'mix' | 'daily';

export type StartSessionRequest =
  | { mode: 'training'; selection: { pluginId: string } }
  | { mode: 'mix'; selection: { notions: string[] } }
  | { mode: 'daily'; selection: Record<string, never> };

export interface StartSessionResponse {
  id: number;
  /** Questions déjà faites : on reprend le défi du jour là où il s'était arrêté. */
  answered: number;
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
