import { storyParagraphs, typography, type Story } from '../../../francais/lib/histoires';
import { benTeddy, dotDuck, ellaElephant, grandmaGarden, leoRobot, rainySaturday } from './ce2';
import { birthday, farm, littleCat, monkey, picnic, tomDog } from './ce1';

/**
 * Les petites histoires en anglais : écrites avec les mots des thèmes de vocabulaire (couleurs,
 * nombres, animaux, famille, jours, politesse), dites par la voix anglaise. Les questions sont en
 * français, les réponses en images ; après la correction, l'enfant voit le texte anglais, avec
 * les phrases-réponses surlignées, et sa traduction.
 */

export type EnglishLevel = 1 | 2;

export interface EnglishStory extends Omit<Story, 'level' | 'events'> {
  /** 1 : CE1, des histoires très courtes ; 2 : CE2, un peu plus longues. */
  level: EnglishLevel;
  /** L'histoire en français, paragraphe par paragraphe. */
  translation: string[];
}

/** Ce que chaque niveau demande à ses histoires (vérifié par histoires.test.ts). */
export const ENGLISH_RULES: Record<
  EnglishLevel,
  { minChars: number; maxChars: number; questions: number; why: boolean; pictures: boolean }
> = {
  1: { minChars: 150, maxChars: 450, questions: 3, why: false, pictures: true },
  2: { minChars: 350, maxChars: 750, questions: 4, why: false, pictures: true },
};

export const ENGLISH_STORIES: EnglishStory[] = [
  // Niveau 1 : CE1.
  tomDog,
  littleCat,
  birthday,
  farm,
  monkey,
  picnic,
  // Niveau 2 : CE2.
  benTeddy,
  dotDuck,
  rainySaturday,
  grandmaGarden,
  leoRobot,
  ellaElephant,
];

/** Les phrases des histoires anglaises telles que l'app les fait dire, à préparer d'avance. */
export function englishSpeechTexts(): string[] {
  return ENGLISH_STORIES.flatMap((story) => storyParagraphs(story).flat().map(typography));
}
