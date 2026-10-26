import type { WidgetId } from '../question';
import { classifyWidget } from './classify';
import { clockWidget } from './clock';
import { columnOpWidget } from './column-op';
import { fillBlankWidget } from './fill-blank';
import { geometryWidget } from './geometry';
import { mcqWidget } from './mcq';
import { moneyWidget } from './money';
import { numberInputWidget } from './number-input';
import { orderWidget } from './order';
import type { WidgetDef } from './types';
import { wordSelectWidget } from './word-select';

export const WIDGETS: { [W in WidgetId]: WidgetDef<W> } = {
  'column-op': columnOpWidget,
  'number-input': numberInputWidget,
  mcq: mcqWidget,
  'word-select': wordSelectWidget,
  classify: classifyWidget,
  'fill-blank': fillBlankWidget,
  geometry: geometryWidget,
  order: orderWidget,
  clock: clockWidget,
  money: moneyWidget,
};

export function getWidget<W extends WidgetId>(id: W): WidgetDef<W> {
  const widget = WIDGETS[id];
  if (!widget) throw new Error(`Widget inconnu : ${id}`);
  return widget;
}

export * from './column-op';
export { compareAssignments } from './assign';
export { ACCENT_HINT, blankParts, compareBlanks } from './fill-blank';
export { checkGeometry, DEFAULT_TOLERANCE, sameDrawing, type GeometryRules } from './geometry';
export { compareMoney, pickedTotal } from './money';
export { normalizeNumber } from './number-input';
export { compareOrder, orderText } from './order';
export type { WidgetDef } from './types';
export { isSelectable, tokensText } from './word-select';
