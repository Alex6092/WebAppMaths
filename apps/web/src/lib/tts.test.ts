import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { chunks } from './tts';

describe('morceaux à lire', () => {
  it('garde une phrase courte entière', () => {
    expect(chunks('COCHE le bon jour.')).toEqual(['COCHE le bon jour.']);
  });

  it('coupe une longue leçon entre deux phrases, 300 caractères au plus', () => {
    const lesson = Array.from(
      { length: 12 },
      (_, i) => `Voici la phrase numéro ${i} de la leçon.`,
    ).join(' ');
    const parts = chunks(lesson);
    expect(parts.length).toBeGreaterThan(1);
    expect(parts.every((p) => p.length <= 300 && p.endsWith('.'))).toBe(true);
    expect(parts.join(' ')).toBe(lesson);
  });

  it('coupe entre deux mots une phrase trop longue', () => {
    const long = `${'mot '.repeat(120)}fin.`;
    const parts = chunks(long);
    expect(parts.every((p) => p.length <= 300)).toBe(true);
    expect(parts.join(' ')).toBe(long);
  });
});

/** Un lecteur audio de test : il note ce qu'il joue et peut refuser, comme Safari. */
class FakeAudio {
  static made: FakeAudio[] = [];
  static refuse = false;
  src = '';
  paused = true;
  playbackRate = 1;
  defaultPlaybackRate = 1;
  onended: (() => void) | null = null;
  played: string[] = [];
  constructor() {
    FakeAudio.made.push(this);
  }
  play(): Promise<void> {
    if (FakeAudio.refuse) {
      return Promise.reject(Object.assign(new Error('refusé'), { name: 'NotAllowedError' }));
    }
    this.played.push(this.src);
    this.paused = false;
    return Promise.resolve();
  }
  pause() {
    this.paused = true;
  }
}

describe('lecture sur iPad', () => {
  const listeners = new Map<string, () => void>();
  const said: string[] = [];
  const flush = async () => {
    for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0));
  };

  beforeEach(() => {
    vi.resetModules();
    FakeAudio.made = [];
    FakeAudio.refuse = false;
    listeners.clear();
    said.length = 0;
    const speechSynthesis = {
      getVoices: () => [{ name: 'Amélie', lang: 'fr-FR', localService: true }],
      speak: (u: { text: string }) => said.push(u.text),
      cancel: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
    };
    vi.stubGlobal('speechSynthesis', speechSynthesis);
    vi.stubGlobal('Audio', FakeAudio);
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class {
        lang = '';
        voice = null;
        rate = 1;
        volume = 1;
        constructor(readonly text: string) {}
      },
    );
    vi.stubGlobal('window', {
      speechSynthesis,
      Audio: FakeAudio,
      addEventListener: (type: string, fn: () => void) => listeners.set(type, fn),
      removeEventListener: (type: string) => listeners.delete(type),
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(new Blob(['RIFF'], { type: 'audio/wav' }))),
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  it('débloque un seul lecteur au premier toucher, puis s’en sert pour chaque phrase', async () => {
    const tts = await import('./tts');
    expect([...listeners.keys()]).toContain('pointerup');
    listeners.get('pointerup')!();
    expect(listeners.size).toBe(0);
    expect(FakeAudio.made).toHaveLength(1);
    expect(FakeAudio.made[0]!.played).toHaveLength(1);
    expect(said).toEqual(['']);

    tts.speak('Bonjour', 'fr-FR', 0.9);
    await flush();
    expect(FakeAudio.made).toHaveLength(1);
    expect(FakeAudio.made[0]!.played).toHaveLength(2);
    expect(FakeAudio.made[0]!.playbackRate).toBe(1);
    expect(FakeAudio.made[0]!.defaultPlaybackRate).toBe(1);
  });

  it('lit avec la voix du navigateur quand Safari refuse le son', async () => {
    const tts = await import('./tts');
    FakeAudio.refuse = true;
    tts.speak('Bonjour', 'fr-FR');
    await flush();
    expect(said).toEqual(['Bonjour']);
  });

  it('se tait quand on arrête avant que la phrase arrive', async () => {
    const tts = await import('./tts');
    tts.speak('Bonjour', 'fr-FR');
    tts.stopSpeaking();
    await flush();
    expect(FakeAudio.made.flatMap((a) => a.played)).toHaveLength(0);
    expect(said).toEqual([]);
  });

  describe('une histoire', () => {
    const parts = ['Phrase un.', 'Phrase deux.', 'Phrase trois.', 'Phrase quatre.', 'Fin.'];
    const asked = () =>
      vi.mocked(fetch).mock.calls.map(([, init]) => JSON.parse(String(init!.body)).text as string);
    const finishSound = async () => {
      FakeAudio.made[0]!.onended!();
      await flush();
    };

    it('se lit phrase par phrase, en demandant deux phrases d’avance au serveur', async () => {
      const tts = await import('./tts');
      const heard: number[] = [];
      const onend = vi.fn();
      tts.speakParts(parts, 'fr-FR', 0.9, 0, { onpart: (i) => heard.push(i), onend });
      await flush();
      expect(asked()).toEqual(parts.slice(0, 3));
      for (let i = 0; i < parts.length; i++) await finishSound();
      expect(heard).toEqual([0, 1, 2, 3, 4]);
      expect(FakeAudio.made[0]!.played).toHaveLength(5);
      expect(asked()).toEqual(parts);
      expect(onend).toHaveBeenCalledOnce();
    });

    it('prévient quand on la coupe, et reprend à la phrase donnée', async () => {
      const tts = await import('./tts');
      const heard: number[] = [];
      const oninterrupt = vi.fn();
      tts.speakParts(parts, 'fr-FR', 0.9, 0, { onpart: (i) => heard.push(i), oninterrupt });
      await flush();
      await finishSound();
      tts.speak('Qui aide Lila ?');
      expect(oninterrupt).toHaveBeenCalledOnce();
      await flush();
      tts.speakParts(parts, 'fr-FR', 0.9, 1, { onpart: (i) => heard.push(i) });
      await flush();
      expect(heard).toEqual([0, 1, 1]);
      expect(oninterrupt).toHaveBeenCalledOnce();
    });

    it('continue avec la voix du navigateur quand le serveur ne répond pas', async () => {
      vi.mocked(fetch).mockImplementation(async () => new Response(null, { status: 503 }));
      const tts = await import('./tts');
      const onend = vi.fn();
      const speechSynthesis = globalThis.speechSynthesis as unknown as {
        speak: (u: { text: string; onend?: () => void }) => void;
      };
      speechSynthesis.speak = (u) => {
        said.push(u.text);
        setTimeout(() => u.onend?.(), 0);
      };
      tts.speakParts(parts.slice(0, 2), 'fr-FR', 0.9, 0, { onend });
      await flush();
      await flush();
      expect(said).toEqual(parts.slice(0, 2));
      expect(onend).toHaveBeenCalledOnce();
    });

    it('prévient quand aucune voix ne dit rien, au lieu d’attendre toujours', async () => {
      vi.useFakeTimers();
      try {
        vi.mocked(fetch).mockImplementation(async () => new Response(null, { status: 503 }));
        const tts = await import('./tts');
        const onsilent = vi.fn();
        const onend = vi.fn();
        tts.speakParts(parts, 'fr-FR', 0.9, 0, { onsilent, onend });
        await vi.advanceTimersByTimeAsync(3500);
        expect(onsilent).toHaveBeenCalledOnce();
        expect(onend).not.toHaveBeenCalled();
        expect(said).toEqual([parts[0]]);
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
