/**
 * Nombres en lettres, de 0 à 1000, en orthographe traditionnelle (celle de la classe) :
 * traits d'union sous cent seulement, « et » sans trait d'union (vingt et un),
 * « cents » et « quatre-vingts » au pluriel seulement en fin de nombre.
 */

const UNITS = [
  'zéro',
  'un',
  'deux',
  'trois',
  'quatre',
  'cinq',
  'six',
  'sept',
  'huit',
  'neuf',
  'dix',
  'onze',
  'douze',
  'treize',
  'quatorze',
  'quinze',
  'seize',
];
const TENS: Record<number, string> = {
  2: 'vingt',
  3: 'trente',
  4: 'quarante',
  5: 'cinquante',
  6: 'soixante',
};

function below100(n: number): string {
  if (n < 17) return UNITS[n]!;
  if (n < 20) return `dix-${UNITS[n - 10]}`;
  if (n < 70) {
    const tens = TENS[Math.floor(n / 10)]!;
    const units = n % 10;
    if (units === 0) return tens;
    return units === 1 ? `${tens} et un` : `${tens}-${UNITS[units]}`;
  }
  if (n < 80) return n === 71 ? 'soixante et onze' : `soixante-${below100(n - 60)}`;
  if (n === 80) return 'quatre-vingts';
  return `quatre-vingt-${below100(n - 80)}`;
}

/** 347 → « trois cent quarante-sept ». */
export function numberToWords(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 1000) throw new Error(`hors limites : ${n}`);
  if (n === 1000) return 'mille';
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  if (hundreds === 0) return below100(rest);
  const head = hundreds === 1 ? 'cent' : `${UNITS[hundreds]} cent`;
  if (rest === 0) return hundreds > 1 ? `${head}s` : head;
  return `${head} ${below100(rest)}`;
}

/** Les mots sans traits d'union ni espaces en trop : pour repérer une erreur de traits d'union. */
export const withoutHyphens = (text: string): string =>
  text.replace(/[-‐]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();

/** Les mots sans le s du pluriel de cent et vingt : pour repérer cette erreur-là. */
export const withoutPlural = (text: string): string =>
  withoutHyphens(text).replace(/\b(cent|vingt)s\b/g, '$1');
