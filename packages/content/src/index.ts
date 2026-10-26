import { Registry, type Catalog } from '@app/core';
import { subjects } from './catalog/subjects';
import { domainModules, pluginPathIds, plugins } from './registry.generated';

export const catalog: Catalog = {
  subjects,
  domains: domainModules.flatMap((m) => m.domains),
  notions: domainModules.flatMap((m) => m.notions),
};

export const registry = new Registry(catalog, plugins);

export { pluginPathIds };

export { PLACE_COLORS, type Place } from './maths/lib/couleurs';
