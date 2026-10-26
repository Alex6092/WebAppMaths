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
import plugin12 from './francais/grammaire/choisis-point/plugin';
import plugin13 from './francais/grammaire/est-ce-une-phrase/plugin';
import plugin14 from './francais/grammaire/remets-ordre/plugin';
import plugin15 from './francais/grammaire/type-phrase/plugin';
import plugin16 from './francais/vocabulaire/classe-familles/plugin';
import plugin17 from './francais/vocabulaire/intrus-famille/plugin';
import plugin18 from './francais/vocabulaire/meme-famille/plugin';
import plugin19 from './maths/calcul/addition-posee/plugin';
import plugin20 from './maths/calcul/calcul-mental/plugin';
import plugin21 from './maths/calcul/soustraction-posee/plugin';
import plugin22 from './maths/calcul/tables/plugin';
import plugin23 from './maths/geometrie/alignes-oui-non/plugin';
import plugin24 from './maths/geometrie/entoure-milieu/plugin';
import plugin25 from './maths/geometrie/entoure-segments/plugin';
import plugin26 from './maths/geometrie/longueurs-milieu/plugin';
import plugin27 from './maths/geometrie/milieu-oui-non/plugin';
import plugin28 from './maths/geometrie/nomme-segment/plugin';
import plugin29 from './maths/geometrie/place-alignes/plugin';
import plugin30 from './maths/geometrie/place-milieu/plugin';
import plugin31 from './maths/geometrie/relie-alignes/plugin';
import plugin32 from './maths/geometrie/trace-alignes/plugin';
import plugin33 from './maths/geometrie/trace-segment-milieu/plugin';
import plugin34 from './maths/geometrie/vocabulaire-segment/plugin';
import plugin35 from './maths/mesures/mesure-segment/plugin';
import plugin36 from './maths/nombres/comparer-signe/plugin';
import plugin37 from './maths/nombres/decomposer/plugin';
import plugin38 from './maths/nombres/ecrire-chiffres/plugin';
import plugin39 from './maths/nombres/ecrire-lettres/plugin';
import plugin40 from './maths/nombres/encadrer/plugin';
import plugin41 from './maths/nombres/lire-nombre/plugin';
import plugin42 from './maths/nombres/ranger/plugin';
import plugin43 from './qlm/vivant/aliments-transformes/plugin';
import plugin44 from './qlm/vivant/classe-familles-aliments/plugin';
import plugin45 from './qlm/vivant/famille-aliment/plugin';
import plugin46 from './qlm/vivant/origine-aliments/plugin';
import plugin47 from './qlm/vivant/provenance-aliments/plugin';
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
  plugin29,
  plugin30,
  plugin31,
  plugin32,
  plugin33,
  plugin34,
  plugin35,
  plugin36,
  plugin37,
  plugin38,
  plugin39,
  plugin40,
  plugin41,
  plugin42,
  plugin43,
  plugin44,
  plugin45,
  plugin46,
  plugin47,
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
  'francais.grammaire.choisis-point',
  'francais.grammaire.est-ce-une-phrase',
  'francais.grammaire.remets-ordre',
  'francais.grammaire.type-phrase',
  'francais.vocabulaire.classe-familles',
  'francais.vocabulaire.intrus-famille',
  'francais.vocabulaire.meme-famille',
  'maths.calcul.addition-posee',
  'maths.calcul.calcul-mental',
  'maths.calcul.soustraction-posee',
  'maths.calcul.tables',
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
  'maths.nombres.decomposer',
  'maths.nombres.ecrire-chiffres',
  'maths.nombres.ecrire-lettres',
  'maths.nombres.encadrer',
  'maths.nombres.lire-nombre',
  'maths.nombres.ranger',
  'qlm.vivant.aliments-transformes',
  'qlm.vivant.classe-familles-aliments',
  'qlm.vivant.famille-aliment',
  'qlm.vivant.origine-aliments',
  'qlm.vivant.provenance-aliments',
];

export const domainModules: { domains: Domain[]; notions: Notion[] }[] = [
  domains0,
  domains1,
  domains2,
  domains3,
];
