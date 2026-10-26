import { registry } from '@app/content';
import { generateQuestion, getWidget, type AttemptResponse, type MeResponse } from '@app/core';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from './app';
import { loadConfig } from './config';
import { openDb } from './db/client';
import { ensureAdminInvitation } from './services/invitations';

const ADMIN_CODE = 'TEST-ADMN-CODE';
const PASSWORD = 'motdepasse-solide';

let app: Awaited<ReturnType<typeof buildApp>>;

async function setup() {
  const db = openDb(':memory:');
  const config = { ...loadConfig({}), webDist: null, cookieSecure: false };
  ensureAdminInvitation(db, ADMIN_CODE);
  app = await buildApp(config, db, { logger: false });
  return app;
}

afterEach(async () => {
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
    expect(me.family.name).toBe('Famille A');
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
