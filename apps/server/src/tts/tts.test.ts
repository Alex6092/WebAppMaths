import { mkdirSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../app';
import { loadConfig } from '../config';
import { openDb } from '../db/client';
import { ensureAdminInvitation } from '../services/invitations';
import { TtsCache } from './cache';
import { TtsBusyError } from './pool';
import { createTts, speechText, VOICES, type TtsService } from './service';
import { warmSpeech } from './warm';

const FAKE = fileURLToPath(new URL('./fake-piper.mjs', import.meta.url));

let dir = '';
let service: TtsService | null = null;

/** Un dossier de voix (faux Piper, faux modèles) et le service qui va avec. */
function setup(workers = 2, queueMax = 50): TtsService {
  dir = mkdtempSync(join(tmpdir(), 'tts-'));
  mkdirSync(join(dir, 'voices'));
  for (const name of Object.values(VOICES)) writeFileSync(join(dir, 'voices', `${name}.onnx`), '');
  process.env.FAKE_PIPER_LOG = join(dir, 'log.txt');
  writeFileSync(process.env.FAKE_PIPER_LOG, '');
  const config = {
    ...loadConfig({}),
    dataDir: join(dir, 'data'),
    ttsDir: dir,
    ttsWorkers: workers,
  };
  service = createTts(config, undefined, {
    command: process.execPath,
    commandArgs: [FAKE],
    queueMax,
  });
  return service!;
}

const made = () => readFileSync(process.env.FAKE_PIPER_LOG!, 'utf8').split('\n').filter(Boolean);

afterEach(() => {
  service?.close();
  service = null;
  if (dir) rmSync(dir, { recursive: true, force: true });
});

describe('texte à dire', () => {
  it('enlève les emoji et met les consignes en minuscules', () => {
    expect(speechText('🌈 Pour regarder un arc-en-ciel, j’utilise…')).toBe(
      'Pour regarder un arc-en-ciel, j’utilise…',
    );
    expect(speechText('COCHE le bon jour.  ÉCOUTE et ÉCRIS.')).toBe(
      'coche le bon jour. écoute et écris.',
    );
    // Les noms de points restent en majuscules.
    expect(speechText('Trace le segment [AB] avec le point M.')).toBe(
      'Trace le segment [AB] avec le point M.',
    );
  });
});

describe('service de voix', () => {
  it('n’existe pas sans Piper ni ses voix', () => {
    const empty = mkdtempSync(join(tmpdir(), 'tts-vide-'));
    expect(createTts({ ...loadConfig({}), ttsDir: empty })).toBeNull();
    rmSync(empty, { recursive: true });
  });

  it('fabrique une phrase avec la voix de sa langue, puis la sert depuis le cache', async () => {
    const tts = setup();
    const fr = await tts.speak('fr', 'COCHE le bon jour.');
    expect(fr.toString()).toBe(`RIFF${VOICES.fr}.onnx:coche le bon jour.`);
    expect((await tts.speak('en', 'red')).toString()).toBe(`RIFF${VOICES.en}.onnx:red`);
    expect(await tts.speak('fr', 'COCHE le bon jour.')).toEqual(fr);
    expect(made()).toHaveLength(2);
  });

  it('ne fabrique qu’une fois une phrase demandée deux fois en même temps', async () => {
    const tts = setup();
    const [a, b] = await Promise.all([
      tts.speak('fr', 'LENT bonjour'),
      tts.speak('fr', 'LENT bonjour'),
    ]);
    expect(a).toEqual(b);
    expect(made()).toHaveLength(1);
  });

  it('fait attendre au-delà des workers, et refuse quand la file est pleine', async () => {
    const tts = setup(1, 1);
    const first = tts.speak('fr', 'LENT un');
    const second = tts.speak('fr', 'LENT deux');
    // Chaque phrase passe d'abord par le cache (le disque) : on attend qu'elles soient en file.
    await vi.waitFor(() => expect(tts.load).toEqual({ running: 1, waiting: 1 }));
    await expect(tts.speak('fr', 'LENT trois')).rejects.toBeInstanceOf(TtsBusyError);
    await Promise.all([first, second]);
    expect(made()).toHaveLength(2);
  });

  it('relance Piper quand il s’arrête', async () => {
    const tts = setup(1);
    await expect(tts.speak('fr', 'PLANTE')).rejects.toThrow(/arrêté/);
    expect((await tts.speak('fr', 'Encore là ?')).toString()).toContain('Encore là ?');
  });
});

describe('préparation des histoires', () => {
  it('fabrique une fois chaque phrase, et passe celles déjà prêtes', async () => {
    const tts = setup(1);
    await tts.speak('fr', 'Il était une fois.');
    const texts = ['Il était une fois.', 'Trois ours.', 'Trois ours.', 'Fin.'];
    expect(await warmSpeech(tts, 'fr', texts)).toBe(2);
    expect(made()).toHaveLength(3);
    expect(await warmSpeech(tts, 'fr', texts)).toBe(0);
    expect(await tts.has('fr', 'Fin.')).toBe(true);
  });

  it('laisse passer d’abord les enfants qui écoutent', async () => {
    const tts = setup(1);
    const child = tts.speak('fr', 'LENT la consigne');
    await vi.waitFor(() => expect(tts.load.running).toBe(1));
    const warming = warmSpeech(tts, 'fr', ['Il était une fois.'], { idleMs: 20 });
    await child;
    await warming;
    expect(made().map((line) => line.split('|')[1])).toEqual([
      'lent la consigne',
      'Il était une fois.',
    ]);
  });

  it('s’arrête avec le serveur', async () => {
    const tts = setup(1);
    const stop = new AbortController();
    stop.abort();
    expect(await warmSpeech(tts, 'fr', ['Un.', 'Deux.'], { signal: stop.signal })).toBe(0);
    expect(made()).toHaveLength(0);
  });
});

describe('cache', () => {
  it('efface les phrases les moins écoutées au-delà de sa taille', async () => {
    dir = mkdtempSync(join(tmpdir(), 'tts-cache-'));
    const cache = new TtsCache(dir, 2500);
    for (const [i, key] of ['aa1', 'bb2', 'cc3'].entries()) {
      await cache.put(key, Buffer.alloc(1000));
      const when = new Date(Date.now() - (3 - i) * 60_000);
      utimesSync(join(dir, key.slice(0, 2), `${key}.wav`), when, when);
    }
    // aa1 vient d'être écoutée : c'est bb2, la plus ancienne, qui part.
    expect(await cache.get('aa1')).not.toBeNull();
    expect(await cache.prune()).toBe(1);
    expect(await cache.get('bb2')).toBeNull();
    expect(await cache.get('cc3')).not.toBeNull();
  });
});

describe('POST /api/tts', () => {
  async function app(tts: TtsService | null) {
    const db = openDb(':memory:');
    ensureAdminInvitation(db, 'TEST-ADMN-CODE');
    const server = await buildApp({ ...loadConfig({}), webDist: null, cookieSecure: false }, db, {
      logger: false,
      tts,
    });
    let cookie = '';
    const send = async (body: unknown) =>
      server.inject({
        method: 'POST',
        url: '/api/tts',
        payload: body as never,
        headers: cookie ? { cookie } : {},
      });
    const register = await server.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        code: 'test-admn-code',
        email: 'a@example.org',
        password: 'motdepasse-solide',
        familyName: 'F',
      },
    });
    const login = () => {
      const s = register.cookies.find((c) => c.name === 'wam_sid')!;
      cookie = `wam_sid=${s.value}`;
    };
    return { server, send, login };
  }

  it('lit la phrase pour un compte connecté seulement', async () => {
    const { server, send, login } = await app(setup());
    expect((await send({ voice: 'fr', text: 'Bonjour' })).statusCode).toBe(401);
    login();
    const res = await send({ voice: 'en', text: 'Hello!' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('audio/wav');
    expect(res.body).toBe(`RIFF${VOICES.en}.onnx:Hello!`);
    expect((await send({ voice: 'de', text: 'Hallo' })).statusCode).toBe(400);
    expect((await send({ voice: 'fr', text: 'a'.repeat(401) })).statusCode).toBe(400);
    const health = await server.inject({ url: '/api/health' });
    expect(health.json()).toMatchObject({ tts: 'on' });
    await server.close();
  });

  it('répond 503 sans voix du serveur : l’app garde celle du navigateur', async () => {
    const { server, send, login } = await app(null);
    login();
    const res = await send({ voice: 'fr', text: 'Bonjour' });
    expect(res.statusCode).toBe(503);
    expect(res.json()).toMatchObject({ error: 'tts_unavailable' });
    expect((await server.inject({ url: '/api/health' })).json()).toMatchObject({ tts: 'off' });
    await server.close();
  });
});
