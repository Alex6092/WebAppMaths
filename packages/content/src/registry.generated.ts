// Fichier généré par scripts/gen-registry.ts : ne pas modifier à la main.
import type { AnyPlugin, Domain, Notion } from '@app/core';

import plugin0 from './maths/calcul/addition-posee/plugin';
import plugin1 from './maths/calcul/calcul-mental/plugin';
import plugin2 from './maths/calcul/soustraction-posee/plugin';
import plugin3 from './maths/nombres/comparer-signe/plugin';
import * as domains0 from './anglais/domains';
import * as domains1 from './francais/domains';
import * as domains2 from './maths/domains';
import * as domains3 from './qlm/domains';

export const plugins: AnyPlugin[] = [
  plugin0,
  plugin1,
  plugin2,
  plugin3,
];

/** Identifiant attendu de chaque plugin, déduit de son dossier. */
export const pluginPathIds: string[] = [
  'maths.calcul.addition-posee',
  'maths.calcul.calcul-mental',
  'maths.calcul.soustraction-posee',
  'maths.nombres.comparer-signe',
];

export const domainModules: { domains: Domain[]; notions: Notion[] }[] = [
  domains0,
  domains1,
  domains2,
  domains3,
];
