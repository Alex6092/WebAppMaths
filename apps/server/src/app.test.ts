import { registry } from '@app/content';
import { generateQuestion, getWidget, type AttemptResponse, type MeResponse } from '@app/core';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from './app';
import { loadConfig, type Config } from './config';
import { openDb } from './db/client';
import { ensureAdminInvitation } from './services/invitations';

const ADMIN_CODE = 'TEST-ADMN-CODE';
const PASSWORD = 'motdepasse-solide';

let app: Awaited<ReturnType<typeof buildApp>>;

async function setup(overrides: Partial<Config> = {}) {
  const db = openDb(':memory:');
  const config = { ...loadConfig({}), webDist: null, cookieSecure: false, ...overrides };
  ensureAdminInvitation(db, ADMIN_CODE);
  app = await buildApp(config, db, { logger: false });
  return app;
}

afterEach(async () => {
  vi.useRealTimers();
  await app?.close();
});

/** Un navigateur : garde le cookie de session entre les requêtes. */
class Browser {
  cookie = '';
  async send(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    url: string,
    body?: unknown,
    headers: Record<string, string> = {},
  ) {
    const res = await app.inject({
      method,
      url: `/api${url}`,
      payload: body as never,
      headers: { ...(this.cookie ? { cookie: this.cookie } : {}), ...headers },
    });
    const session = res.cookies.find((c) => c.name === 'wam_sid');
    if (session) this.cookie = `wam_sid=${session.value}`;
    return res;
  }
}

async function registerAdmin() {
  const browser = new Browser();
  const res = await browser.send('POST', '/auth/register', {
    code: ADMIN_CODE.toLowerCase(),
    email: 'Admin@Example.org',
    password: PASSWORD,
    familyName: 'Famille A',
  });
  expect(res.statusCode).toBe(200);
  return { browser, me: res.json<MeResponse>() };
}

async function addChild(browser: Browser, firstName = 'Océane') {
  const res = await browser.send('POST', '/children', { firstName, avatar: '🦄', grade: 'CE1' });
  expect(res.statusCode).toBe(200);
  return res.json<{ id: number }>().id;
}

async function playAs(browser: Browser, childId: number, pluginId: string) {
  expect((await browser.send('POST', '/auth/active-child', { childId })).statusCode).toBe(200);
  const state = (await browser.send('GET', '/child/state')).json<{
    levels: Record<string, { level: number }>;
  }>();
  const session = (
    await browser.send('POST', '/child/sessions', { mode: 'training', selection: { pluginId } })
  ).json<{ id: number }>();
  const plugin = registry.plugin(pluginId)!;
  let seed = 1000;
  let level = state.levels[pluginId]?.level ?? 6;
  const answer = async (correct: boolean) => {
    seed++;
    const q = generateQuestion(plugin, level, seed);
    const given = correct ? plugin.solve(q) : getWidget(q.widget).emptyAnswer(q as never);
    const res = await browser.send('POST', '/child/attempts', {
      sessionId: session.id,
      pluginId,
      pluginVersion: plugin.version,
      level,
      seed,
      answers: [given],
      durationMs: 1200,
    });
    if (res.statusCode === 200) level = res.json<AttemptResponse>().level;
    return res;
  };
  return { session, answer, plugin };
}

describe('comptes', () => {
  it('crée le premier administrateur avec le code de démarrage', async () => {
    await setup();
    const { me } = await registerAdmin();
    expect(me.user).toMatchObject({ email: 'admin@example.org', role: 'admin' });
    expect(me.family?.name).toBe('Famille A');
    expect(me.parentVerifiedUntil).toBeGreaterThan(Date.now());
    const health = await app.inject({ url: '/api/health' });
    expect(health.json()).toMatchObject({ status: 'ok' });
  });

  it('refuse un code invalide ou déjà utilisé', async () => {
    await setup();
    await registerAdmin();
    const res = await new Browser().send('POST', '/auth/register', {
      code: ADMIN_CODE,
      email: 'autre@example.org',
      password: PASSWORD,
    });
    expect(res.json()).toMatchObject({ error: 'invalid_invitation' });
  });

  it('connecte avec le bon mot de passe seulement', async () => {
    await setup();
    await registerAdmin();
    const browser = new Browser();
    const bad = await browser.send('POST', '/auth/login', {
      email: 'admin@example.org',
      password: 'mauvais-mdp',
    });
    expect(bad.statusCode).toBe(401);
    const good = await browser.send('POST', '/auth/login', {
      email: 'ADMIN@example.org',
      password: PASSWORD,
    });
    expect(good.statusCode).toBe(200);
    expect((await browser.send('GET', '/auth/me')).statusCode).toBe(200);
    await browser.send('POST', '/auth/logout');
    expect((await browser.send('GET', '/auth/me')).statusCode).toBe(401);
  });

  it('limite les essais de connexion', async () => {
    await setup();
    const browser = new Browser();
    const statuses = [];
    for (let i = 0; i < 11; i++) {
      statuses.push(
        (await browser.send('POST', '/auth/login', { email: 'x@example.org', password: 'nope' }))
          .statusCode,
      );
    }
    expect(statuses.at(-1)).toBe(429);
  });

  describe('une école derrière une seule adresse IP', () => {
    /** Crée n familles (comptes parents), invitées par l'administrateur. */
    async function families(admin: Browser, n: number) {
      const emails: string[] = [];
      for (let i = 0; i < n; i++) {
        const { code } = (await admin.send('POST', '/admin/invitations', {})).json<{
          code: string;
        }>();
        const email = `parent${i}@example.org`;
        const res = await new Browser().send('POST', '/auth/register', {
          code,
          email,
          password: PASSWORD,
        });
        expect(res.statusCode).toBe(200);
        emails.push(email);
      }
      return emails;
    }

    it('trente parents se connectent depuis la même adresse', async () => {
      await setup();
      const { browser: admin } = await registerAdmin();
      const emails = await families(admin, 30);
      for (const email of emails) {
        const res = await new Browser().send('POST', '/auth/login', { email, password: PASSWORD });
        expect(res.statusCode, email).toBe(200);
      }
    });

    it('un compte bloqué ne bloque pas les autres', async () => {
      await setup();
      const { browser: admin } = await registerAdmin();
      const [blocked, other] = await families(admin, 2);
      const attempt = (email: string, password: string) =>
        new Browser().send('POST', '/auth/login', { email, password });
      for (let i = 0; i < 10; i++)
        expect((await attempt(blocked!, 'mauvais-mot-de-passe')).statusCode).toBe(401);
      const res = await attempt(blocked!, PASSWORD);
      expect(res.statusCode).toBe(429);
      expect(res.headers['retry-after']).toBeDefined();
      expect(res.json().message).toMatch(/Trop d’essais/);
      expect((await attempt(other!, PASSWORD)).statusCode).toBe(200);
    });

    it('un plafond par adresse sur toutes les routes de connexion', async () => {
      await setup({ authAttemptsPerIp: 5 });
      const visitor = new Browser();
      const statuses = [];
      // Connexions, aperçus de code et inscriptions comptent ensemble.
      for (let i = 0; i < 3; i++) {
        statuses.push(
          (
            await visitor.send('POST', '/auth/login', {
              email: `x${i}@example.org`,
              password: 'nope',
            })
          ).statusCode,
        );
        statuses.push(
          (await visitor.send('POST', '/auth/invitation', { code: `AAAA-BBBB-CCC${i}` }))
            .statusCode,
        );
      }
      expect(statuses).toEqual([401, 400, 401, 400, 401, 429]);
    });

    it('le déverrouillage est limité par compte', async () => {
      await setup();
      const { browser } = await registerAdmin();
      await browser.send('POST', '/auth/lock');
      for (let i = 0; i < 10; i++)
        expect(
          (await browser.send('POST', '/auth/unlock', { password: 'mauvais' })).statusCode,
        ).toBe(401);
      expect((await browser.send('POST', '/auth/unlock', { password: PASSWORD })).statusCode).toBe(
        429,
      );
    });

    it('chaque appareil connecté a son quota de requêtes', async () => {
      await setup({ requestsPerMinute: 5 });
      const { browser: first } = await registerAdmin();
      const second = new Browser();
      await second.send('POST', '/auth/login', { email: 'admin@example.org', password: PASSWORD });
      const me = async (b: Browser) => (await b.send('GET', '/auth/me')).statusCode;
      const firstStatuses = [];
      for (let i = 0; i < 6; i++) firstStatuses.push(await me(first));
      expect(firstStatuses.at(-1)).toBe(429);
      // Même adresse, autre appareil : son propre quota.
      expect(await me(second)).toBe(200);
      // Un cookie inventé n'ouvre pas de quota neuf : il compte avec l'adresse.
      const forged = new Browser();
      forged.cookie = 'wam_sid=invente';
      const forgedStatuses = [];
      for (let i = 0; i < 6; i++) forgedStatuses.push(await me(forged));
      expect(forgedStatuses.at(-1)).toBe(429);
    });
  });

  it('verrouille l’espace parent quand un enfant prend l’appareil', async () => {
    await setup();
    const { browser } = await registerAdmin();
    const childId = await addChild(browser);
    await browser.send('POST', '/auth/active-child', { childId });
    const locked = await browser.send('POST', '/children', {
      firstName: 'Léo',
      avatar: '🐱',
      grade: 'CP',
    });
    expect(locked.json()).toMatchObject({ error: 'parent_locked' });
    expect(
      (await browser.send('POST', '/auth/unlock', { password: 'faux-mot-de-passe' })).statusCode,
    ).toBe(401);
    expect((await browser.send('POST', '/auth/unlock', { password: PASSWORD })).statusCode).toBe(
      200,
    );
    expect(
      (await browser.send('POST', '/children', { firstName: 'Léo', avatar: '🐱', grade: 'CP' }))
        .statusCode,
    ).toBe(200);
  });

  it('l’espace parent se verrouille après 10 minutes sans action', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const t0 = new Date('2026-11-04T08:00:00Z').getTime();
    const at = (minutes: number) => vi.setSystemTime(t0 + minutes * 60_000);
    at(0);
    await setup();
    const { browser } = await registerAdmin();
    const parentSpace = () => browser.send('GET', '/family/export');
    // Une action à 8 minutes : l'espace reste ouvert à 15 minutes…
    at(8);
    expect((await parentSpace()).statusCode).toBe(200);
    at(15);
    expect((await parentSpace()).statusCode).toBe(200);
    expect((await browser.send('GET', '/auth/me')).json<MeResponse>().parentVerifiedUntil).toBe(
      t0 + 25 * 60_000,
    );
    // … puis se verrouille 10 minutes après la dernière action.
    at(26);
    expect((await parentSpace()).json().error).toBe('parent_locked');
    // Une requête refusée ne repousse pas le verrou.
    await browser.send('POST', '/auth/unlock', { password: PASSWORD });
    at(32);
    expect((await browser.send('PATCH', '/children/999999', { coins: 1 })).statusCode).toBe(404);
    at(41);
    expect((await parentSpace()).json().error).toBe('parent_locked');
  });

  it('refuse les requêtes venues d’un autre site', async () => {
    await setup();
    const { browser } = await registerAdmin();
    const res = await browser.send('POST', '/auth/lock', {}, { origin: 'https://pirate.example' });
    expect(res.statusCode).toBe(403);
  });
});

describe('fichiers de l’interface', () => {
  it('met en cache les assets versionnés, jamais index.html', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'web-'));
    mkdirSync(join(dir, 'assets'));
    writeFileSync(join(dir, 'index.html'), '<!doctype html>');
    writeFileSync(join(dir, 'assets', 'index-abc.js'), 'console.log(1)');
    const config = { ...loadConfig({}), webDist: dir, cookieSecure: false };
    app = await buildApp(config, openDb(':memory:'), { logger: false });
    expect((await app.inject({ url: '/' })).headers['cache-control']).toBe('no-cache');
    expect((await app.inject({ url: '/assets/index-abc.js' })).headers['cache-control']).toContain(
      'immutable',
    );
  });
});

describe('cloisonnement des familles', () => {
  it('une famille ne voit ni ne modifie les enfants d’une autre', async () => {
    await setup();
    const { browser: a } = await registerAdmin();
    const childA = await addChild(a, 'Enfant A');
    const invite = (await a.send('POST', '/admin/invitations', { note: 'Famille B' })).json<{
      code: string;
    }>();

    const b = new Browser();
    const meB = (
      await b.send('POST', '/auth/register', {
        code: invite.code,
        email: 'b@example.org',
        password: PASSWORD,
        familyName: 'Famille B',
      })
    ).json<MeResponse>();
    expect(meB.user.role).toBe('parent');
    expect(meB.children).toEqual([]);

    expect((await b.send('PATCH', `/children/${childA}`, { firstName: 'Piraté' })).statusCode).toBe(
      404,
    );
    expect((await b.send('DELETE', `/children/${childA}`)).statusCode).toBe(404);
    expect((await b.send('POST', '/auth/active-child', { childId: childA })).statusCode).toBe(404);
    expect((await b.send('GET', '/admin/invitations')).json()).toMatchObject({
      error: 'admin_only',
    });
  });
});

describe('séances et tentatives', () => {
  it('recorrige côté serveur, crédite les pièces et refuse les doublons', async () => {
    await setup();
    const { browser } = await registerAdmin();
    const childId = await addChild(browser);
    const { answer, session } = await playAs(browser, childId, 'maths.calcul.addition-posee');

    const right = (await answer(true)).json<AttemptResponse>();
    expect(right).toMatchObject({ firstTryCorrect: true, solved: true, coinsEarned: 30 });

    const wrong = (await answer(false)).json<AttemptResponse>();
    expect(wrong).toMatchObject({ firstTryCorrect: false, coinsEarned: 0, coins: 30 });

    const plugin = registry.plugin('maths.calcul.addition-posee')!;
    const q = generateQuestion(plugin, 6, 1001);
    const duplicate = await browser.send('POST', '/child/attempts', {
      sessionId: session.id,
      pluginId: plugin.id,
      pluginVersion: plugin.version,
      level: 6,
      seed: 1001,
      answers: [plugin.solve(q)],
      durationMs: 10,
    });
    expect(duplicate.json()).toMatchObject({ error: 'duplicate_attempt' });

    const malformed = await browser.send('POST', '/child/attempts', {
      sessionId: session.id,
      pluginId: plugin.id,
      pluginVersion: plugin.version,
      level: 6,
      seed: 5,
      answers: [{ digits: 'pirate' }],
      durationMs: 10,
    });
    expect(malformed.json()).toMatchObject({ error: 'invalid_answer' });

    const summary = (await browser.send('POST', `/child/sessions/${session.id}/end`)).json();
    expect(summary).toMatchObject({ nQuestions: 2, nFirstTry: 1, coinsEarned: 30 });
  });

  it('fait monter le niveau après 5 bonnes réponses (départ au niveau CE1)', async () => {
    await setup();
    const { browser } = await registerAdmin();
    const childId = await addChild(browser);
    const { answer } = await playAs(browser, childId, 'maths.calcul.soustraction-posee');
    const results = [];
    for (let i = 0; i < 5; i++) results.push((await answer(true)).json<AttemptResponse>());
    expect(results.map((r) => r.levelChange)).toEqual([null, null, null, null, 'up']);
    expect(results.at(-1)!.level).toBe(7);
  });

  it('achète une récompense seulement avec assez de pièces', async () => {
    await setup();
    const { browser } = await registerAdmin();
    const childId = await addChild(browser);
    const { answer } = await playAs(browser, childId, 'maths.calcul.addition-posee');
    const poor = await browser.send('POST', '/child/rewards', {
      themeId: 'royaume-magique',
      rewardId: 'r2',
    });
    expect(poor.json()).toMatchObject({ error: 'not_enough_coins' });
    await answer(true);
    const bought = await browser.send('POST', '/child/rewards', {
      themeId: 'royaume-magique',
      rewardId: 'r2',
    });
    expect(bought.json()).toEqual({ coins: 15, badges: [] });
    const again = await browser.send('POST', '/child/rewards', {
      themeId: 'royaume-magique',
      rewardId: 'r2',
    });
    expect(again.json()).toMatchObject({ error: 'already_owned' });
    const state = (await browser.send('GET', '/child/state')).json();
    expect(state.owned).toEqual([{ themeId: 'royaume-magique', rewardId: 'r2' }]);
  });
});
