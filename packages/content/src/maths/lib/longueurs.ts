export const LENGTH_NOTION = 'maths.mesures.comparer-longueurs';

/** Une longueur entière en centimètres, affichée avec autant de mètres entiers que possible. */
export function metresAndCm(cm: number): string {
  const metres = Math.floor(cm / 100);
  const rest = cm % 100;
  if (metres === 0) return `${cm} cm`;
  return rest === 0 ? `${metres} m` : `${metres} m ${rest} cm`;
}

export function conversion(cm: number): string {
  const rest = cm % 100;
  if (cm < 100) return `${cm} cm`;
  const addition = rest === 0 ? '' : `${cm - rest} cm + ${rest} cm = `;
  return `${metresAndCm(cm)} = ${addition}${cm} cm`;
}

export function speakLength(length: string): string {
  return length.replace(/ m\b/g, ' mètres').replace(/ cm\b/g, ' centimètres');
}
