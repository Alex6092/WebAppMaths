// Fichier généré par scripts/gen-registry.ts : ne pas modifier à la main.
import type { AnyPlugin, Domain, Notion } from '@app/core';

import plugin0 from './anglais/ecoute/histoires/plugin';
import plugin1 from './anglais/ecoute/salutations/plugin';
import plugin2 from './anglais/vocabulaire/animaux/plugin';
import plugin3 from './anglais/vocabulaire/couleurs/plugin';
import plugin4 from './anglais/vocabulaire/ecris-nombre/plugin';
import plugin5 from './anglais/vocabulaire/famille/plugin';
import plugin6 from './anglais/vocabulaire/jours/plugin';
import plugin7 from './anglais/vocabulaire/nombres/plugin';
import plugin8 from './emc/vie-classe/missions-delegues/plugin';
import plugin9 from './francais/conjugaison/analyse-verbe/plugin';
import plugin10 from './francais/conjugaison/choisis-verbe/plugin';
import plugin11 from './francais/conjugaison/coche-temps/plugin';
import plugin12 from './francais/conjugaison/colorie-indicateurs/plugin';
import plugin13 from './francais/conjugaison/colorie-verbes/plugin';
import plugin14 from './francais/conjugaison/complete-indicateur/plugin';
import plugin15 from './francais/conjugaison/conjugue-present/plugin';
import plugin16 from './francais/conjugaison/definition-temps/plugin';
import plugin17 from './francais/conjugaison/donne-infinitif/plugin';
import plugin18 from './francais/conjugaison/entoure-indicateur/plugin';
import plugin19 from './francais/conjugaison/present-ils-elles/plugin';
import plugin20 from './francais/conjugaison/range-indicateurs/plugin';
import plugin21 from './francais/conjugaison/reecris-temps/plugin';
import plugin22 from './francais/conjugaison/relie-indicateur/plugin';
import plugin23 from './francais/conjugaison/souligne-verbe/plugin';
import plugin24 from './francais/conjugaison/vrai-faux-temps/plugin';
import plugin25 from './francais/grammaire/choisis-point/plugin';
import plugin26 from './francais/grammaire/est-ce-une-phrase/plugin';
import plugin27 from './francais/grammaire/remets-ordre/plugin';
import plugin28 from './francais/grammaire/type-phrase/plugin';
import plugin29 from './francais/lecture/comprendre-texte/plugin';
import plugin30 from './francais/lecture/documentaire-loup/plugin';
import plugin31 from './francais/lecture/ecoute-touche-p/plugin';
import plugin32 from './francais/lecture/ecoute-touche/plugin';
import plugin33 from './francais/oral/histoires/plugin';
import plugin34 from './francais/oral/ordre-histoire/plugin';
import plugin35 from './francais/orthographe/a-a/plugin';
import plugin36 from './francais/orthographe/accorde/plugin';
import plugin37 from './francais/orthographe/complete-lettre-p/plugin';
import plugin38 from './francais/orthographe/d-muet/plugin';
import plugin39 from './francais/orthographe/dictee-4/plugin';
import plugin40 from './francais/orthographe/dictee-5/plugin';
import plugin41 from './francais/orthographe/dictee-6/plugin';
import plugin42 from './francais/orthographe/dictee-mots/plugin';
import plugin43 from './francais/orthographe/dictee-phrases/plugin';
import plugin44 from './francais/orthographe/ecris-pluriel/plugin';
import plugin45 from './francais/orthographe/et-est/plugin';
import plugin46 from './francais/orthographe/lettre-d-classe/plugin';
import plugin47 from './francais/orthographe/lettre-p-classe/plugin';
import plugin48 from './francais/orthographe/lettre-p-colorie/plugin';
import plugin49 from './francais/orthographe/lettre-p-devinettes/plugin';
import plugin50 from './francais/orthographe/lettre-t-classe/plugin';
import plugin51 from './francais/orthographe/lettre-t-colorie/plugin';
import plugin52 from './francais/orthographe/on-ont/plugin';
import plugin53 from './francais/orthographe/pluriel-groupe/plugin';
import plugin54 from './francais/orthographe/singulier-pluriel/plugin';
import plugin55 from './francais/orthographe/son-sont/plugin';
import plugin56 from './francais/orthographe/t-muet/plugin';
import plugin57 from './francais/orthographe/t-ou-d/plugin';
import plugin58 from './francais/vocabulaire/avant-apres/plugin';
import plugin59 from './francais/vocabulaire/classe-familles/plugin';
import plugin60 from './francais/vocabulaire/coche-radical/plugin';
import plugin61 from './francais/vocabulaire/contraire-prefixe/plugin';
import plugin62 from './francais/vocabulaire/deux-familles/plugin';
import plugin63 from './francais/vocabulaire/ecris-radical/plugin';
import plugin64 from './francais/vocabulaire/intrus-famille/plugin';
import plugin65 from './francais/vocabulaire/meme-famille/plugin';
import plugin66 from './francais/vocabulaire/range-alphabetique/plugin';
import plugin67 from './francais/vocabulaire/relie-contraires/plugin';
import plugin68 from './francais/vocabulaire/relie-familles/plugin';
import plugin69 from './francais/vocabulaire/relie-synonymes/plugin';
import plugin70 from './francais/vocabulaire/trouve-contraire/plugin';
import plugin71 from './francais/vocabulaire/trouve-synonyme/plugin';
import plugin72 from './maths/calcul/addition-posee/plugin';
import plugin73 from './maths/calcul/calcul-mental/plugin';
import plugin74 from './maths/calcul/complete-maison-12-13/plugin';
import plugin75 from './maths/calcul/complete-maison/plugin';
import plugin76 from './maths/calcul/range-maisons-12-13/plugin';
import plugin77 from './maths/calcul/range-maisons/plugin';
import plugin78 from './maths/calcul/relie-maisons-12-13/plugin';
import plugin79 from './maths/calcul/relie-maisons/plugin';
import plugin80 from './maths/calcul/soustraction-posee/plugin';
import plugin81 from './maths/calcul/tables/plugin';
import plugin82 from './maths/geometrie/alignes-oui-non/plugin';
import plugin83 from './maths/geometrie/entoure-milieu/plugin';
import plugin84 from './maths/geometrie/entoure-segments/plugin';
import plugin85 from './maths/geometrie/longueurs-milieu/plugin';
import plugin86 from './maths/geometrie/milieu-oui-non/plugin';
import plugin87 from './maths/geometrie/nomme-segment/plugin';
import plugin88 from './maths/geometrie/place-alignes/plugin';
import plugin89 from './maths/geometrie/place-milieu/plugin';
import plugin90 from './maths/geometrie/relie-alignes/plugin';
import plugin91 from './maths/geometrie/trace-alignes/plugin';
import plugin92 from './maths/geometrie/trace-segment-milieu/plugin';
import plugin93 from './maths/geometrie/vocabulaire-segment/plugin';
import plugin94 from './maths/mesures/compare-longueurs/plugin';
import plugin95 from './maths/mesures/compte-argent/plugin';
import plugin96 from './maths/mesures/convertis-longueur/plugin';
import plugin97 from './maths/mesures/dans-combien/plugin';
import plugin98 from './maths/mesures/heure-en-mots/plugin';
import plugin99 from './maths/mesures/lis-heure/plugin';
import plugin100 from './maths/mesures/mesure-segment/plugin';
import plugin101 from './maths/mesures/moins-de-pieces/plugin';
import plugin102 from './maths/mesures/paie/plugin';
import plugin103 from './maths/mesures/quelle-horloge/plugin';
import plugin104 from './maths/mesures/qui-a-le-plus/plugin';
import plugin105 from './maths/mesures/regle-horloge/plugin';
import plugin106 from './maths/mesures/rendre-monnaie/plugin';
import plugin107 from './maths/mesures/unites-duree/plugin';
import plugin108 from './maths/nombres/comparer-signe/plugin';
import plugin109 from './maths/nombres/decomposer/plugin';
import plugin110 from './maths/nombres/ecrire-chiffres/plugin';
import plugin111 from './maths/nombres/ecrire-lettres/plugin';
import plugin112 from './maths/nombres/encadrer/plugin';
import plugin113 from './maths/nombres/lire-nombre/plugin';
import plugin114 from './maths/nombres/ranger/plugin';
import plugin115 from './maths/problemes/enonce-question/plugin';
import plugin116 from './maths/problemes/mot-qui-regroupe/plugin';
import plugin117 from './maths/problemes/parmi-les/plugin';
import plugin118 from './maths/problemes/phrase-reponse/plugin';
import plugin119 from './maths/problemes/quelle-operation/plugin';
import plugin120 from './maths/problemes/relie-enonce/plugin';
import plugin121 from './maths/problemes/resous-probleme/plugin';
import plugin122 from './musique/ecoute/grave-aigu/plugin';
import plugin123 from './musique/ecoute/monte-descend/plugin';
import plugin124 from './musique/ecoute/quelle-portee/plugin';
import plugin125 from './musique/instruments/piano-nom/plugin';
import plugin126 from './musique/instruments/piano-touche/plugin';
import plugin127 from './musique/instruments/violon/plugin';
import plugin128 from './musique/lecture/cle-de-fa/plugin';
import plugin129 from './musique/lecture/cle-de-sol/plugin';
import plugin130 from './musique/lecture/deux-cles/plugin';
import plugin131 from './musique/lecture/place-note/plugin';
import plugin132 from './musique/lecture/reperer/plugin';
import plugin133 from './musique/rythme/combien-de-temps/plugin';
import plugin134 from './musique/rythme/complete-mesure/plugin';
import plugin135 from './musique/rythme/figures/plugin';
import plugin136 from './qlm/matiere/change-etat/plugin';
import plugin137 from './qlm/matiere/solide-liquide/plugin';
import plugin138 from './qlm/temps/compte-calendrier/plugin';
import plugin139 from './qlm/temps/jour-calendrier/plugin';
import plugin140 from './qlm/temps/quel-jour/plugin';
import plugin141 from './qlm/temps/quel-mois/plugin';
import plugin142 from './qlm/temps/range-jours/plugin';
import plugin143 from './qlm/temps/range-mois/plugin';
import plugin144 from './qlm/temps/range-moments/plugin';
import plugin145 from './qlm/temps/range-saisons/plugin';
import plugin146 from './qlm/temps/saison-du-mois/plugin';
import plugin147 from './qlm/vivant/aliments-transformes/plugin';
import plugin148 from './qlm/vivant/associe-role-aliment/plugin';
import plugin149 from './qlm/vivant/besoins-plante/plugin';
import plugin150 from './qlm/vivant/classe-animaux/plugin';
import plugin151 from './qlm/vivant/classe-familles-aliments/plugin';
import plugin152 from './qlm/vivant/cycle-vie/plugin';
import plugin153 from './qlm/vivant/famille-aliment/plugin';
import plugin154 from './qlm/vivant/lis-tableau-nutriments/plugin';
import plugin155 from './qlm/vivant/origine-aliments/plugin';
import plugin156 from './qlm/vivant/parties-plante/plugin';
import plugin157 from './qlm/vivant/petit-animal/plugin';
import plugin158 from './qlm/vivant/provenance-aliments/plugin';
import plugin159 from './qlm/vivant/quel-sens/plugin';
import plugin160 from './qlm/vivant/relie-sens/plugin';
import plugin161 from './qlm/vivant/vivant-ou-pas/plugin';
import * as domains0 from './anglais/domains';
import * as domains1 from './emc/domains';
import * as domains2 from './francais/domains';
import * as domains3 from './maths/domains';
import * as domains4 from './musique/domains';
import * as domains5 from './qlm/domains';

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
  plugin48,
  plugin49,
  plugin50,
  plugin51,
  plugin52,
  plugin53,
  plugin54,
  plugin55,
  plugin56,
  plugin57,
  plugin58,
  plugin59,
  plugin60,
  plugin61,
  plugin62,
  plugin63,
  plugin64,
  plugin65,
  plugin66,
  plugin67,
  plugin68,
  plugin69,
  plugin70,
  plugin71,
  plugin72,
  plugin73,
  plugin74,
  plugin75,
  plugin76,
  plugin77,
  plugin78,
  plugin79,
  plugin80,
  plugin81,
  plugin82,
  plugin83,
  plugin84,
  plugin85,
  plugin86,
  plugin87,
  plugin88,
  plugin89,
  plugin90,
  plugin91,
  plugin92,
  plugin93,
  plugin94,
  plugin95,
  plugin96,
  plugin97,
  plugin98,
  plugin99,
  plugin100,
  plugin101,
  plugin102,
  plugin103,
  plugin104,
  plugin105,
  plugin106,
  plugin107,
  plugin108,
  plugin109,
  plugin110,
  plugin111,
  plugin112,
  plugin113,
  plugin114,
  plugin115,
  plugin116,
  plugin117,
  plugin118,
  plugin119,
  plugin120,
  plugin121,
  plugin122,
  plugin123,
  plugin124,
  plugin125,
  plugin126,
  plugin127,
  plugin128,
  plugin129,
  plugin130,
  plugin131,
  plugin132,
  plugin133,
  plugin134,
  plugin135,
  plugin136,
  plugin137,
  plugin138,
  plugin139,
  plugin140,
  plugin141,
  plugin142,
  plugin143,
  plugin144,
  plugin145,
  plugin146,
  plugin147,
  plugin148,
  plugin149,
  plugin150,
  plugin151,
  plugin152,
  plugin153,
  plugin154,
  plugin155,
  plugin156,
  plugin157,
  plugin158,
  plugin159,
  plugin160,
  plugin161,
];

/** Identifiant attendu de chaque plugin, déduit de son dossier. */
export const pluginPathIds: string[] = [
  'anglais.ecoute.histoires',
  'anglais.ecoute.salutations',
  'anglais.vocabulaire.animaux',
  'anglais.vocabulaire.couleurs',
  'anglais.vocabulaire.ecris-nombre',
  'anglais.vocabulaire.famille',
  'anglais.vocabulaire.jours',
  'anglais.vocabulaire.nombres',
  'emc.vie-classe.missions-delegues',
  'francais.conjugaison.analyse-verbe',
  'francais.conjugaison.choisis-verbe',
  'francais.conjugaison.coche-temps',
  'francais.conjugaison.colorie-indicateurs',
  'francais.conjugaison.colorie-verbes',
  'francais.conjugaison.complete-indicateur',
  'francais.conjugaison.conjugue-present',
  'francais.conjugaison.definition-temps',
  'francais.conjugaison.donne-infinitif',
  'francais.conjugaison.entoure-indicateur',
  'francais.conjugaison.present-ils-elles',
  'francais.conjugaison.range-indicateurs',
  'francais.conjugaison.reecris-temps',
  'francais.conjugaison.relie-indicateur',
  'francais.conjugaison.souligne-verbe',
  'francais.conjugaison.vrai-faux-temps',
  'francais.grammaire.choisis-point',
  'francais.grammaire.est-ce-une-phrase',
  'francais.grammaire.remets-ordre',
  'francais.grammaire.type-phrase',
  'francais.lecture.comprendre-texte',
  'francais.lecture.documentaire-loup',
  'francais.lecture.ecoute-touche-p',
  'francais.lecture.ecoute-touche',
  'francais.oral.histoires',
  'francais.oral.ordre-histoire',
  'francais.orthographe.a-a',
  'francais.orthographe.accorde',
  'francais.orthographe.complete-lettre-p',
  'francais.orthographe.d-muet',
  'francais.orthographe.dictee-4',
  'francais.orthographe.dictee-5',
  'francais.orthographe.dictee-6',
  'francais.orthographe.dictee-mots',
  'francais.orthographe.dictee-phrases',
  'francais.orthographe.ecris-pluriel',
  'francais.orthographe.et-est',
  'francais.orthographe.lettre-d-classe',
  'francais.orthographe.lettre-p-classe',
  'francais.orthographe.lettre-p-colorie',
  'francais.orthographe.lettre-p-devinettes',
  'francais.orthographe.lettre-t-classe',
  'francais.orthographe.lettre-t-colorie',
  'francais.orthographe.on-ont',
  'francais.orthographe.pluriel-groupe',
  'francais.orthographe.singulier-pluriel',
  'francais.orthographe.son-sont',
  'francais.orthographe.t-muet',
  'francais.orthographe.t-ou-d',
  'francais.vocabulaire.avant-apres',
  'francais.vocabulaire.classe-familles',
  'francais.vocabulaire.coche-radical',
  'francais.vocabulaire.contraire-prefixe',
  'francais.vocabulaire.deux-familles',
  'francais.vocabulaire.ecris-radical',
  'francais.vocabulaire.intrus-famille',
  'francais.vocabulaire.meme-famille',
  'francais.vocabulaire.range-alphabetique',
  'francais.vocabulaire.relie-contraires',
  'francais.vocabulaire.relie-familles',
  'francais.vocabulaire.relie-synonymes',
  'francais.vocabulaire.trouve-contraire',
  'francais.vocabulaire.trouve-synonyme',
  'maths.calcul.addition-posee',
  'maths.calcul.calcul-mental',
  'maths.calcul.complete-maison-12-13',
  'maths.calcul.complete-maison',
  'maths.calcul.range-maisons-12-13',
  'maths.calcul.range-maisons',
  'maths.calcul.relie-maisons-12-13',
  'maths.calcul.relie-maisons',
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
  'maths.mesures.compare-longueurs',
  'maths.mesures.compte-argent',
  'maths.mesures.convertis-longueur',
  'maths.mesures.dans-combien',
  'maths.mesures.heure-en-mots',
  'maths.mesures.lis-heure',
  'maths.mesures.mesure-segment',
  'maths.mesures.moins-de-pieces',
  'maths.mesures.paie',
  'maths.mesures.quelle-horloge',
  'maths.mesures.qui-a-le-plus',
  'maths.mesures.regle-horloge',
  'maths.mesures.rendre-monnaie',
  'maths.mesures.unites-duree',
  'maths.nombres.comparer-signe',
  'maths.nombres.decomposer',
  'maths.nombres.ecrire-chiffres',
  'maths.nombres.ecrire-lettres',
  'maths.nombres.encadrer',
  'maths.nombres.lire-nombre',
  'maths.nombres.ranger',
  'maths.problemes.enonce-question',
  'maths.problemes.mot-qui-regroupe',
  'maths.problemes.parmi-les',
  'maths.problemes.phrase-reponse',
  'maths.problemes.quelle-operation',
  'maths.problemes.relie-enonce',
  'maths.problemes.resous-probleme',
  'musique.ecoute.grave-aigu',
  'musique.ecoute.monte-descend',
  'musique.ecoute.quelle-portee',
  'musique.instruments.piano-nom',
  'musique.instruments.piano-touche',
  'musique.instruments.violon',
  'musique.lecture.cle-de-fa',
  'musique.lecture.cle-de-sol',
  'musique.lecture.deux-cles',
  'musique.lecture.place-note',
  'musique.lecture.reperer',
  'musique.rythme.combien-de-temps',
  'musique.rythme.complete-mesure',
  'musique.rythme.figures',
  'qlm.matiere.change-etat',
  'qlm.matiere.solide-liquide',
  'qlm.temps.compte-calendrier',
  'qlm.temps.jour-calendrier',
  'qlm.temps.quel-jour',
  'qlm.temps.quel-mois',
  'qlm.temps.range-jours',
  'qlm.temps.range-mois',
  'qlm.temps.range-moments',
  'qlm.temps.range-saisons',
  'qlm.temps.saison-du-mois',
  'qlm.vivant.aliments-transformes',
  'qlm.vivant.associe-role-aliment',
  'qlm.vivant.besoins-plante',
  'qlm.vivant.classe-animaux',
  'qlm.vivant.classe-familles-aliments',
  'qlm.vivant.cycle-vie',
  'qlm.vivant.famille-aliment',
  'qlm.vivant.lis-tableau-nutriments',
  'qlm.vivant.origine-aliments',
  'qlm.vivant.parties-plante',
  'qlm.vivant.petit-animal',
  'qlm.vivant.provenance-aliments',
  'qlm.vivant.quel-sens',
  'qlm.vivant.relie-sens',
  'qlm.vivant.vivant-ou-pas',
];

export const domainModules: { domains: Domain[]; notions: Notion[] }[] = [
  domains0,
  domains1,
  domains2,
  domains3,
  domains4,
  domains5,
];
