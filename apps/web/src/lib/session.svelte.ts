import type { ChildDto, ChildStateResponse, MeResponse } from '@app/core';
import { api, ApiError } from './api';
import { applyTheme } from './theme';

/** État global : la famille connectée et l'enfant qui joue. */
export const session = $state({
  ready: false,
  me: null as MeResponse | null,
  childState: null as ChildStateResponse | null,
});

export function activeChild(): ChildDto | null {
  const me = session.me;
  return me?.children.find((c) => c.id === me.activeChildId) ?? null;
}

export function isParentUnlocked(): boolean {
  return (session.me?.parentVerifiedUntil ?? 0) > Date.now();
}

export function setMe(me: MeResponse | null): void {
  session.me = me;
  if (!me || me.activeChildId === null) session.childState = null;
  applyTheme(activeChild()?.themeId);
}

export async function refreshMe(): Promise<void> {
  try {
    setMe(await api.get<MeResponse>('auth/me'));
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 401)) throw error;
    setMe(null);
  } finally {
    session.ready = true;
  }
}

export async function loadChildState(): Promise<ChildStateResponse> {
  const state = await api.get<ChildStateResponse>('child/state');
  session.childState = state;
  return state;
}

/** Met à jour le solde affiché partout. */
export function setCoins(coins: number): void {
  const child = activeChild();
  if (child) child.coins = coins;
  if (session.childState) session.childState.child.coins = coins;
}

export async function selectChild(childId: number | null): Promise<void> {
  setMe(await api.post<MeResponse>('auth/active-child', { childId }));
  if (childId !== null) await loadChildState();
}
