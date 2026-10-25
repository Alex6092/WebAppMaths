import { verbKind, type VerbKind } from './conjugaison';

/**
 * Banque de verbes pour fabriquer des phrases. Les compléments n'ont pas de possessif
 * (« ta chambre ») : ils vont avec tous les sujets et tous les temps.
 */
export interface VerbEntry {
  inf: string;
  /** Compléments avec un sujet humain (vide : seul un chat fait l'action, comme ronronner). */
  compl: readonly string[];
  /** Compléments quand le sujet est un chat (« Le chat dort au soleil ») ; absent : pas de chat. */
  animal?: readonly string[];
}

export const VERBS: readonly VerbEntry[] = [
  // 1er groupe régulier
  {
    inf: 'jouer',
    compl: ['au ballon', 'dans le jardin', 'aux billes', 'à cache-cache', 'dans la cour'],
    animal: ['dans le jardin', 'avec une balle'],
  },
  { inf: 'chanter', compl: ['une chanson', 'très fort', 'dans la chorale'] },
  { inf: 'danser', compl: ['au spectacle', 'dans le salon', 'sur la musique'] },
  {
    inf: 'regarder',
    compl: ['un film', 'les étoiles', 'un dessin animé', 'les nuages'],
    animal: ['les oiseaux', 'par la fenêtre'],
  },
  { inf: 'dessiner', compl: ['un cheval', 'un bateau', 'une maison', 'un dragon'] },
  { inf: 'cuisiner', compl: ['un gâteau', 'des pâtes', 'une soupe'] },
  { inf: 'habiter', compl: ['à Lyon', 'en ville', 'à la campagne', 'près de la mer'] },
  { inf: 'travailler', compl: ['à la maison', 'dans le jardin', 'au bureau'] },
  { inf: 'écouter', compl: ['la maîtresse', 'une histoire', 'de la musique'] },
  { inf: 'arroser', compl: ['les fleurs', 'les plantes', 'le potager'] },
  { inf: 'visiter', compl: ['le château', 'le musée', 'la ferme'] },
  { inf: 'laver', compl: ['la vaisselle', 'la voiture', 'les tableaux'] },
  { inf: 'préparer', compl: ['une surprise', 'le goûter', 'une farce'] },
  { inf: 'chercher', compl: ['un trésor', 'la clé', 'un coquillage'], animal: ['une souris'] },
  { inf: 'trouver', compl: ['un trésor', 'la réponse', 'un coquillage'] },
  { inf: 'ramasser', compl: ['des feuilles', 'des coquillages', 'des châtaignes'] },
  {
    inf: 'sauter',
    compl: ['à la corde', 'dans les flaques', 'très haut'],
    animal: ['sur le lit', 'très haut'],
  },
  {
    inf: 'grimper',
    compl: ["à l'arbre", 'sur le mur', "à l'échelle"],
    animal: ["à l'arbre", 'sur le mur'],
  },
  {
    inf: 'marcher',
    compl: ['dans la forêt', 'sur la plage', 'vers la gare'],
    animal: ['sur le mur', 'dans le jardin'],
  },
  { inf: 'parler', compl: ['à la voisine', 'très doucement', 'au téléphone'] },
  { inf: 'fabriquer', compl: ['un masque', 'une cabane', 'un collier'] },
  { inf: 'décorer', compl: ['la maison', 'le sapin', 'la classe'] },
  { inf: 'coller', compl: ['des gommettes', 'une photo', 'des images'] },
  { inf: 'colorier', compl: ['un dessin', 'une carte', 'un papillon'] },
  { inf: 'réparer', compl: ['le vélo', 'le toit', 'une chaise'] },
  { inf: 'tricoter', compl: ['une écharpe', 'un pull', 'un bonnet'] },
  { inf: 'voyager', compl: ['en train', 'en avion', 'en bateau'] },
  { inf: 'camper', compl: ['dans le jardin', 'au bord du lac', 'à la montagne'] },
  { inf: 'crier', compl: ['très fort', 'dans la cour'] },
  { inf: 'oublier', compl: ['le cahier', 'les clés', 'la leçon'] },
  { inf: 'nager', compl: ['dans la piscine', 'dans la mer', 'très vite'] },
  { inf: 'glisser', compl: ['sur la glace', 'sur le toboggan', 'dans la neige'] },
  { inf: 'brosser', compl: ['le cheval', 'le chien', 'le tapis'] },
  { inf: 'inviter', compl: ['les copains', 'la voisine', 'mamie'] },
  { inf: 'ronronner', compl: [], animal: ['sur le canapé', 'près du feu'] },
  // 1er groupe : variantes d'orthographe
  {
    inf: 'manger',
    compl: ['une pomme', 'des crêpes', 'à la cantine', 'des fruits'],
    animal: ['des croquettes'],
  },
  { inf: 'ranger', compl: ['les jouets', 'les crayons', 'le cartable'] },
  { inf: 'plonger', compl: ['dans la piscine', 'dans la mer', 'du plongeoir'] },
  { inf: 'bouger', compl: ['les bras', 'très vite', 'sans bruit'] },
  { inf: 'partager', compl: ['le gâteau', 'les bonbons', 'le goûter'] },
  { inf: 'lancer', compl: ['la balle', 'le ballon', 'des cailloux'] },
  {
    inf: 'avancer',
    compl: ['doucement', 'vers la porte', 'dans le couloir'],
    animal: ['doucement'],
  },
  { inf: 'commencer', compl: ['un puzzle', 'la leçon', 'un dessin'] },
  { inf: 'effacer', compl: ['le tableau', 'les traits', 'un mot'] },
  { inf: 'lever', compl: ['la main', 'les bras'] },
  { inf: 'acheter', compl: ['du pain', 'des fleurs', 'un cadeau'] },
  { inf: 'promener', compl: ['le chien', 'le bébé'] },
  { inf: 'appeler', compl: ['le chien', 'mamie', 'les pompiers'] },
  { inf: 'jeter', compl: ['les papiers', 'la balle', 'des cailloux'] },
  { inf: 'répéter', compl: ['la poésie', 'la leçon', 'une chanson'] },
  { inf: 'préférer', compl: ['le chocolat', 'les crêpes', 'le basket'] },
  { inf: 'nettoyer', compl: ['le tableau', 'la cage', 'les vitres'] },
  { inf: 'essuyer', compl: ['la table', 'les verres', 'la vaisselle'] },
  // 2e groupe
  { inf: 'finir', compl: ['le puzzle', 'les devoirs', 'le repas'] },
  { inf: 'choisir', compl: ['un livre', 'une glace', 'un jeu'] },
  { inf: 'remplir', compl: ['le seau', 'la bouteille', 'le panier'] },
  { inf: 'applaudir', compl: ['les artistes', 'très fort'] },
  // 3e groupe et irréguliers
  {
    inf: 'être',
    compl: ['à la piscine', 'en vacances', "à l'école", 'au parc'],
    animal: ['dans le jardin', 'sur le canapé'],
  },
  {
    inf: 'avoir',
    compl: ['un chien', 'des vacances', 'un vélo', 'faim'],
    animal: ['faim', 'soif'],
  },
  { inf: 'aller', compl: ['à la piscine', 'au cinéma', "à l'école", 'au parc'] },
  { inf: 'faire', compl: ['un gâteau', 'du vélo', 'un puzzle', 'les courses'] },
  { inf: 'dire', compl: ['un poème', 'bonjour', 'la vérité'] },
  { inf: 'venir', compl: ['chez nous', 'à la fête', "à l'école"], animal: ['près du feu'] },
  { inf: 'prendre', compl: ['le bus', 'le train', 'une photo'] },
  { inf: 'apprendre', compl: ['la leçon', 'une poésie', 'à nager'] },
  { inf: 'voir', compl: ['un arc-en-ciel', 'les étoiles', 'un film'] },
  { inf: 'lire', compl: ['un livre', 'une histoire', 'le journal'] },
  { inf: 'écrire', compl: ['une lettre', 'une carte', 'un poème'] },
  { inf: 'vouloir', compl: ['une glace', 'un chien', 'un vélo'] },
  { inf: 'mettre', compl: ['le manteau', 'la table', 'les bottes'] },
  { inf: 'partir', compl: ['en vacances', 'à la mer', 'très tôt'] },
  {
    inf: 'dormir',
    compl: ['sous la tente', 'très tard', 'dans le lit'],
    animal: ['sur le canapé', 'au soleil'],
  },
  { inf: 'construire', compl: ['une cabane', 'un château de sable', 'un bonhomme de neige'] },
  { inf: 'boire', compl: ['un jus', "de l'eau", 'un chocolat chaud'], animal: ['du lait'] },
  {
    inf: 'courir',
    compl: ['dans la cour', 'très vite', 'dans le parc'],
    animal: ['dans le jardin', 'très vite'],
  },
  { inf: 'attendre', compl: ['le bus', 'les copains', 'le train'] },
  { inf: 'ouvrir', compl: ['la porte', 'la fenêtre', 'un cadeau'] },
];

export function verbsOfKinds(kinds: readonly VerbKind[]): VerbEntry[] {
  return VERBS.filter((v) => kinds.includes(verbKind(v.inf)));
}
