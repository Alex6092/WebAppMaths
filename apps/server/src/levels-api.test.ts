import { registry } from '@app/content';
import type { ChildStateResponse } from '@app/core';
import { expect, it } from 'vitest';
import { buildApp } from './app';
import { loadConfig } from './config';
import { openDb } from './db/client';
import { ensureAdminInvitation } from './services/invitations';

it('le parent choisit le niveau d’un exercice, et l’enfant reprend de là', async () => {
  const db = openDb(':memory:');
  ensureAdminInvitation(db, 'TEST-ADMN-CODE');
  const app = await buildApp({ ...loadConfig({}), webDist: null, cookieSecure: false }, db, {
    logger: false,
  });
  let cookie = '';
  const send = async (method: 'GET' | 'POST' | 'PUT', url: string, body?: unknown) => {
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
  await send('POST', '/auth/register', {
    code: 'test-admn-code',
    email: 'a@example.org',
    password: 'motdepasse-solide',
    familyName: 'F',
  });
  const childId = (
    await send('POST', '/children', { firstName: 'O', avatar: '🦄', grade: 'CE1' })
  ).json<{ id: number }>().id;

  const plugin = registry.plugin('musique.lecture.cle-de-sol')!;
  const url = `/children/${childId}/levels/${plugin.id}`;
  expect((await send('PUT', url, { level: 3 })).json()).toEqual({ level: 3 });
  // Au-delà du dernier niveau, on s'arrête au dernier.
  expect((await send('PUT', url, { level: 99 })).json()).toEqual({
    level: plugin.levels.length,
  });
  expect((await send('PUT', url, { level: 2 })).statusCode).toBe(200);
  expect((await send('GET', `/children/${childId}/levels`)).json()).toEqual({ [plugin.id]: 2 });
  expect((await send('PUT', url, { level: 0 })).statusCode).toBe(400);
  expect((await send('PUT', `/children/${childId}/levels/inconnu`, { level: 1 })).statusCode).toBe(
    404,
  );
  expect((await send('PUT', `/children/9999/levels/${plugin.id}`, { level: 1 })).statusCode).toBe(
    404,
  );

  await send('POST', '/auth/active-child', { childId });
  const state = (await send('GET', '/child/state')).json<ChildStateResponse>();
  expect(state.levels[plugin.id]).toMatchObject({ level: 2, consecutiveErrors: 0 });
  await app.close();
});
