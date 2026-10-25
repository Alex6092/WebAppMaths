import { royaumeMagique } from './royaume-magique';
import type { Theme } from './types';

export const THEMES: Theme[] = [royaumeMagique];

export const DEFAULT_THEME_ID = royaumeMagique.id;

export function getTheme(id: string | null | undefined): Theme {
  return THEMES.find((t) => t.id === id) ?? royaumeMagique;
}

export function findReward(themeId: string, rewardId: string) {
  return THEMES.find((t) => t.id === themeId)?.rewards.find((r) => r.id === rewardId);
}

export type { Reward, Theme } from './types';
