import type { ClassifyCategory, PickColor } from '@app/core';
import { MOMENT_LABEL, MOMENTS, type Moment } from './conjugaison';

/** Couleurs de l'école : le PASSÉ en bleu, le PRÉSENT en orange, le FUTUR en vert. */
export const MOMENT_COLOR: Record<Moment, string> = {
  passe: '#bbdefb',
  present: '#ffd59a',
  futur: '#c5e1a5',
};

export const MOMENT_PICKS: PickColor[] = MOMENTS.map((m) => ({
  id: m,
  label: `le ${MOMENT_LABEL[m].toUpperCase()} en ${{ passe: 'bleu', present: 'orange', futur: 'vert' }[m]}`,
  color: MOMENT_COLOR[m],
}));

export const MOMENT_CATEGORIES: ClassifyCategory[] = MOMENTS.map((m) => ({
  id: m,
  label: MOMENT_LABEL[m],
  color: MOMENT_COLOR[m],
}));

/** Une seule couleur (« COLORIE les verbes à l'infinitif »). */
export const PINK: PickColor[] = [{ id: 'x', label: 'colorié', color: '#f8bbd0' }];
export const RED_PEN: PickColor[] = [{ id: 'x', label: 'au crayon rouge', color: '#d32f2f' }];
