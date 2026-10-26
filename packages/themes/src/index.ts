import { explorationSpatiale } from './exploration-spatiale';
import { refugeAnimaux } from './refuge-animaux';
import { royaumeMagique } from './royaume-magique';
import type { Theme } from './types';

export const THEMES: Theme[] = [royaumeMagique, explorationSpatiale, refugeAnimaux];

export const DEFAULT_THEME_ID = royaumeMagique.id;

export function getTheme(id: string | null | undefined): Theme {
  return THEMES.find((t) => t.id === id) ?? royaumeMagique;
}

export function findTheme(id: string): Theme | undefined {
  return THEMES.find((t) => t.id === id);
}

/** Ambiances gratuites (sans pièces à dépenser). */
export const FREE_THEME_IDS = THEMES.filter((t) => t.unlockCost === 0).map((t) => t.id);

export function findReward(themeId: string, rewardId: string) {
  return THEMES.find((t) => t.id === themeId)?.rewards.find((r) => r.id === rewardId);
}

export type { Reward, Theme } from './types';
