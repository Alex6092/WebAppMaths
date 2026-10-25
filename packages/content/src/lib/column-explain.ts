import { columnLayout, type ColumnOpAnswer, type ColumnOpQuestion } from '@app/core';
import { digitAt, PLACE_NAMES } from './numbers';

/** Explique, en partant de la droite, la première colonne où la réponse est fausse. */
export function explainColumn(q: ColumnOpQuestion, answer: ColumnOpAnswer): string | undefined {
  const { cols, expected, carries } = columnLayout(q);
  for (let i = cols - 1; i >= 0; i--) {
    const want = expected[i];
    if (want === null || answer.digits[i] === String(want)) continue;
    const place = cols - 1 - i;
    const where = `Colonne des ${PLACE_NAMES[place] ?? 'chiffres'}`;
    const carry = carries[i] ?? 0;

    if (q.op === '+') {
      const digits = q.operands.filter((n) => n >= 10 ** place).map((n) => digitAt(n, place));
      const parts = [...digits.map(String), ...(carry ? [`${carry} de retenue`] : [])];
      const sum = digits.reduce((s, d) => s + d, 0) + carry;
      const writeCarry = sum >= 10 && expected[i - 1] !== null;
      return writeCarry
        ? `${where} : ${parts.join(' + ')} = ${sum}. J’écris ${sum % 10} et je retiens ${Math.floor(sum / 10)}.`
        : `${where} : ${parts.join(' + ')} = ${sum}.`;
    }

    const top = digitAt(q.operands[0] ?? 0, place);
    const bottom = digitAt(q.operands[1] ?? 0, place);
    const taken = bottom + carry;
    const bottomText = carry ? `(${bottom} + 1 de retenue)` : `${bottom}`;
    if (top < taken) {
      return (
        `${where} : ${top} − ${bottomText}, c’est impossible. J’ajoute 10 en haut : ` +
        `${top + 10} − ${taken} = ${top + 10 - taken}, et je mets une retenue en bas dans la colonne suivante.`
      );
    }
    return `${where} : ${top} − ${bottomText} = ${top - taken}.`;
  }
  return undefined;
}
