import type {
  ClassroomDto,
  CreatedInvitation,
  MeResponse,
  PupilCode,
  PupilDto,
  ResetPreview,
} from '@app/core';
import { afterEach, expect, it, vi } from 'vitest';
import { buildApp } from './app';
import { loadConfig } from './config';
import { openDb } from './db/client';
import { ensureAdminInvitation } from './services/invitations';

const ADMIN_CODE = 'TEST-ADMN-CODE';
const PASSWORD = 'motdepasse-solide';
const NEW_PASSWORD = 'nouveau-mot-de-passe';

let app: Awaited<ReturnType<typeof buildApp>>;

afterEach(async () => {
  vi.useRealTimers();
  await app?.close();
});

async function setup() {
  const db = openDb(':memory:');
  ensureAdminInvitation(db, ADMIN_CODE);
  app = await buildApp(
    { ...loadConfig({}), webDist: null, cookieSecure: false, authAttemptsPerIp: 1000 },
    db,
    { logger: false },
  );
}

/** Un navigateur : garde le cookie de session entre les requêtes. */
class Browser {
  cookie = '';
  async send(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', url: string, body?: unknown) {
    const res = await app.inject({
      method,
      url: `/api${url}`,
      payload: body as never,
      headers: this.cookie ? { cookie: this.cookie } : {},
    });
    const session = res.cookies.find((c) => c.name === 'wam_sid');
    if (session) this.cookie = `wam_sid=${session.value}`;
    return res;
  }
  async ok<T>(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', url: string, body?: unknown) {
    const res = await this.send(method, url, body);
    expect(res.statusCode, `${method} ${url} : ${res.body}`).toBe(200);
    return res.json<T>();
  }
}

async function register(code: string, email: string) {
  const browser = new Browser();
  const me = await browser.ok<MeResponse>('POST', '/auth/register', {
    code,
    email,
    password: PASSWORD,
  });
  return { browser, me };
}

const login = (email: string, password: string) =>
  new Browser().send('POST', '/auth/login', { email, password });

/** Une école, sa directrice, une enseignante et un élève, Léo, rattaché à sa famille. */
async function schoolWithPupil() {
  await setup();
  const admin = (await register(ADMIN_CODE, 'admin@example.org')).browser;
  const school = await admin.ok<{ id: number; invitation: CreatedInvitation }>(
    'POST',
    '/admin/schools',
    { name: 'École des Tilleuls' },
  );
  const direction = await register(school.invitation.code, 'directrice@example.org');
  const invite = await direction.browser.ok<CreatedInvitation>(
    'POST',
    `/schools/${school.id}/invitations`,
    {},
  );
  const teacher = await register(invite.code, 'enseignante@example.org');
  const classroom = await teacher.browser.ok<ClassroomDto>(
    'POST',
    `/schools/${school.id}/classes`,
    { name: 'CE1 B', grades: ['CE1'] },
  );
  const [leo, zoe] = await teacher.browser.ok<PupilDto[]>(
    'POST',
    `/classes/${classroom.id}/pupils`,
    { pupils: [{ firstName: 'Léo' }, { firstName: 'Zoé' }] },
  );
  const [code] = await teacher.browser.ok<PupilCode[]>(
    'POST',
    `/classes/${classroom.id}/pupil-codes`,
    { pupilIds: [leo!.id] },
  );
  const parent = await register(code!.code, 'parent@example.org');
  return { admin, school, direction, teacher, leo: leo!, zoe: zoe!, parent };
}

it('fiche de la direction : nouveau mot de passe, sessions fermées, code à usage unique', async () => {
  const { direction, teacher, leo, zoe, parent } = await schoolWithPupil();

  // Seule la direction imprime la fiche, et seulement pour un élève rattaché à une famille.
  expect((await teacher.browser.send('POST', `/pupils/${leo.id}/parent-reset`)).statusCode).toBe(
    403,
  );
  expect(
    (await direction.browser.send('POST', `/pupils/${zoe.id}/parent-reset`)).json().error,
  ).toBe('not_linked');
  const { code } = await direction.browser.ok<CreatedInvitation>(
    'POST',
    `/pupils/${leo.id}/parent-reset`,
  );

  const visitor = new Browser();
  expect(await visitor.ok<ResetPreview>('POST', '/auth/reset/preview', { code })).toEqual({
    schoolName: 'École des Tilleuls',
    pupil: { firstName: 'Léo' },
  });
  // Une adresse qui n'est pas celle d'un parent de la famille : refusée.
  const wrong = await visitor.send('POST', '/auth/reset', {
    code,
    email: 'enseignante@example.org',
    password: NEW_PASSWORD,
  });
  expect(wrong.json().error).toBe('reset_email_mismatch');

  const me = await visitor.ok<MeResponse>('POST', '/auth/reset', {
    code: code.toLowerCase(),
    email: 'Parent@Example.org',
    password: NEW_PASSWORD,
  });
  expect(me.user.email).toBe('parent@example.org');
  expect(me.children.map((c) => c.firstName)).toEqual(['Léo']);
  // L'ancien appareil est déconnecté ; l'ancien mot de passe ne marche plus.
  expect((await parent.browser.send('GET', '/auth/me')).statusCode).toBe(401);
  expect((await login('parent@example.org', PASSWORD)).statusCode).toBe(401);
  expect((await login('parent@example.org', NEW_PASSWORD)).statusCode).toBe(200);
  // Le code ne sert qu'une fois.
  expect(
    (
      await visitor.send('POST', '/auth/reset', {
        code,
        email: 'parent@example.org',
        password: 'encore-un-autre',
      })
    ).json().error,
  ).toBe('invalid_reset');
});

it('le second parent de la famille utilise aussi la fiche', async () => {
  const { direction, leo, parent } = await schoolWithPupil();
  await parent.browser.ok('POST', '/auth/unlock', { password: PASSWORD });
  const { code: familyCode } = await parent.browser.ok<CreatedInvitation>(
    'POST',
    '/family/invitations',
  );
  await register(familyCode, 'second@example.org');
  const { code } = await direction.browser.ok<CreatedInvitation>(
    'POST',
    `/pupils/${leo.id}/parent-reset`,
  );
  await new Browser().ok('POST', '/auth/reset', {
    code,
    email: 'second@example.org',
    password: NEW_PASSWORD,
  });
  expect((await login('second@example.org', NEW_PASSWORD)).statusCode).toBe(200);
  // Le premier parent n'est pas touché.
  expect((await login('parent@example.org', PASSWORD)).statusCode).toBe(200);
});

it('la fiche d’une école ne donne pas la main sur un compte d’enseignant', async () => {
  const { admin, direction, school, leo, parent } = await schoolWithPupil();
  // Le parent de Léo devient aussi enseignant de l'école.
  const invite = await direction.browser.ok<CreatedInvitation>(
    'POST',
    `/schools/${school.id}/invitations`,
    {},
  );
  await parent.browser.ok('POST', '/auth/unlock', { password: PASSWORD });
  await parent.browser.ok('POST', '/auth/redeem', { code: invite.code });
  const { code } = await direction.browser.ok<CreatedInvitation>(
    'POST',
    `/pupils/${leo.id}/parent-reset`,
  );
  const refused = await new Browser().send('POST', '/auth/reset', {
    code,
    email: 'parent@example.org',
    password: NEW_PASSWORD,
  });
  expect(refused.json().error).toBe('reset_needs_admin');
  // L'administrateur, lui, peut.
  const { code: adminCode } = await admin.ok<CreatedInvitation>('POST', '/admin/password-resets', {
    email: 'parent@example.org',
  });
  await new Browser().ok('POST', '/auth/reset', {
    code: adminCode,
    email: 'parent@example.org',
    password: NEW_PASSWORD,
  });
  expect((await login('parent@example.org', NEW_PASSWORD)).statusCode).toBe(200);
});

it('administrateur : un code pour un compte ; une autre école ne voit pas l’élève', async () => {
  const { admin, direction, teacher, leo } = await schoolWithPupil();
  expect(
    (
      await direction.browser.send('POST', '/admin/password-resets', {
        email: 'enseignante@example.org',
      })
    ).statusCode,
  ).toBe(403);
  expect(
    (await admin.send('POST', '/admin/password-resets', { email: 'inconnu@example.org' })).json()
      .error,
  ).toBe('account_not_found');
  const { code } = await admin.ok<CreatedInvitation>('POST', '/admin/password-resets', {
    email: 'enseignante@example.org',
  });
  expect(await new Browser().ok<ResetPreview>('POST', '/auth/reset/preview', { code })).toEqual({
    schoolName: null,
    pupil: null,
  });
  // Le code d'un compte ne vaut que pour ce compte.
  expect(
    (
      await new Browser().send('POST', '/auth/reset', {
        code,
        email: 'directrice@example.org',
        password: NEW_PASSWORD,
      })
    ).json().error,
  ).toBe('reset_email_mismatch');
  await new Browser().ok('POST', '/auth/reset', {
    code,
    email: 'enseignante@example.org',
    password: NEW_PASSWORD,
  });
  expect((await teacher.browser.send('GET', '/auth/me')).statusCode).toBe(401);

  const other = await admin.ok<{ invitation: CreatedInvitation }>('POST', '/admin/schools', {
    name: 'Autre école',
  });
  const stranger = await register(other.invitation.code, 'autre@example.org');
  expect((await stranger.browser.send('POST', `/pupils/${leo.id}/parent-reset`)).statusCode).toBe(
    404,
  );
});

it('une fiche remplace la précédente, expire après 14 jours, et limite les essais', async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-04T08:00:00Z'));
  const { direction, leo } = await schoolWithPupil();
  const { code: lost } = await direction.browser.ok<CreatedInvitation>(
    'POST',
    `/pupils/${leo.id}/parent-reset`,
  );
  const { code } = await direction.browser.ok<CreatedInvitation>(
    'POST',
    `/pupils/${leo.id}/parent-reset`,
  );
  const visitor = new Browser();
  const attempt = (email: string, c = code) =>
    visitor.send('POST', '/auth/reset', { code: c, email, password: NEW_PASSWORD });
  // La fiche perdue ne marche plus.
  expect((await attempt('parent@example.org', lost)).json().error).toBe('invalid_reset');
  // On ne peut pas essayer les adresses à la chaîne.
  for (let i = 0; i < 10; i++)
    expect((await attempt(`essai${i}@example.org`)).statusCode).toBe(400);
  expect((await attempt('parent@example.org')).statusCode).toBe(429);
  // Quinze jours plus tard, la fiche a expiré.
  vi.setSystemTime(new Date('2026-11-19T08:00:00Z'));
  expect((await attempt('parent@example.org')).json().error).toBe('invalid_reset');
});
