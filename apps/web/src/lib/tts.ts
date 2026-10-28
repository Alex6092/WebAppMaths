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
/** Prévenu quand la lecture d'une histoire est coupée (pause, autre lecture, écran quitté). */
let onInterrupt: (() => void) | null = null;

export function ttsAvailable(): boolean {
  return typeof window !== 'undefined' && ('speechSynthesis' in window || 'Audio' in window);
}

function serverVoice(lang: string): ServerVoice | null {
  const prefix = lang.slice(0, 2).toLowerCase();
  return prefix === 'fr' || prefix === 'en' ? prefix : null;
}

async function fetchSound(voice: ServerVoice, text: string): Promise<Blob | null> {
  // Pas d'AbortSignal.timeout : Safari ne l'a que depuis la version 16.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SERVER_TIMEOUT_MS);
  try {
    // Chemin relatif : fonctionne sous n'importe quel sous-chemin (BASE_PATH).
    const res = await fetch('api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voice, text }),
      credentials: 'same-origin',
      signal: controller.signal,
    });
    if (res.ok) return await res.blob();
    // 401 : pas encore connecté ; 503 : pas de voix ou trop de monde. On réessaiera plus tard.
    if (res.status === 503) serverDownUntil = Date.now() + SERVER_RETRY_MS;
    return null;
  } catch {
    serverDownUntil = Date.now() + SERVER_RETRY_MS;
    return null;
  } finally {
    clearTimeout(timer);
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

/** La suite d'une histoire lue par la voix du navigateur. */
interface Follow {
  /** La phrase est dite (ou n'en finit pas de l'être) : on passe à la suivante. */
  then: () => void;
  /** La voix du navigateur ne dit rien : l'histoire ne peut pas s'écouter sur cet appareil. */
  silent: () => void;
}

/** Sans début de lecture au bout de ce temps, la voix du navigateur ne marche pas. */
const START_TIMEOUT_MS = 3000;

async function browserSpeak(
  text: string,
  lang: string,
  rate: number,
  id: number,
  follow?: Follow,
): Promise<void> {
  if (!('speechSynthesis' in window)) return follow?.silent();
  await voicesReady();
  if (id !== current) return;
  const voice = pickVoice(lang);
  // Sans voix de cette langue, le navigateur prendrait sa voix par défaut (française) : mieux
  // vaut se taire que d'apprendre un mauvais accent.
  if (!voice && !lang.toLowerCase().startsWith('fr')) return follow?.silent();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.voice = voice;
  utterance.rate = rate;
  if (follow) {
    let started = false;
    let done = false;
    const finish = (step: () => void) => {
      if (done || id !== current) return;
      done = true;
      clearTimeout(startTimer);
      clearTimeout(endTimer);
      step();
    };
    utterance.onstart = () => (started = true);
    utterance.onend = () => finish(follow.then);
    utterance.onerror = () => finish(started ? follow.then : follow.silent);
    const startTimer = setTimeout(() => {
      if (started || done || id !== current) return;
      finish(follow.silent);
      speechSynthesis.cancel();
    }, START_TIMEOUT_MS);
    // Certaines voix oublient de prévenir à la fin d'une longue phrase : on n'attend pas toujours.
    const endTimer = setTimeout(
      () => finish(follow.then),
      START_TIMEOUT_MS + (text.length * 100) / rate,
    );
  }
  speechSynthesis.speak(utterance);
}

/** Découpe un long texte (une leçon) en morceaux de phrases entières. */
export function chunks(text: string): string[] {
  const out: string[] = [];
  let part = '';
  // Coupure après la ponctuation, sans « (?<= » que Safari ne connaît que depuis la 16.4.
  for (const sentence of text.replace(/([.!?:;…])\s+/g, '$1\u0000').split('\u0000')) {
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

/**
 * Un seul lecteur pour toute l'app. Safari (iPad) ne laisse jouer un son que pendant un toucher,
 * or la phrase arrive du serveur après coup : on débloque ce lecteur au premier toucher, en lui
 * faisant jouer un silence, et il peut ensuite jouer chaque phrase.
 */
function player(): HTMLAudioElement {
  audio ??= new Audio();
  return audio;
}

/** Un dixième de seconde de silence (WAV 8 bits, 8 kHz), fabriqué en mémoire. */
function silence(): Blob {
  const samples = 800;
  const view = new DataView(new ArrayBuffer(44 + samples));
  const text = (at: number, s: string) =>
    [...s].forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0)));
  text(0, 'RIFF');
  view.setUint32(4, 36 + samples, true);
  text(8, 'WAVEfmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, 8000, true);
  view.setUint32(28, 8000, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  text(36, 'data');
  view.setUint32(40, samples, true);
  for (let i = 0; i < samples; i++) view.setUint8(44 + i, 128);
  return new Blob([view.buffer], { type: 'audio/wav' });
}

let playerUrl: string | null = null;

function load(sound: HTMLAudioElement, blob: Blob): void {
  if (playerUrl) URL.revokeObjectURL(playerUrl);
  playerUrl = URL.createObjectURL(blob);
  sound.src = playerUrl;
}

let unlocked = false;
const GESTURES = ['pointerup', 'touchend', 'keydown', 'click'] as const;

/** Au premier toucher : le lecteur joue un silence et la voix du navigateur dit « rien ». */
export function unlockAudio(): void {
  if (unlocked) return;
  unlocked = true;
  for (const type of GESTURES) window.removeEventListener(type, unlockAudio, true);
  const sound = player();
  if (sound.paused) {
    load(sound, silence());
    sound.play().catch(() => {});
  }
  if ('speechSynthesis' in window) {
    const nothing = new SpeechSynthesisUtterance('');
    nothing.volume = 0;
    speechSynthesis.speak(nothing);
  }
}

function play(blob: Blob, rate: number, id: number, fallback: () => void, then?: () => void) {
  const sound = player();
  load(sound, blob);
  // La voix du serveur parle à vitesse normale : 0,9 (d'ordinaire) la garde telle quelle.
  // Changer de son remet la vitesse à defaultPlaybackRate : on règle les deux.
  const speed = Math.min(1.3, Math.max(0.6, rate / 0.9));
  sound.defaultPlaybackRate = speed;
  sound.playbackRate = speed;
  sound.onended = () => {
    if (id === current) then?.();
  };
  sound.play().catch((error: unknown) => {
    // AbortError : une phrase plus récente a pris le lecteur. Sinon (Safari a refusé, son
    // illisible), la voix du navigateur lit la phrase : l'enfant n'est jamais sans son.
    if (id === current && (error as Error)?.name !== 'AbortError') fallback();
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
      if (blob) play(blob, rate, id, rest, () => next(i + 1));
      else rest();
    });
  };
  next(0);
}

export interface PartsEvents {
  /** La phrase i commence. */
  onpart?: (i: number) => void;
  /** La dernière phrase est finie. */
  onend?: () => void;
  /** La lecture est coupée avant la fin (pause, autre lecture, écran quitté). */
  oninterrupt?: () => void;
  /** Aucune voix ne marche sur cet appareil : la lecture s'arrête (onend sinon). */
  onsilent?: () => void;
}

/**
 * Lit une histoire phrase par phrase, à partir de la phrase `from` (pour reprendre après une
 * pause). Chaque phrase est demandée au serveur pendant que les deux précédentes se disent :
 * l'histoire ne remplit pas d'un coup la file de la voix du serveur.
 */
export function speakParts(
  parts: readonly string[],
  lang = 'fr-FR',
  rate = 0.9,
  from = 0,
  events: PartsEvents = {},
): void {
  stopSpeaking();
  if (!ttsAvailable() || from >= parts.length) return events.onend?.();
  const id = current;
  onInterrupt = events.oninterrupt ?? null;
  const voice = serverVoice(lang);
  const say = (i: number): void => {
    if (id !== current) return;
    if (i >= parts.length) {
      onInterrupt = null;
      return events.onend?.();
    }
    events.onpart?.(i);
    const next = () => say(i + 1);
    const silent = () => {
      onInterrupt = null;
      (events.onsilent ?? events.onend)?.();
    };
    const browser = () => void browserSpeak(parts[i]!, lang, rate, id, { then: next, silent });
    if (!voice || Date.now() < serverDownUntil) return browser();
    const sound = serverSound(voice, parts[i]!);
    for (const ahead of parts.slice(i + 1, i + 3)) void serverSound(voice, ahead);
    void sound.then((blob) => {
      if (id !== current) return;
      if (blob) play(blob, rate, id, browser, next);
      else browser();
    });
  };
  say(from);
}

export function stopSpeaking(): void {
  current++;
  const interrupted = onInterrupt;
  onInterrupt = null;
  interrupted?.();
  audio?.pause();
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) speechSynthesis.cancel();
}

if (typeof window !== 'undefined') {
  if ('speechSynthesis' in window) speechSynthesis.getVoices();
  for (const type of GESTURES) window.addEventListener(type, unlockAudio, true);
}
