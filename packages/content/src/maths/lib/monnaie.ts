import { fewestCoins, moneySpeech, moneyText, moneyTotal, type Rng } from '@app/core';
import { retry } from '../../lib/numbers';

/** Les niveaux de la monnaie : en euros jusqu'à 20, 50 ou 100 €, puis avec les centimes. */
export interface MoneyParams {
  /** Somme la plus grande, en euros. */
  max: number;
  /** Pièces et billets permis, en centimes. */
  values: readonly number[];
  cents: boolean;
}

export const MONEY_LEVELS = [
  {
    label: 'Jusqu’à 20 €',
    grade: 'CE1',
    params: { max: 20, values: [100, 200, 500, 1000], cents: false },
  },
  {
    label: 'Jusqu’à 50 €',
    grade: 'CE1',
    params: { max: 50, values: [100, 200, 500, 1000, 2000], cents: false },
  },
  {
    label: 'Jusqu’à 100 €',
    grade: 'CE1',
    params: { max: 100, values: [100, 200, 500, 1000, 2000, 5000], cents: false },
  },
  {
    label: 'Euros et centimes',
    grade: 'CE2',
    params: { max: 20, values: [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000], cents: true },
  },
] as const satisfies readonly { label: string; grade: string; params: MoneyParams }[];

/** Du plus grand au plus petit : les billets d'abord, comme on compte. */
export const largestFirst = (values: readonly number[]) => [...values].sort((a, b) => b - a);

/**
 * Des pièces et des billets à compter : count valeurs tirées parmi celles du niveau, pour une
 * somme d'au plus max euros. Avec les centimes, il y a des euros et des centimes, moins de 1 € en
 * centimes (on ne fait pas encore les échanges 100 c = 1 €).
 */
export function randomPurse(rng: Rng, params: MoneyParams, count: number): number[] {
  const euros = params.values.filter((v) => v >= 100);
  const cents = params.values.filter((v) => v < 100);
  return retry(
    () => {
      if (!params.cents) return Array.from({ length: count }, () => rng.pick(euros));
      const nCents = rng.int(2, Math.max(2, count - 2));
      return [
        ...Array.from({ length: count - nCents }, () => rng.pick(euros)),
        ...Array.from({ length: nCents }, () => rng.pick(cents)),
      ];
    },
    (purse) => {
      const total = moneyTotal(purse);
      const rest = moneyTotal(purse.filter((v) => v < 100));
      return (
        total <= params.max * 100 &&
        total >= Math.min(params.max, 20) * 30 &&
        // Au moins deux sortes de pièces ou de billets, et jamais plus de 4 fois la même.
        new Set(purse).size >= 2 &&
        purse.every((v) => purse.filter((w) => w === v).length <= 4) &&
        (!params.cents || (rest > 0 && rest < 100))
      );
    },
  );
}

/** Une somme à payer avec les valeurs du niveau (en centimes). */
export function randomPrice(rng: Rng, params: MoneyParams): number {
  const low = params.max === 20 ? 3 : params.max === 50 ? 12 : 25;
  const euros = rng.int(low, params.max - 1);
  if (!params.cents) return euros * 100;
  return rng.int(1, 9) * 100 + rng.int(1, 19) * 5;
}

/**
 * Une façon de payer price : le moins de pièces possible, ou parfois un billet remplacé par de la
 * monnaie (deux billets de 5 € pour 10 €), toujours avec les valeurs permises.
 */
export function payment(rng: Rng, price: number, values: readonly number[]): number[] {
  const coins = fewestCoins(price, values);
  if (rng.chance(0.5)) return coins;
  const i = coins.findIndex((v) => v > Math.min(...values));
  if (i < 0) return coins;
  const smaller = values.filter((v) => v < coins[i]!);
  return largestFirst([
    ...coins.slice(0, i),
    ...coins.slice(i + 1),
    ...fewestCoins(coins[i]!, smaller),
  ]);
}

/**
 * Le porte-monnaie : de quoi payer, plus quelques pièces et billets en trop, rangés du plus grand
 * au plus petit (more : d'autres pièces à y mettre). Renvoie aussi les numéros de pay dans le
 * porte-monnaie.
 */
export function purseFor(
  rng: Rng,
  price: number,
  params: MoneyParams,
  pay: readonly number[],
  more: readonly number[] = [],
): { purse: number[]; picked: number[] } {
  const extra = Array.from({ length: rng.int(2, 4) - Math.min(2, more.length) }, () =>
    rng.pick(params.values.filter((v) => v <= price)),
  );
  const purse = largestFirst([...pay, ...more, ...extra]);
  const picked: number[] = [];
  for (const value of pay) {
    const i = purse.findIndex((v, j) => v === value && !picked.includes(j));
    picked.push(i);
  }
  return { purse, picked: picked.sort((a, b) => a - b) };
}

/** Ce qu'on achète, avec un prix plausible (en euros) : petits achats, jouets, gros achats. */
export interface Item {
  name: string;
  icon: string;
  /** Prix le plus bas et le plus haut, en euros. */
  min: number;
  max: number;
}

export const ITEMS: readonly Item[] = [
  { name: 'un croissant', icon: '🥐', min: 1, max: 2 },
  { name: 'une baguette', icon: '🥖', min: 1, max: 2 },
  { name: 'une pomme', icon: '🍎', min: 1, max: 2 },
  { name: 'un jus de fruits', icon: '🧃', min: 1, max: 3 },
  { name: 'une glace', icon: '🍦', min: 2, max: 6 },
  { name: 'un cahier', icon: '📒', min: 1, max: 5 },
  { name: 'des crayons de couleur', icon: '🖍️', min: 3, max: 12 },
  { name: 'un livre', icon: '📕', min: 5, max: 19 },
  { name: 'une balle', icon: '🎾', min: 3, max: 9 },
  { name: 'un ballon', icon: '⚽', min: 8, max: 25 },
  { name: 'une peluche', icon: '🧸', min: 9, max: 30 },
  { name: 'un jeu de société', icon: '🎲', min: 12, max: 45 },
  { name: 'une boîte de peinture', icon: '🎨', min: 6, max: 20 },
  { name: 'un cerf-volant', icon: '🪁', min: 8, max: 30 },
  { name: 'un sac à dos', icon: '🎒', min: 15, max: 49 },
  { name: 'une guitare', icon: '🎸', min: 40, max: 99 },
  { name: 'des rollers', icon: '🛼', min: 30, max: 89 },
  { name: 'un vélo', icon: '🚲', min: 60, max: 99 },
  { name: 'une trottinette', icon: '🛴', min: 35, max: 99 },
];

/** « Le livre coûte 7 € », « Des rollers coûtent 45 € ». */
export function priceSentence(item: Item, price: number, speech = false): string {
  const name = item.name.charAt(0).toUpperCase() + item.name.slice(1);
  const verb = item.name.startsWith('des ') ? 'coûtent' : 'coûte';
  return `${name} ${verb} ${speech ? moneySpeech(price) : moneyText(price)}.`;
}

/** Un objet dont le prix plausible contient price (en centimes). */
export function itemFor(rng: Rng, price: number): Item {
  const euros = price / 100;
  const fitting = ITEMS.filter((item) => euros >= item.min && euros <= item.max + 0.99);
  return rng.pick(fitting.length ? fitting : ITEMS);
}
