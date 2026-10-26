import { registry } from '@app/content';
import { generateQuestion, getWidget } from '@app/core';
import { expect, it } from 'vitest';
import { buildApp } from './app';
import { loadConfig } from './config';
import { openDb } from './db/client';
import { ensureAdminInvitation } from './services/invitations';

it('chaque exercice, chaque niveau : le serveur enregistre les tentatives', async () => {
  const db = openDb(':memory:');
  ensureAdminInvitation(db, 'TEST-ADMN-CODE');
  const app = await buildApp({ ...loadConfig({}), webDist: null, cookieSecure: false }, db, {
    logger: false,
  });
  let cookie = '';
  // Une adresse par exercice : le test envoie plus de tentatives que la limite par minute
  // d'une seule adresse (600), ce qu'aucun enfant ne fait.
  let address = '127.0.0.1';
  const send = async (method: 'GET' | 'POST', url: string, body?: unknown) => {
    const res = await app.inject({
      method,
      url: `/api${url}`,
      payload: body as never,
      headers: cookie ? { cookie } : {},
      remoteAddress: address,
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

  const failures: string[] = [];
  let seed = 1;
  for (const [i, plugin] of registry.plugins.entries()) {
    address = `10.0.${Math.floor(i / 250)}.${(i % 250) + 1}`;
    const session = (
      await send('POST', '/child/sessions', {
        mode: 'training',
        selection: { pluginId: plugin.id },
      })
    ).json<{ id: number }>();
    for (let level = 1; level <= plugin.levels.length; level++) {
      for (let k = 0; k < 3; k++) {
        seed += 7919;
        const q = generateQuestion(plugin, level, seed);
        const good = plugin.solve(q);
        const bad = getWidget(q.widget).emptyAnswer(q as never);
        const answers = k % 3 === 0 ? [good] : k % 3 === 1 ? [bad, good] : [bad, bad];
        const res = await send('POST', '/child/attempts', {
          sessionId: session.id,
          pluginId: plugin.id,
          pluginVersion: plugin.version,
          level,
          seed,
          answers: JSON.parse(JSON.stringify(answers)),
          durationMs: 1000,
        });
        if (res.statusCode !== 200)
          failures.push(`${plugin.id} niv ${level} graine ${seed} : ${res.statusCode} ${res.body}`);
      }
    }
  }
  await app.close();
  expect(failures).toEqual([]);
}, 120_000);
