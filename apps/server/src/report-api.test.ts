import { registry } from '@app/content';
import {
  generateQuestion,
  type AttemptResponse,
  type ChildReport,
  type ChildStateResponse,
  type StartSessionResponse,
} from '@app/core';
import { expect, it } from 'vitest';
import { buildApp } from './app';
import { loadConfig } from './config';
import { openDb } from './db/client';
import { ensureAdminInvitation } from './services/invitations';

it('bilan du parent et « Revoir mes erreurs » : la question ratée revient à l’identique', async () => {
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
  const childId = (
    await send('POST', '/children', { firstName: 'O', avatar: '🦄', grade: 'CE1' })
  ).json<{ id: number }>().id;
  await send('POST', '/auth/active-child', { childId });

  const plugin = registry.plugin('maths.calcul.tables')!;
  const attempt = (sessionId: number, seed: number, answers: unknown[]) =>
    send('POST', '/child/attempts', {
      sessionId,
      pluginId: plugin.id,
      pluginVersion: plugin.version,
      level: 1,
      seed,
      answers,
      durationMs: 30_000,
    });
  const good = (seed: number) => plugin.solve(generateQuestion(plugin, 1, seed));

  expect(
    (await send('POST', '/child/sessions', { mode: 'review', selection: {} })).statusCode,
  ).toBe(400);

  // Une séance : une question juste, une ratée au premier essai puis corrigée.
  const training = (
    await send('POST', '/child/sessions', {
      mode: 'training',
      selection: { pluginId: plugin.id },
    })
  ).json<StartSessionResponse>();
  await attempt(training.id, 1, [good(1)]);
  const missed = (
    await attempt(training.id, 2, [{ value: '999' }, good(2)])
  ).json<AttemptResponse>();
  expect(missed.firstTryCorrect).toBe(false);
  expect((await send('GET', '/child/state')).json<ChildStateResponse>().mistakes).toBe(1);

  // L'espace parent se verrouille quand un enfant joue : on le rouvre avec le mot de passe.
  expect((await send('GET', `/children/${childId}/report`)).statusCode).toBe(403);
  await send('POST', '/auth/unlock', { password: 'motdepasse-solide' });
  const report = (await send('GET', `/children/${childId}/report`)).json<ChildReport>();
  expect(report.days).toHaveLength(30);
  expect(report.days.at(-1)).toMatchObject({ questions: 2, firstTry: 1, minutes: 1 });
  expect(report.sessions).toMatchObject([
    { mode: 'training', pluginId: plugin.id, nQuestions: 2, nFirstTry: 1 },
  ]);
  expect(report.mistakes).toEqual([
    {
      pluginId: plugin.id,
      attempts: 2,
      errors: 1,
      recent: [
        expect.objectContaining({ seed: 2, level: 1, answers: [{ value: '999' }, good(2)] }),
      ],
    },
  ]);
  expect(report.toReview).toBe(1);
  expect((await send('GET', '/children/9999/report')).statusCode).toBe(404);

  // Revoir mes erreurs : seule la question ratée (même graine) fait partie de la séance.
  const review = (
    await send('POST', '/child/sessions', { mode: 'review', selection: {} })
  ).json<StartSessionResponse>();
  expect(review.items).toEqual([{ pluginId: plugin.id, level: 1, seed: 2 }]);
  expect((await attempt(review.id, 3, [good(3)])).statusCode).toBe(400);
  expect((await attempt(review.id, 2, [good(2)])).statusCode).toBe(200);
  expect((await send('GET', '/child/state')).json<ChildStateResponse>().mistakes).toBe(0);
  expect((await send('GET', `/children/${childId}/report`)).json<ChildReport>().toReview).toBe(0);
  await app.close();
});
