import type { WidgetId } from '@app/core';

/** Widgets qui ont leur propre bouton ✓ (pavé numérique) : l'écran n'affiche pas « Valider ». */
export const HAS_OWN_SUBMIT: Record<WidgetId, boolean> = {
  'column-op': true,
  'number-input': true,
  mcq: false,
  'word-select': false,
  classify: false,
  'fill-blank': false,
  geometry: false,
  order: false,
  clock: false,
  money: false,
};

export { default as Widget } from './Widget.svelte';
export type { Phase } from './types';
