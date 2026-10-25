import type { GradeId } from '@app/core';

export interface Reward {
  id: string;
  name: string;
  icon: string;
  cost: number;
}

/** Une ambiance : un « plugin de données » pour l'habillage de l'app. */
export interface Theme {
  id: string;
  name: string;
  description: string;
  /** Titre affiché sur l'accueil de l'enfant. */
  appTitle: string;
  mascot: string;
  banner: string;
  suggestedGrades: GradeId[];
  /** Pièces pour débloquer le thème (0 = disponible d'emblée). */
  unlockCost: number;
  currency: { singular: string; plural: string; icon: string };
  /** Variables CSS appliquées à la racine (--color-primary…). */
  colors: {
    primary: string;
    primaryDark: string;
    primarySoft: string;
    accent: string;
    accentDark: string;
    background: string;
    surface: string;
    text: string;
    textSoft: string;
  };
  rewards: Reward[];
}
