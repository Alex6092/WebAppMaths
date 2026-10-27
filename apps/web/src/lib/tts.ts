/**
 * Lecture à voix haute avec la synthèse vocale du navigateur.
 * La qualité dépend de l'appareil : on choisit la voix la plus naturelle disponible.
 */
const PREFERRED = /natural|neural|online|google|premium|enhanced|amélie|thomas|denise|hortense/i;

export function ttsAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

function pickVoice(lang: string): SpeechSynthesisVoice | null {
  const prefix = lang.slice(0, 2).toLowerCase();
  const all = speechSynthesis.getVoices();
  // L'accent demandé d'abord (en-GB), sinon la même langue (en-US).
  const exact = all.filter((v) => v.lang.replace('_', '-').toLowerCase() === lang.toLowerCase());
  const voices = exact.length ? exact : all.filter((v) => v.lang.toLowerCase().startsWith(prefix));
  return (
    voices.find((v) => PREFERRED.test(v.name)) ??
    voices.find((v) => v.localService) ??
    voices[0] ??
    null
  );
}

/** rate : la vitesse (0,9 d'ordinaire ; plus lent pour une dictée). */
export function speak(text: string, lang = 'fr-FR', rate = 0.9): void {
  if (!ttsAvailable() || !text) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.voice = pickVoice(lang);
  utterance.rate = rate;
  speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (ttsAvailable()) speechSynthesis.cancel();
}

// Certains navigateurs chargent la liste des voix en différé.
if (ttsAvailable()) speechSynthesis.getVoices();
