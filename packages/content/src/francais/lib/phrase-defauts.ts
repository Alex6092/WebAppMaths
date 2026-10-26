import type { Rng } from '@app/core';
import { MOMENTS } from './conjugaison';
import { buildSentence, type Sentence } from './phrases';
import { VERBS } from './verbes';

/**
 * Phrases bien écrites… ou pas : les mots dans le désordre, sans majuscule, sans point.
 * Pour la leçon « La phrase » (sens, majuscule, point).
 */
export type Flaw = 'none' | 'order' | 'capital' | 'point';

export const FLAW_REASON: Record<Flaw, string> = {
  none: 'C’est une phrase : elle a un sens, une majuscule et un point.',
  order: 'Les mots sont dans le désordre : la phrase n’a pas de sens.',
  capital: 'Il manque la majuscule au début.',
  point: 'Il manque le point à la fin.',
};

/** Une phrase simple, sans « je » (son apostrophe gênerait le mélange des mots). */
export function simpleSentence(rng: Rng, indicator = false): Sentence {
  return buildSentence(rng, {
    verbs: VERBS,
    moment: rng.pick(MOMENTS),
    indicator: indicator ? 'any' : 'none',
    excludePersons: [0],
  });
}

/** Les mots mélangés, sauf le premier (qui garde sa majuscule) : la phrase n'a plus de sens. */
function shuffledText(rng: Rng, s: Sentence): string {
  const words = s.tokens.filter((_, i) => s.roles[i] !== 'punct').map((t) => t.text);
  const [first, ...rest] = words;
  const verb = s.tokens[s.roles.indexOf('verb')]!.text;
  let mixed = rest;
  for (let i = 0; i < 30; i++) {
    mixed = rng.shuffle(rest);
    // Le verbe doit avoir bougé, sinon la phrase garde souvent un sens.
    if (mixed.join(' ') !== rest.join(' ') && mixed.indexOf(verb) !== rest.indexOf(verb)) break;
  }
  return `${[first, ...mixed].join(' ')}.`;
}

export function flawedText(rng: Rng, flaw: Flaw, indicator = false): string {
  if (flaw === 'order') return shuffledText(rng, simpleSentence(rng, false));
  const s = simpleSentence(rng, indicator);
  if (flaw === 'capital') return s.text[0]!.toLowerCase() + s.text.slice(1);
  if (flaw === 'point') return s.text.replace(/\.$/, '');
  return s.text;
}
