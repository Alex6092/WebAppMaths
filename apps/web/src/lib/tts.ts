/**
 * Lecture à voix haute. D'abord la voix du serveur (Piper) : la même, de bonne qualité, sur tous
 * les appareils. Sinon (pas connecté, serveur occupé ou sans voix, hors ligne), la synthèse du
 * navigateur avec une voix de la bonne langue : jamais un mot anglais lu par une voix française.
 */
const PREFERRED = /natural|neural|online|google|premium|enhanced|amélie|thomas|denise|hortense/i;

/** Au-delà, la voix du navigateur prend le relais plutôt que de faire attendre l'enfant. */
const SERVER_TIMEOUT_MS = 4000;
/** Après un échec, on laisse le serveur tranquille un moment. */
const SERVER_RETRY_MS = 60_000;
const MAX_SOUNDS = 100;
/** Le serveur lit 400 caractères au plus : une leçon se lit en plusieurs morceaux. */
const CHUNK = 300;

type ServerVoice = 'fr' | 'en';

/** Les sons déjà reçus du serveur, par voix et texte (les plus anciens partent les premiers). */
const sounds = new Map<string, Promise<Blob | null>>();
let serverDownUntil = 0;
let audio: HTMLAudioElement | null = null;
/** Le numéro de la lecture en cours : une lecture plus récente fait taire les précédentes. */
let current = 0;

export function ttsAvailable(): boolean {
  return typeof window !== 'undefined' && ('speechSynthesis' in window || 'Audio' in window);
}

function serverVoice(lang: string): ServerVoice | null {
  const prefix = lang.slice(0, 2).toLowerCase();
  return prefix === 'fr' || prefix === 'en' ? prefix : null;
}

async function fetchSound(voice: ServerVoice, text: string): Promise<Blob | null> {
  try {
    // Chemin relatif : fonctionne sous n'importe quel sous-chemin (BASE_PATH).
    const res = await fetch('api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voice, text }),
      credentials: 'same-origin',
      signal: AbortSignal.timeout(SERVER_TIMEOUT_MS),
    });
    if (res.ok) return await res.blob();
    // 401 : pas encore connecté ; 503 : pas de voix ou trop de monde. On réessaiera plus tard.
    if (res.status === 503) serverDownUntil = Date.now() + SERVER_RETRY_MS;
    return null;
  } catch {
    serverDownUntil = Date.now() + SERVER_RETRY_MS;
    return null;
  }
}

function serverSound(voice: ServerVoice, text: string): Promise<Blob | null> {
  const key = `${voice}\n${text}`;
  const known = sounds.get(key);
  if (known) return known;
  const sound = fetchSound(voice, text).then((blob) => {
    if (!blob) sounds.delete(key);
    return blob;
  });
  sounds.set(key, sound);
  if (sounds.size > MAX_SOUNDS) sounds.delete(sounds.keys().next().value!);
  return sound;
}

/** Prépare le son d'un texte qu'on lira peut-être (la consigne) : le bouton 🔊 répond aussitôt. */
export function prepareSpeech(text: string, lang = 'fr-FR'): void {
  const voice = serverVoice(lang);
  if (!text || !voice || Date.now() < serverDownUntil) return;
  for (const part of chunks(text)) void serverSound(voice, part);
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

/** Certains navigateurs chargent la liste des voix en différé : on l'attend un peu. */
function voicesReady(): Promise<void> {
  if (speechSynthesis.getVoices().length) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      speechSynthesis.removeEventListener('voiceschanged', done);
      resolve();
    };
    speechSynthesis.addEventListener('voiceschanged', done);
    setTimeout(done, 1500);
  });
}

async function browserSpeak(text: string, lang: string, rate: number, id: number): Promise<void> {
  if (!('speechSynthesis' in window)) return;
  await voicesReady();
  if (id !== current) return;
  const voice = pickVoice(lang);
  // Sans voix de cette langue, le navigateur prendrait sa voix par défaut (française) : mieux
  // vaut se taire que d'apprendre un mauvais accent.
  if (!voice && !lang.toLowerCase().startsWith('fr')) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.voice = voice;
  utterance.rate = rate;
  speechSynthesis.speak(utterance);
}

/** Découpe un long texte (une leçon) en morceaux de phrases entières. */
export function chunks(text: string): string[] {
  const out: string[] = [];
  let part = '';
  for (const sentence of text.split(/(?<=[.!?:;…])\s+/)) {
    // Une phrase trop longue à elle seule est coupée entre deux mots.
    const pieces =
      sentence.length > CHUNK ? (sentence.match(/.{1,300}(\s|$)/g) ?? [sentence]) : [sentence];
    for (const piece of pieces) {
      if (part && part.length + piece.length + 1 > CHUNK) {
        out.push(part.trim());
        part = '';
      }
      part += `${piece} `;
    }
  }
  if (part.trim()) out.push(part.trim());
  return out;
}

function play(blob: Blob, rate: number, fallback: () => void, then?: () => void): void {
  const url = URL.createObjectURL(blob);
  const sound = new Audio(url);
  // La voix du serveur parle à vitesse normale : 0,9 (d'ordinaire) la garde telle quelle.
  sound.playbackRate = Math.min(1.3, Math.max(0.6, rate / 0.9));
  sound.onended = () => {
    URL.revokeObjectURL(url);
    if (audio === sound) then?.();
  };
  audio = sound;
  sound.play().catch(() => {
    URL.revokeObjectURL(url);
    if (audio === sound) fallback();
  });
}

/** rate : la vitesse (0,9 d'ordinaire ; plus lent pour une dictée). */
export function speak(text: string, lang = 'fr-FR', rate = 0.9): void {
  if (!ttsAvailable() || !text) return;
  stopSpeaking();
  const id = current;
  const fallback = () => void browserSpeak(text, lang, rate, id);
  const voice = serverVoice(lang);
  if (!voice || Date.now() < serverDownUntil) return fallback();
  // Tous les morceaux sont demandés d'un coup, puis joués l'un après l'autre.
  const parts = chunks(text);
  const sounds = parts.map((part) => serverSound(voice, part));
  const next = (i: number): void => {
    if (i >= parts.length) return;
    void sounds[i]!.then((blob) => {
      if (id !== current) return;
      const rest = () => void browserSpeak(parts.slice(i).join(' '), lang, rate, id);
      if (blob) play(blob, rate, rest, () => next(i + 1));
      else rest();
    });
  };
  next(0);
}

export function stopSpeaking(): void {
  current++;
  audio?.pause();
  audio = null;
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) speechSynthesis.cancel();
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) speechSynthesis.getVoices();
