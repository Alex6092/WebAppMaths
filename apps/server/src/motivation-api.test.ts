import { registry } from '@app/content';
import {
  DAILY_BONUS,
  DAILY_LENGTH,
  generateQuestion,
  type AttemptResponse,
  type ChildDto,
  type ChildStateResponse,
  type StartSessionResponse,
  type ThemeResponse,
} from '@app/core';
import { eq } from 'drizzle-orm';
import { afterEach, expect, it, vi } from 'vitest';
import { buildApp } from './app';
import { loadConfig } from './config';
import { openDb } from './db/client';
import { children } from './db/schema';
import { ensureAdminInvitation } from './services/invitations';

afterEach(() => {
  vi.useRealTimers();
});

it('ambiances, défi du jour, série de jours, badges et son', async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-02T08:00:00Z'));
  const db = openDb(':memory:');
  ensureAdminInvitation(db, 'TEST-ADMN-CODE');
  const app = await buildApp({ ...loadConfig({}), webDist: null, cookieSecure: false }, db, {
    logger: false,
  });
  let cookie = '';
  const send = async (method: 'GET' | 'POST' | 'PATCH', url: string, body?: unknown) => {
    const res = await app.inject({
      method,
      url: `/api${url}`,
      payload: body as never,
      headers: cookie ? { cookie } : {},
    });
    const s = res.cookies.find((c) => c.name === 'wam_sid');
    if (s) cookie = `wam_sid=${s.value}`;
    return res;
  };
  const state = async () => (await send('GET', '/child/state')).json<ChildStateResponse>();
  await send('POST', '/auth/register', {
    code: 'test-admn-code',
    email: 'a@example.org',
    password: 'motdepasse-solide',
    familyName: 'F',
  });
  const childId = (
    await send('POST', '/children', { firstName: 'O', avatar: '🦄', grade: 'CE1' })
  ).json<{ id: number }>().id;
  await send('POST', '/auth/active-child', { childId });

  // Ambiances : le Royaume est gratuit, l'Exploration spatiale coûte des pièces.
  const start = await state();
  expect(start.themes).toEqual(['royaume-magique']);
  expect(start.child.sound).toBe(true);
  expect((await send('POST', '/child/theme', { themeId: 'exploration-spatiale' })).statusCode).toBe(
    400,
  );
  db.update(children).set({ coins: 200 }).where(eq(children.id, childId)).run();
  const bought = (
    await send('POST', '/child/theme', { themeId: 'exploration-spatiale' })
  ).json<ThemeResponse>();
  expect(bought).toEqual({
    coins: 50,
    themeId: 'exploration-spatiale',
    themes: ['royaume-magique', 'exploration-spatiale'],
  });
  // Revenir à une ambiance débloquée ne coûte rien.
  expect(
    (await send('POST', '/child/theme', { themeId: 'royaume-magique' })).json<ThemeResponse>()
      .coins,
  ).toBe(50);

  // Défi du jour : 10 questions, reprise en cours de route, bonus à la fin.
  const plugin = registry.plugin('maths.calcul.tables')!;
  let seed = 0;
  const play = async (sessionId: number) => {
    seed++;
    const q = generateQuestion(plugin, 1, seed);
    return send('POST', '/child/attempts', {
      sessionId,
      pluginId: plugin.id,
      pluginVersion: plugin.version,
      level: 1,
      seed,
      answers: [plugin.solve(q)],
      durationMs: 1000,
    });
  };
  const daily = () => send('POST', '/child/sessions', { mode: 'daily', selection: {} });

  const first = (await daily()).json<StartSessionResponse>();
  expect(first.answered).toBe(0);
  for (let i = 0; i < 4; i++) await play(first.id);
  const resumed = (await daily()).json<StartSessionResponse>();
  expect(resumed).toEqual({ id: first.id, answered: 4 });

  let last: AttemptResponse | null = null;
  for (let i = 4; i < DAILY_LENGTH; i++) {
    last = (await play(first.id)).json<AttemptResponse>();
    if (i < DAILY_LENGTH - 1) expect(last.dailyBonus).toBe(0);
  }
  expect(last!.dailyBonus).toBe(DAILY_BONUS);
  expect(last!.daily).toMatchObject({ answered: DAILY_LENGTH, total: 1 });
  expect(last!.daily!.streak).toEqual({ current: 1, best: 1, doneToday: true });
  expect(last!.badges).toContain('daily-1');
  // Une fois réussi, le défi revient demain.
  expect((await daily()).statusCode).toBe(409);
  expect((await play(first.id)).statusCode).toBe(409);

  // Le lendemain (heure de Paris), la série continue.
  vi.setSystemTime(new Date('2026-11-03T07:30:00Z'));
  const next = (await daily()).json<StartSessionResponse>();
  expect(next.id).not.toBe(first.id);
  for (let i = 0; i < DAILY_LENGTH; i++) last = (await play(next.id)).json<AttemptResponse>();
  expect(last!.daily!.streak).toEqual({ current: 2, best: 2, doneToday: true });

  // Deux jours sans défi : la série retombe, la meilleure reste.
  vi.setSystemTime(new Date('2026-11-06T10:00:00Z'));
  const later = await state();
  expect(later.daily).toMatchObject({ answered: 0, total: 2 });
  expect(later.daily.streak).toEqual({ current: 0, best: 2, doneToday: false });
  expect(later.badges.map((b) => b.id)).toEqual(['daily-1']);

  // Le son se coupe et se remet.
  expect((await send('PATCH', '/child/settings', { sound: false })).json<ChildDto>().sound).toBe(
    false,
  );
  expect((await state()).child.sound).toBe(false);
  await app.close();
});
