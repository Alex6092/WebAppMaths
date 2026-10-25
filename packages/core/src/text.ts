/**
 * Comparaison de mots tapés par l'enfant : espaces et apostrophes normalisés,
 * majuscules ignorées (sauf demande), accents toujours comptés mais signalés à part.
 */

export function normalizeText(raw: string, caseSensitive = false): string {
  const text = raw
    .normalize('NFC')
    .replace(/[’ʼ‘`]/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/\s*'\s*/g, "'")
    .trim();
  return caseSensitive ? text : text.toLocaleLowerCase('fr');
}

export function stripAccents(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').normalize('NFC');
}

/** ok, accent (juste à un accent près), wrong ou missing (rien de tapé). */
export type TextMatch = 'ok' | 'accent' | 'wrong' | 'missing';

export function matchText(
  accepted: readonly string[],
  given: string,
  caseSensitive = false,
): TextMatch {
  const value = normalizeText(given, caseSensitive);
  if (value === '') return 'missing';
  const candidates = accepted.map((a) => normalizeText(a, caseSensitive));
  if (candidates.includes(value)) return 'ok';
  const bare = stripAccents(value);
  if (candidates.some((c) => stripAccents(c) === bare)) return 'accent';
  return 'wrong';
}
