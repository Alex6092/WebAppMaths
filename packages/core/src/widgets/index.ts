import type { WidgetId } from '../question';
import { columnOpWidget } from './column-op';
import { mcqWidget } from './mcq';
import { numberInputWidget } from './number-input';
import type { WidgetDef } from './types';

export const WIDGETS: { [W in WidgetId]: WidgetDef<W> } = {
  'column-op': columnOpWidget,
  'number-input': numberInputWidget,
  mcq: mcqWidget,
};

export function getWidget<W extends WidgetId>(id: W): WidgetDef<W> {
  const widget = WIDGETS[id];
  if (!widget) throw new Error(`Widget inconnu : ${id}`);
  return widget;
}

export * from './column-op';
export { normalizeNumber } from './number-input';
export type { WidgetDef } from './types';
