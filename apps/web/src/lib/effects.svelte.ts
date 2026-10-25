/** Petits effets partagés : message éphémère (toast) et confettis. */
export const effects = $state({
  toast: null as string | null,
  confettiBurst: 0,
});

let toastTimer: ReturnType<typeof setTimeout> | undefined;

export function toast(message: string, durationMs = 2800): void {
  effects.toast = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (effects.toast = null), durationMs);
}

export function confetti(): void {
  effects.confettiBurst++;
}

const PRAISE = [
  'Bravo !',
  'Super !',
  'Génial !',
  'Excellent !',
  'Bien joué !',
  'Parfait !',
  'Formidable !',
];

export function praise(): string {
  return PRAISE[Math.floor(Math.random() * PRAISE.length)]!;
}
