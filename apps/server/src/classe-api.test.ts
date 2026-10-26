import { registry } from '@app/content';
import {
  generateQuestion,
  HOMEWORK_BONUS,
  type AssignmentDto,
  type AttemptResponse,
  type ChildReport,
  type ChildStateResponse,
  type StartSessionResponse,
} from '@app/core';
import { afterEach, expect, it, vi } from 'vitest';
import { buildApp } from './app';
import { loadConfig } from './config';
import { openDb } from './db/client';
import { ensureAdminInvitation } from './services/invitations';

afterEach(() => {
  vi.useRealTimers();
});

it('notions vues, devoirs, révision espacée et temps de réponse', async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-02T08:00:00Z'));
  const db = openDb(':memory:');
  ensureAdminInvitation(db, 'TEST-ADMN-CODE');
  const app = await buildApp({ ...loadConfig({}), webDist: null, cookieSecure: false }, db, {
    logger: false,
  });
  let cookie = '';
  const send = async (method: 'GET' | 'POST' | 'PATCH' | 'DELETE', url: string, body?: unknown) => {
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
  const unlock = () => send('POST', '/auth/unlock', { password: 'motdepasse-solide' });
  await send('POST', '/auth/register', {
    code: 'test-admn-code',
    email: 'a@example.org',
    password: 'motdepasse-solide',
    familyName: 'F',
  });
  const childId = (
    await send('POST', '/children', { firstName: 'O', avatar: '🦄', grade: 'CE1' })
  ).json<{ id: number }>().id;

  // Notions vues en classe : toutes au départ ; on décoche la géométrie sauf une notion.
  const geometry = registry.notionsInScope('maths.geometrie', 'CE1').map((n) => n.id);
  for (const notionId of geometry.slice(1))
    await send('PATCH', `/children/${childId}/notions`, { notionId, active: false });
  // Le parent donne un devoir sur les tables.
  const created = await send('POST', `/children/${childId}/assignments`, {
    title: 'Tables',
    notions: ['maths.calcul.tables'],
    questions: 3,
    dueOn: '2026-11-05',
  });
  expect(created.statusCode).toBe(200);
  const assignment = created.json<AssignmentDto>();
  expect(
    (
      await send('POST', `/children/${childId}/assignments`, {
        title: 'Trop tard',
        notions: ['maths.calcul.tables'],
        questions: 3,
        dueOn: '2026-10-01',
      })
    ).statusCode,
  ).toBe(400);

  await send('POST', '/auth/active-child', { childId });
  const start = await state();
  expect(start.activeNotions).toContain(geometry[0]);
  expect(start.activeNotions).not.toContain(geometry[1]);
  expect(start.assignments).toMatchObject([{ id: assignment.id, answered: 0, questions: 3 }]);

  // Le défi du jour ne prend que les notions vues.
  const daily = (
    await send('POST', '/child/sessions', { mode: 'daily', selection: {} })
  ).json<StartSessionResponse>();
  expect(daily.notions).toEqual(start.activeNotions);

  const plugin = registry.plugin('maths.calcul.tables')!;
  let seed = 0;
  const play = async (sessionId: number, level: number, correct = true, firstTryMs = 4000) => {
    seed++;
    const good = plugin.solve(generateQuestion(plugin, level, seed));
    return (
      await send('POST', '/child/attempts', {
        sessionId,
        pluginId: plugin.id,
        pluginVersion: plugin.version,
        level,
        seed,
        answers: correct ? [good] : [{ value: '999' }, good],
        durationMs: 9000,
        firstTryMs,
      })
    ).json<AttemptResponse>();
  };

  // Le devoir : 3 questions, avec le bonus à la dernière.
  const hw = (
    await send('POST', '/child/sessions', {
      mode: 'homework',
      selection: { assignmentId: assignment.id },
    })
  ).json<StartSessionResponse>();
  expect(hw).toMatchObject({ answered: 0, total: 3, notions: ['maths.calcul.tables'] });
  await play(hw.id, 1);
  // Reprise : une nouvelle séance repart du compte déjà fait.
  const again = (
    await send('POST', '/child/sessions', {
      mode: 'homework',
      selection: { assignmentId: assignment.id },
    })
  ).json<StartSessionResponse>();
  expect(again.answered).toBe(1);
  expect((await play(again.id, 1)).homeworkBonus).toBe(0);
  const last = await play(again.id, 1);
  expect(last.homeworkBonus).toBe(HOMEWORK_BONUS);
  expect(last.assignment).toMatchObject({ answered: 3, completedAt: expect.any(Number) });
  expect(
    (
      await send('POST', '/child/sessions', {
        mode: 'homework',
        selection: { assignmentId: assignment.id },
      })
    ).statusCode,
  ).toBe(409);

  // Révision espacée : 10 réponses justes au niveau attendu, la notion est acquise.
  const training = (
    await send('POST', '/child/sessions', {
      mode: 'training',
      selection: { pluginId: plugin.id },
    })
  ).json<StartSessionResponse>();
  let res: AttemptResponse | null = null;
  for (let i = 0; i < 10; i++) res = await play(training.id, plugin.expectedLevel ?? 1, true, 3000);
  expect(res!.notions['maths.calcul.tables']!.status).toBe('A');
  const review = res!.reviews['maths.calcul.tables']!;
  expect(review.box).toBe(0);
  expect(review.dueAt).toBe(new Date('2026-11-03T08:00:00Z').getTime());

  // Pas encore due : rien ne bouge. Le lendemain, une réponse juste la fait avancer.
  expect((await play(training.id, 5)).reviews['maths.calcul.tables']!.box).toBe(0);
  vi.setSystemTime(new Date('2026-11-03T09:00:00Z'));
  const next = (await play(training.id, 5)).reviews['maths.calcul.tables']!;
  expect(next.box).toBe(1);
  expect(next.dueAt).toBe(new Date('2026-11-06T09:00:00Z').getTime());
  expect((await state()).reviews['maths.calcul.tables']).toEqual(next);

  // Temps de réponse : le parent voit le temps de la première réponse.
  await unlock();
  const report = (await send('GET', `/children/${childId}/report`)).json<ChildReport>();
  const timing = report.timing.find((t) => t.pluginId === plugin.id)!;
  expect(timing.points).toHaveLength(15);
  expect(timing.points[0]).toMatchObject({ ms: 4000, level: 1, firstTry: true });
  expect(timing.points.at(-1)).toMatchObject({ ms: 4000, level: 5 });
  expect(report.reviews['maths.calcul.tables']!.box).toBe(1);

  expect(
    (await send('DELETE', `/children/${childId}/assignments/${assignment.id}`)).statusCode,
  ).toBe(200);
  expect((await send('GET', `/children/${childId}/assignments`)).json()).toEqual([]);
  await app.close();
});
