import { registry } from '@app/content';
import {
  generateQuestion,
  type AttemptResponse,
  type ChildStateResponse,
  type CreatedInvitation,
  type EvaluationDto,
  type EvaluationReport,
  type ReviewItem,
  type StartSessionResponse,
} from '@app/core';
import { expect, it } from 'vitest';
import { buildApp } from './app';
import { loadConfig } from './config';
import { openDb } from './db/client';
import { ensureAdminInvitation } from './services/invitations';

const PASSWORD = 'motdepasse-solide';

async function setup() {
  const db = openDb(':memory:');
  ensureAdminInvitation(db, 'TEST-ADMN-CODE');
  const app = await buildApp({ ...loadConfig({}), webDist: null, cookieSecure: false }, db, {
    logger: false,
  });
  /** Un appareil : ses requêtes gardent son cookie de session. */
  const device = () => {
    let cookie = '';
    return async (method: 'GET' | 'POST' | 'DELETE', url: string, body?: unknown) => {
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
  };
  return { app, device };
}

it('évaluation blanche : un essai, sans pièces ni niveau, puis le bilan de l’école', async () => {
  const { app, device } = await setup();
  const send = device();
  await send('POST', '/auth/register', {
    code: 'test-admn-code',
    email: 'a@example.org',
    password: PASSWORD,
    familyName: 'F',
  });
  const childId = (
    await send('POST', '/children', { firstName: 'O', avatar: '🦄', grade: 'CE1' })
  ).json<{ id: number }>().id;

  // Le parent prépare l'évaluation : deux notions, trois questions chacune.
  const geometry = registry.notionsInScope('maths.geometrie', 'CE1')[0]!.id;
  const tables = 'maths.calcul.tables';
  expect(
    (
      await send('POST', `/children/${childId}/evaluations`, {
        title: 'Inconnue',
        notions: ['maths.rien'],
        perNotion: 3,
      })
    ).statusCode,
  ).toBe(400);
  const created = await send('POST', `/children/${childId}/evaluations`, {
    title: 'Évaluation de novembre',
    notions: [tables, geometry],
    perNotion: 3,
  });
  expect(created.statusCode).toBe(200);
  const evaluation = created.json<EvaluationDto>();
  // Les lignes suivent l'ordre du catalogue.
  expect([...evaluation.notions].sort()).toEqual([geometry, tables].sort());
  expect(evaluation).toMatchObject({ total: 6, answered: 0, completedAt: null });

  await send('POST', '/auth/active-child', { childId });
  const state = (await send('GET', '/child/state')).json<ChildStateResponse>();
  expect(state.evaluations).toMatchObject([{ id: evaluation.id, answered: 0, total: 6 }]);
  const coins = state.child.coins;

  const start = async () =>
    send('POST', '/child/sessions', {
      mode: 'evaluation',
      selection: { evaluationId: evaluation.id },
    });
  const first = (await start()).json<StartSessionResponse>();
  expect(first).toMatchObject({ answered: 0, total: 6 });
  expect(first.items).toHaveLength(6);

  const answer = async (sessionId: number, item: ReviewItem, answers?: unknown[]) => {
    const plugin = registry.plugin(item.pluginId)!;
    const good = plugin.solve(generateQuestion(plugin, item.level, item.seed));
    return send('POST', '/child/attempts', {
      sessionId,
      ...item,
      pluginVersion: plugin.version,
      answers: answers ?? [good],
      durationMs: 5000,
      firstTryMs: 5000,
    });
  };
  const items = first.items!;
  // Un seul essai par question.
  const plugin0 = registry.plugin(items[0]!.pluginId)!;
  const good0 = plugin0.solve(generateQuestion(plugin0, items[0]!.level, items[0]!.seed));
  expect((await answer(first.id, items[0]!, [good0, good0])).statusCode).toBe(400);

  const res = (await answer(first.id, items[0]!)).json<AttemptResponse>();
  expect(res).toMatchObject({ firstTryCorrect: true, coinsEarned: 0, levelChange: null });
  expect(res.evaluation).toMatchObject({ answered: 1, completedAt: null });
  // Une question déjà répondue ne se rejoue pas.
  expect((await answer(first.id, items[0]!)).statusCode).toBe(400);

  // Reprise : il reste cinq questions.
  const again = (await start()).json<StartSessionResponse>();
  expect(again).toMatchObject({ answered: 1, total: 6 });
  expect(again.items).toEqual(items.slice(1));
  // Une question fausse sur les tables, le reste juste.
  const wrongItem = again.items!.find((i) => i.pluginId === tables)!;
  let last: AttemptResponse | null = null;
  for (const item of again.items!) {
    const r = await answer(again.id, item, item === wrongItem ? [{ value: '999' }] : undefined);
    expect(r.statusCode).toBe(200);
    last = r.json<AttemptResponse>();
  }
  expect(last!.evaluation).toMatchObject({ answered: 6, completedAt: expect.any(Number) });
  expect((await start()).statusCode).toBe(409);

  // Ni pièces, ni niveau : l'évaluation ne touche pas aux exercices.
  const after = (await send('GET', '/child/state')).json<ChildStateResponse>();
  expect(after.child.coins).toBe(coins);
  for (const item of items) expect(after.levels[item.pluginId]).toBeUndefined();

  const report = (
    await send('GET', `/child/evaluations/${evaluation.id}`)
  ).json<EvaluationReport>();
  expect(report.points).toBe(5);
  expect(report.questions.every((q) => q.answers !== null)).toBe(true);
  expect(report.lines.find((l) => l.notionId === geometry)).toMatchObject({
    points: 3,
    total: 3,
    code: 'A',
  });
  expect(report.lines.find((l) => l.notionId === tables)).toMatchObject({
    points: 2,
    total: 3,
    code: 'ECA',
  });
  // La question ratée rejoint « Revoir mes erreurs ».
  expect(after.mistakes).toBe(1);

  // Côté parent : la liste et le bilan, puis la suppression.
  await send('POST', '/auth/unlock', { password: PASSWORD });
  const list = (await send('GET', `/children/${childId}/evaluations`)).json<EvaluationDto[]>();
  expect(list).toMatchObject([{ id: evaluation.id, answered: 6 }]);
  expect(
    (await send('GET', `/children/${childId}/evaluations/${evaluation.id}`)).json(),
  ).toMatchObject({ firstName: 'O', points: report.points });
  expect(
    (await send('DELETE', `/children/${childId}/evaluations/${evaluation.id}`)).statusCode,
  ).toBe(200);
  expect((await send('GET', `/children/${childId}/evaluations`)).json()).toEqual([]);
  await app.close();
});

it('export et suppression des données d’une famille', async () => {
  const { app, device } = await setup();
  const admin = device();
  await admin('POST', '/auth/register', {
    code: 'test-admn-code',
    email: 'admin@example.org',
    password: PASSWORD,
    familyName: 'Admin',
  });
  const { code } = (
    await admin('POST', '/admin/invitations', { note: 'Famille B' })
  ).json<CreatedInvitation>();

  const parent = device();
  await parent('POST', '/auth/register', {
    code,
    email: 'b@example.org',
    password: PASSWORD,
    familyName: 'B',
  });
  await parent('POST', '/children', { firstName: 'Léa', avatar: '🐱', grade: 'CE1' });

  // L'export : tout, sauf les mots de passe.
  const exported = await parent('GET', '/family/export');
  expect(exported.statusCode).toBe(200);
  expect(exported.headers['content-disposition']).toMatch(/attachment; filename=/);
  const data = exported.json();
  expect(data).toMatchObject({
    family: { name: 'B' },
    parents: [{ email: 'b@example.org', role: 'parent' }],
    children: [{ firstName: 'Léa', attempts: [], evaluations: [] }],
  });
  expect(exported.body).not.toContain('argon2');

  // La suppression demande le mot de passe ; la famille de l'administrateur reste.
  expect((await parent('DELETE', '/family', { password: 'pas-le-bon' })).statusCode).toBe(401);
  expect((await admin('DELETE', '/family', { password: PASSWORD })).statusCode).toBe(403);
  const deleted = await parent('DELETE', '/family', { password: PASSWORD });
  expect(deleted.statusCode).toBe(200);
  expect((await parent('GET', '/auth/me')).statusCode).toBe(401);
  // On ne peut plus se reconnecter.
  expect(
    (await parent('POST', '/auth/login', { email: 'b@example.org', password: PASSWORD }))
      .statusCode,
  ).toBe(401);
  expect((await admin('GET', '/auth/me')).statusCode).toBe(200);
  await app.close();
});
