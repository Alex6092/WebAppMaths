import { registry } from '@app/content';
import { generateQuestion, type AttemptResponse, type ChildStateResponse } from '@app/core';
import { expect, it } from 'vitest';
import { buildApp } from './app';
import { loadConfig } from './config';
import { openDb } from './db/client';
import { ensureAdminInvitation } from './services/invitations';

it('mélange : séance sur des notions, acquisition mise à jour, exercice hors séance refusé', async () => {
  const db = openDb(':memory:');
  ensureAdminInvitation(db, 'TEST-ADMN-CODE');
  const app = await buildApp({ ...loadConfig({}), webDist: null, cookieSecure: false }, db, {
    logger: false,
  });
  let cookie = '';
  const send = async (method: 'GET' | 'POST', url: string, body?: unknown) => {
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
  const child = (
    await send('POST', '/children', { firstName: 'O', avatar: '🦄', grade: 'CE1' })
  ).json<{ id: number }>().id;
  await send('POST', '/auth/active-child', { childId: child });

  const before = (await send('GET', '/child/state')).json<ChildStateResponse>();
  expect(before.notions['maths.calcul.tables']).toMatchObject({ status: 'new', attempts: 0 });

  expect(
    (await send('POST', '/child/sessions', { mode: 'mix', selection: { notions: [] } })).statusCode,
  ).toBe(400);
  expect(
    (await send('POST', '/child/sessions', { mode: 'mix', selection: { notions: ['inconnue'] } }))
      .statusCode,
  ).toBe(400);

  const session = (
    await send('POST', '/child/sessions', {
      mode: 'mix',
      selection: { notions: ['maths.calcul.tables', 'maths.nombres.encadrer'] },
    })
  ).json<{ id: number }>();

  const play = (pluginId: string, seed: number) => {
    const plugin = registry.plugin(pluginId)!;
    const q = generateQuestion(plugin, 1, seed);
    return send('POST', '/child/attempts', {
      sessionId: session.id,
      pluginId,
      pluginVersion: plugin.version,
      level: 1,
      seed,
      answers: [plugin.solve(q)],
      durationMs: 1000,
    });
  };

  const ok = await play('maths.calcul.tables', 1);
  expect(ok.statusCode).toBe(200);
  expect(ok.json<AttemptResponse>().notions['maths.calcul.tables']).toMatchObject({
    attempts: 1,
  });
  expect((await play('maths.nombres.encadrer', 2)).statusCode).toBe(200);
  // La géométrie ne fait pas partie de ce mélange.
  expect((await play('maths.geometrie.trace-alignes', 3)).statusCode).toBe(400);

  const after = (await send('GET', '/child/state')).json<ChildStateResponse>();
  expect(after.notions['maths.calcul.tables']!.attempts).toBe(1);
  expect(after.notions['maths.calcul.tables']!.status).not.toBe('new');
  await app.close();
});
