import type { WidgetId } from '../question';
import { classifyWidget } from './classify';
import { columnOpWidget } from './column-op';
import { fillBlankWidget } from './fill-blank';
import { mcqWidget } from './mcq';
import { numberInputWidget } from './number-input';
import type { WidgetDef } from './types';
import { wordSelectWidget } from './word-select';

export const WIDGETS: { [W in WidgetId]: WidgetDef<W> } = {
  'column-op': columnOpWidget,
  'number-input': numberInputWidget,
  mcq: mcqWidget,
  'word-select': wordSelectWidget,
  classify: classifyWidget,
  'fill-blank': fillBlankWidget,
};

export function getWidget<W extends WidgetId>(id: W): WidgetDef<W> {
  const widget = WIDGETS[id];
  if (!widget) throw new Error(`Widget inconnu : ${id}`);
  return widget;
}

export * from './column-op';
export { compareAssignments } from './assign';
export { ACCENT_HINT, blankParts, compareBlanks } from './fill-blank';
export { normalizeNumber } from './number-input';
export type { WidgetDef } from './types';
export { isSelectable, tokensText } from './word-select';
