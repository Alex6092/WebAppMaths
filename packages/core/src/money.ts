/** Les pièces et les billets en euros. Une somme se compte en centimes : 350 pour 3 € 50 c. */

export const CENT_COINS = [1, 2, 5, 10, 20, 50] as const;
export const EURO_COINS = [100, 200] as const;
export const BILLS = [500, 1000, 2000, 5000] as const;
/** Toutes les valeurs, de la plus grande à la plus petite. */
export const DENOMINATIONS: readonly number[] = [...BILLS, ...EURO_COINS, ...CENT_COINS].sort(
  (a, b) => b - a,
);

export const isBill = (value: number) => value >= 500;

/** Ce qui est écrit sur une pièce ou un billet : « 2 € », « 50 c ». */
export function denominationLabel(value: number): string {
  return value >= 100 ? `${value / 100} €` : `${value} c`;
}

/** Une somme, sans virgule : « 17 € », « 3 € 50 c », « 80 c ». */
export function moneyText(cents: number): string {
  const euros = Math.floor(cents / 100);
  const rest = cents % 100;
  if (rest === 0) return `${euros} €`;
  return euros === 0 ? `${rest} c` : `${euros} € ${rest} c`;
}

/** La même somme, pour la lecture à voix haute : « 3 euros et 50 centimes ». */
export function moneySpeech(cents: number): string {
  const euros = Math.floor(cents / 100);
  const rest = cents % 100;
  const e = `${euros} euro${euros > 1 ? 's' : ''}`;
  const c = `${rest} centime${rest > 1 ? 's' : ''}`;
  if (rest === 0) return e;
  return euros === 0 ? c : `${e} et ${c}`;
}

export const moneyTotal = (values: readonly number[]) => values.reduce((sum, v) => sum + v, 0);

/**
 * Le moins de pièces et de billets possible pour faire une somme, parmi les valeurs permises
 * (en prenant toujours la plus grande qui rentre : c'est le plus court avec les euros).
 */
export function fewestCoins(cents: number, allowed: readonly number[] = DENOMINATIONS): number[] {
  const values = [...allowed].sort((a, b) => b - a);
  const coins: number[] = [];
  let rest = cents;
  for (const value of values) {
    while (rest >= value) {
      coins.push(value);
      rest -= value;
    }
  }
  if (rest !== 0) throw new Error(`${cents} c ne se fait pas avec ${allowed.join(', ')}`);
  return coins;
}
