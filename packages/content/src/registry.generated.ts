// Fichier généré par scripts/gen-registry.ts : ne pas modifier à la main.
import type { AnyPlugin, Domain, Notion } from '@app/core';

import plugin0 from './francais/conjugaison/choisis-verbe/plugin';
import plugin1 from './francais/conjugaison/coche-temps/plugin';
import plugin2 from './francais/conjugaison/colorie-indicateurs/plugin';
import plugin3 from './francais/conjugaison/colorie-verbes/plugin';
import plugin4 from './francais/conjugaison/complete-indicateur/plugin';
import plugin5 from './francais/conjugaison/definition-temps/plugin';
import plugin6 from './francais/conjugaison/donne-infinitif/plugin';
import plugin7 from './francais/conjugaison/entoure-indicateur/plugin';
import plugin8 from './francais/conjugaison/range-indicateurs/plugin';
import plugin9 from './francais/conjugaison/reecris-temps/plugin';
import plugin10 from './francais/conjugaison/souligne-verbe/plugin';
import plugin11 from './francais/conjugaison/vrai-faux-temps/plugin';
import plugin12 from './maths/calcul/addition-posee/plugin';
import plugin13 from './maths/calcul/calcul-mental/plugin';
import plugin14 from './maths/calcul/soustraction-posee/plugin';
import plugin15 from './maths/geometrie/alignes-oui-non/plugin';
import plugin16 from './maths/geometrie/entoure-milieu/plugin';
import plugin17 from './maths/geometrie/entoure-segments/plugin';
import plugin18 from './maths/geometrie/longueurs-milieu/plugin';
import plugin19 from './maths/geometrie/milieu-oui-non/plugin';
import plugin20 from './maths/geometrie/nomme-segment/plugin';
import plugin21 from './maths/geometrie/place-alignes/plugin';
import plugin22 from './maths/geometrie/place-milieu/plugin';
import plugin23 from './maths/geometrie/relie-alignes/plugin';
import plugin24 from './maths/geometrie/trace-alignes/plugin';
import plugin25 from './maths/geometrie/trace-segment-milieu/plugin';
import plugin26 from './maths/geometrie/vocabulaire-segment/plugin';
import plugin27 from './maths/mesures/mesure-segment/plugin';
import plugin28 from './maths/nombres/comparer-signe/plugin';
import * as domains0 from './anglais/domains';
import * as domains1 from './francais/domains';
import * as domains2 from './maths/domains';
import * as domains3 from './qlm/domains';

export const plugins: AnyPlugin[] = [
  plugin0,
  plugin1,
  plugin2,
  plugin3,
  plugin4,
  plugin5,
  plugin6,
  plugin7,
  plugin8,
  plugin9,
  plugin10,
  plugin11,
  plugin12,
  plugin13,
  plugin14,
  plugin15,
  plugin16,
  plugin17,
  plugin18,
  plugin19,
  plugin20,
  plugin21,
  plugin22,
  plugin23,
  plugin24,
  plugin25,
  plugin26,
  plugin27,
  plugin28,
];

/** Identifiant attendu de chaque plugin, déduit de son dossier. */
export const pluginPathIds: string[] = [
  'francais.conjugaison.choisis-verbe',
  'francais.conjugaison.coche-temps',
  'francais.conjugaison.colorie-indicateurs',
  'francais.conjugaison.colorie-verbes',
  'francais.conjugaison.complete-indicateur',
  'francais.conjugaison.definition-temps',
  'francais.conjugaison.donne-infinitif',
  'francais.conjugaison.entoure-indicateur',
  'francais.conjugaison.range-indicateurs',
  'francais.conjugaison.reecris-temps',
  'francais.conjugaison.souligne-verbe',
  'francais.conjugaison.vrai-faux-temps',
  'maths.calcul.addition-posee',
  'maths.calcul.calcul-mental',
  'maths.calcul.soustraction-posee',
  'maths.geometrie.alignes-oui-non',
  'maths.geometrie.entoure-milieu',
  'maths.geometrie.entoure-segments',
  'maths.geometrie.longueurs-milieu',
  'maths.geometrie.milieu-oui-non',
  'maths.geometrie.nomme-segment',
  'maths.geometrie.place-alignes',
  'maths.geometrie.place-milieu',
  'maths.geometrie.relie-alignes',
  'maths.geometrie.trace-alignes',
  'maths.geometrie.trace-segment-milieu',
  'maths.geometrie.vocabulaire-segment',
  'maths.mesures.mesure-segment',
  'maths.nombres.comparer-signe',
];

export const domainModules: { domains: Domain[]; notions: Notion[] }[] = [
  domains0,
  domains1,
  domains2,
  domains3,
];
