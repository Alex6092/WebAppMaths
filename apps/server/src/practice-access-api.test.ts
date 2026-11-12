import { registry } from '@app/content';
import {
  dayKey,
  generateQuestion,
  getWidget,
  type ChildReport,
  type ChildStateResponse,
  type ReviewItem,
  type StartSessionRequest,
  type StartSessionResponse,
} from '@app/core';
import { expect, it } from 'vitest';
import { buildApp } from './app';
import { loadConfig } from './config';
import { openDb } from './db/client';
import { ensureAdminInvitation } from './services/invitations';

it('applique les notions cochées en autonomie sur tous les appareils et conserve les activités données', async () => {
  const db = openDb(':memory:');
  ensureAdminInvitation(db, 'TEST-ADMN-CODE');
  const app = await buildApp({ ...loadConfig({}), webDist: null, cookieSecure: false }, db, {
    logger: false,
  });
  const device = () => {
    let cookie = '';
    return async (method: 'GET' | 'POST' | 'PATCH', path: string, payload?: unknown) => {
      const res = await app.inject({
        method,
        url: `/api${path}`,
        payload: payload as never,
        headers: cookie ? { cookie } : {},
      });
      const sid = res.cookies.find((entry) => entry.name === 'wam_sid');
      if (sid) cookie = `wam_sid=${sid.value}`;
      return res;
    };
  };
  const parent = device();
  const pupil = device();
  const credentials = { email: 'parent@example.org', password: 'motdepasse-solide' };
  const letterP = 'francais.orthographe.lettre-p';
  const decoder = 'francais.lecture.decoder';
  const audio = 'francais.lecture.ecoute-touche-p';
  const tables = 'maths.calcul.tables';
  const start = (request: StartSessionRequest) => pupil('POST', '/child/sessions', request);
  const training = (pluginId: string) => start({ mode: 'training', selection: { pluginId } });
  const daily = () => start({ mode: 'daily', selection: {} });
  const review = () => start({ mode: 'review', selection: {} });
  const mix = (notions: string[]) => start({ mode: 'mix', selection: { notions } });
  const state = async () => (await pupil('GET', '/child/state')).json<ChildStateResponse>();
  function play(sessionId: number, item: ReviewItem, mistake = false) {
    const plugin = registry.plugin(item.pluginId)!;
    const q = generateQuestion(plugin, item.level, item.seed);
    const right = plugin.solve(q);
    return pupil('POST', '/child/attempts', {
      ...item,
      sessionId,
      pluginVersion: plugin.version,
      answers: mistake ? [getWidget(q.widget).emptyAnswer(q as never), right] : [right],
      durationMs: 1000,
    });
  }

  try {
    expect(
      (await parent('POST', '/auth/register', { ...credentials, code: 'test-admn-code' }))
        .statusCode,
    ).toBe(200);
    const { id: childId } = (
      await parent('POST', '/children', { firstName: 'Lou', avatar: '🐱', grade: 'CE1' })
    ).json<{ id: number }>();
    const { id: younger } = (
      await parent('POST', '/children', { firstName: 'Léo', avatar: '🐱', grade: 'CP' })
    ).json<{ id: number }>();
    const setNotion = async (notionId: string, active: boolean) => {
      const result = await parent('PATCH', `/children/${childId}/notions`, { notionId, active });
      expect(result.statusCode).toBe(200);
    };

    expect((await pupil('POST', '/auth/login', credentials)).statusCode).toBe(200);
    await pupil('POST', '/auth/active-child', { childId: younger });
    expect((await training(tables)).statusCode).toBe(403);
    await pupil('POST', '/auth/active-child', { childId });

    const { id: audioSession } = (await training(audio)).json<StartSessionResponse>();
    const audioItem = { pluginId: audio, level: 1, seed: 10 };
    expect((await play(audioSession, audioItem, true)).statusCode).toBe(200);
    const previousReview = (await review()).json<StartSessionResponse>();
    expect(previousReview.items).toContainEqual(audioItem);

    const beforeMix = (await mix([decoder, tables])).json<StartSessionResponse>();
    expect(beforeMix.pluginIds).toContain(audio);
    const beforeDaily = (await daily()).json<StartSessionResponse>();
    expect((await play(beforeDaily.id, { pluginId: tables, level: 1, seed: 12 })).statusCode).toBe(
      200,
    );
    const before = await state();

    await setNotion(letterP, false);
    const denied = await training(audio);
    expect(denied.statusCode).toBe(403);
    expect(denied.json().error).toBe('practice_unavailable');
    for (const id of [audioSession, beforeMix.id, beforeDaily.id, previousReview.id]) {
      const reply = await play(id, { ...audioItem, seed: id === previousReview.id ? 10 : 20 });
      expect(reply.statusCode).toBe(403);
      expect(reply.json().error).toBe('practice_unavailable');
    }
    const after = await state();
    expect(after.child.coins).toBe(before.child.coins);
    expect(after.notions[letterP]).toEqual(before.notions[letterP]);
    expect(after.activeNotions).toContain(decoder);
    expect(after.mistakes).toBe(0);
    expect((await review()).json().error).toBe('nothing_to_review');
    const report = (await parent('GET', `/children/${childId}/report`)).json<ChildReport>();
    expect(report.mistakes.some(({ pluginId }) => pluginId === audio)).toBe(true);

    const nextMix = (await mix([letterP, decoder, tables])).json<StartSessionResponse>();
    expect(nextMix.notions).toEqual([decoder, tables]);
    expect(nextMix.pluginIds).toContain(tables);
    expect(nextMix.pluginIds).not.toContain(audio);
    expect((await mix([letterP])).statusCode).toBe(403);
    const nextDaily = (await daily()).json<StartSessionResponse>();
    expect(nextDaily).toMatchObject({ id: beforeDaily.id, answered: 1 });
    expect(nextDaily.pluginIds).not.toContain(audio);

    const assignment = await parent('POST', `/children/${childId}/assignments`, {
      title: 'Lettre p',
      notions: [letterP],
      questions: 3,
      dueOn: dayKey(new Date()),
    });
    expect(assignment.statusCode).toBe(200);
    const assigned = (
      await start({
        mode: 'homework',
        selection: { assignmentId: assignment.json().id },
      })
    ).json<StartSessionResponse>();
    expect((await play(assigned.id, { ...audioItem, seed: 30 })).statusCode).toBe(200);

    const evaluation = await parent('POST', `/children/${childId}/evaluations`, {
      title: 'Lettre p',
      notions: [letterP],
      perNotion: 3,
    });
    expect(evaluation.statusCode).toBe(200);
    const evaluated = (
      await start({
        mode: 'evaluation',
        selection: { evaluationId: evaluation.json().id },
      })
    ).json<StartSessionResponse>();
    expect((await play(evaluated.id, evaluated.items![0]!)).statusCode).toBe(200);

    for (const notionId of after.activeNotions) await setNotion(notionId, false);
    expect((await state()).activeNotions).toEqual([]);
    expect((await mix([decoder, tables])).statusCode).toBe(403);
    expect((await daily()).statusCode).toBe(403);
    await setNotion(letterP, true);
    expect((await training(audio)).statusCode).toBe(403);
    await setNotion(decoder, true);
    expect((await training(audio)).statusCode).toBe(200);
    expect((await review()).json<StartSessionResponse>().items).toContainEqual(audioItem);
    expect((await daily()).json<StartSessionResponse>()).toMatchObject({
      id: beforeDaily.id,
      answered: 1,
    });
  } finally {
    await app.close();
  }
});
