/**
 * Contrat d'API partagé entre le serveur (apps/server) et l'interface (apps/web).
 */
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
}

/** training : un seul exercice ; mix : un mélange des exercices de plusieurs notions. */
export type PracticeMode = 'training' | 'mix';

export type StartSessionRequest =
  | { mode: 'training'; selection: { pluginId: string } }
  | { mode: 'mix'; selection: { notions: string[] } };

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
