import { checkPluginContract } from '@app/core';
import { describe, expect, it } from 'vitest';
import { pluginPathIds, registry } from './index';

describe('catalogue', () => {
  it('n’a pas de référence cassée', () => {
    expect(registry.validate()).toEqual([]);
  });

  it('chaque notion est entraînée par au moins un plugin', () => {
    const orphans = registry.notions.filter((n) => registry.pluginsOfNotion(n.id).length === 0);
    expect(orphans.map((n) => n.id)).toEqual([]);
  });
});

// Le test de contrat s'applique tout seul à chaque plugin du registre.
describe.each(registry.plugins.map((plugin, i) => ({ plugin, expectedId: pluginPathIds[i]! })))(
  'plugin $plugin.id',
  ({ plugin, expectedId }) => {
    it('respecte le contrat (500 graines par niveau)', () => {
      const notionIds = new Set(registry.notions.map((n) => n.id));
      expect(checkPluginContract(plugin, { notionIds, expectedId })).toEqual([]);
    });
  },
);
