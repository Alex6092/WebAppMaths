import type { McqChoice } from '@app/core';
import { blancheNeige } from './blanche-neige';
import { boucleDor } from './boucle-d-or';
import { cerfVolant } from './cerf-volant';
import { robePapillons } from './robe-papillons';

/**
 * Les histoires à écouter (« Langage oral ») : des contes du domaine public racontés à notre
 * façon, et des histoires inventées pour le Cartable. Une histoire par fichier.
 *
 * Dans les textes, on écrit l’apostrophe ’ et des espaces ordinaires avant ? ! : ; » : ils
 * deviennent insécables à l’affichage.
 */

/** Une question sur l'histoire. */
export type StoryQuestion =
  | {
      ask: string;
      /** La bonne réponse ; un emoji devant (« 🐻 trois ours ») devient l'image du choix. */
      answer: string;
      /** Les mauvaises réponses (deux). */
      wrong: string[];
      /** Un morceau de la phrase qui donne la réponse : on ne le trouve que dans une phrase. */
      proof: string;
      /** Un « pourquoi ? » ou un sentiment : la réponse se déduit, l'histoire ne la dit pas telle quelle. */
      why?: boolean;
    }
  | {
      /** Une phrase à juger : vrai ou faux ? */
      claim: string;
      truth: boolean;
      proof: string;
    };

export type StoryLevel = 1 | 2 | 3 | 4;

export interface Story {
  id: string;
  title: string;
  icon: string;
  /** Le niveau de l'exercice où elle se raconte. */
  level: StoryLevel;
  /** D'où vient l'histoire : un conte (et ses auteurs), ou une histoire inventée. */
  source: string;
  /** Les paragraphes. */
  text: string[];
  questions: StoryQuestion[];
}

/** Ce que chaque niveau demande à ses histoires (vérifié par histoires.test.ts). */
export const LEVEL_RULES: Record<
  StoryLevel,
  { minChars: number; maxChars: number; questions: number; why: boolean; pictures: boolean }
> = {
  // CP : une histoire courte, des questions dont les réponses sont des images.
  1: { minChars: 300, maxChars: 750, questions: 3, why: false, pictures: true },
  2: { minChars: 700, maxChars: 1400, questions: 4, why: false, pictures: false },
  // CE1 : au moins une question « pourquoi ? ».
  3: { minChars: 1000, maxChars: 1800, questions: 4, why: true, pictures: false },
  // CE2 : des contes plus longs, l'ordre des événements, le sens d'un mot.
  4: { minChars: 1500, maxChars: 2600, questions: 5, why: true, pictures: false },
};

/** Une phrase dite d'un coup par la voix du serveur (qui lit 300 caractères au plus d'un trait). */
export const MAX_SENTENCE = 300;

export const STORIES: Story[] = [cerfVolant, boucleDor, robePapillons, blancheNeige];

/**
 * Coupe un paragraphe en phrases : après . ! ? … (et le » qui suit), devant une majuscule ou
 * un «. « Quelqu’un a mangé ma soupe ! » pleure le bébé ours : une seule phrase.
 */
export function splitSentences(paragraph: string): string[] {
  return paragraph
    .replace(/([.!?…](?: »)?) +(?=[\p{Lu}«])/gu, '$1\u0000')
    .split('\u0000')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Les espaces avant ? ! : ; » et après « deviennent insécables : « ? » ne part pas seul à la ligne. */
export function typography(text: string): string {
  return text.replace(/ ([?!:;»])/g, ' $1').replace(/« /g, '« ');
}

/** Les paragraphes de l'histoire, chacun découpé en phrases. */
export function storyParagraphs(story: Story): string[][] {
  return story.text.map((p) => splitSentences(p));
}

/** Les rangs des phrases (comptées à la suite) où se trouve le morceau `proof`. */
export function proofSentences(story: Story, proof: string): number[] {
  return storyParagraphs(story)
    .flat()
    .flatMap((sentence, i) => (sentence.includes(proof) ? [i] : []));
}

const LEADING_EMOJI = /^(\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*️?) +/u;

/** « 🐻 trois ours » : le choix « trois ours », avec l'ours pour image. */
export function storyChoice(text: string, id: string): McqChoice {
  const match = LEADING_EMOJI.exec(text);
  const label = typography(match ? text.slice(match[0].length) : text);
  return match ? { id, label, icon: match[1]! } : { id, label };
}

export const isWhy = (q: StoryQuestion) => 'why' in q && q.why === true;

/** Les phrases des histoires telles que l'app les fait dire : le serveur les prépare à l'avance. */
export function storySpeechTexts(): string[] {
  return STORIES.flatMap((story) => storyParagraphs(story).flat().map(typography));
}
