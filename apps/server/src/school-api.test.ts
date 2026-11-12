import { registry } from '@app/content';
import {
  schoolYearOf,
  dayKey,
  generateQuestion,
  type AdminSchoolDto,
  type ChildReport,
  type ChildStateResponse,
  type ClassAssessmentDto,
  type ClassAssignmentDto,
  type ClassOverview,
  type ClassroomDetail,
  type ClassroomDto,
  type CreatedInvitation,
  type InvitationPreview,
  type MeResponse,
  type PupilCode,
  type PupilDto,
  type RolloverDto,
  type RolloverResult,
  type SchoolDto,
} from '@app/core';
import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from './app';
import { loadConfig } from './config';
import { openDb } from './db/client';
import { ensureAdminInvitation } from './services/invitations';

const ADMIN_CODE = 'TEST-ADMN-CODE';
const PASSWORD = 'motdepasse-solide';

let app: Awaited<ReturnType<typeof buildApp>>;

afterEach(async () => {
  await app?.close();
});

async function setup() {
  const db = openDb(':memory:');
  ensureAdminInvitation(db, ADMIN_CODE);
  app = await buildApp(
    { ...loadConfig({}), webDist: null, cookieSecure: false, authAttempts: 1000 },
    db,
    { logger: false },
  );
}

/** Un navigateur : garde le cookie de session entre les requêtes. */
class Browser {
  cookie = '';
  async send(method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE', url: string, body?: unknown) {
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
  /** La requête doit réussir ; renvoie le JSON. */
  async ok<T>(method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE', url: string, body?: unknown) {
    const res = await this.send(method, url, body);
    expect(res.statusCode, `${method} ${url} : ${res.body}`).toBe(200);
    return res.json<T>();
  }
}

async function register(code: string, email: string, familyName?: string) {
  const browser = new Browser();
  const me = await browser.ok<MeResponse>('POST', '/auth/register', {
    code,
    email,
    password: PASSWORD,
    ...(familyName ? { familyName } : {}),
  });
  return { browser, me };
}

/** L'admin, une école, sa directrice et une enseignante avec une classe de CE1. */
async function schoolWithClass() {
  await setup();
  const admin = (await register(ADMIN_CODE, 'admin@example.org', 'Famille Admin')).browser;
  const created = await admin.ok<{ id: number; invitation: CreatedInvitation }>(
    'POST',
    '/admin/schools',
    { name: 'École des Tilleuls', city: 'Lyon' },
  );
  const schoolId = created.id;
  const direction = await register(created.invitation.code, 'directrice@example.org');
  const invite = await direction.browser.ok<CreatedInvitation>(
    'POST',
    `/schools/${schoolId}/invitations`,
    { role: 'enseignant', note: 'Mme Martin' },
  );
  const teacher = await register(invite.code, 'enseignante@example.org');
  const classroom = await teacher.browser.ok<ClassroomDto>('POST', `/schools/${schoolId}/classes`, {
    name: 'CE1 B',
    grades: ['CE1'],
  });
  return { admin, schoolId, direction, teacher, classroom };
}

describe('établissements et enseignants', () => {
  it('l’admin crée une école ; direction et enseignant ont un compte sans famille', async () => {
    const { admin, schoolId, direction, teacher, classroom } = await schoolWithClass();

    expect(direction.me.family).toBeNull();
    expect(direction.me.children).toEqual([]);
    expect(direction.me.schools).toEqual([
      { id: schoolId, name: 'École des Tilleuls', role: 'direction', classes: [] },
    ]);
    // Un compte sans famille ne se verrouille pas : l'espace école reste ouvert.
    expect((await direction.browser.send('POST', '/auth/lock')).statusCode).toBe(200);
    expect((await direction.browser.send('GET', `/schools/${schoolId}`)).statusCode).toBe(200);
    // Mais les routes de la famille lui sont fermées.
    expect((await direction.browser.send('GET', '/family/export')).json().error).toBe('no_family');

    // La classe créée par l'enseignante est la sienne ; la direction les voit toutes.
    const me = await teacher.browser.ok<MeResponse>('GET', '/auth/me');
    expect(me.schools[0]).toMatchObject({
      role: 'enseignant',
      classes: [{ id: classroom.id, name: 'CE1 B' }],
    });
    const school = await direction.browser.ok<SchoolDto>('GET', `/schools/${schoolId}`);
    expect(school.members.map((m) => [m.email, m.role, m.classIds])).toEqual([
      ['directrice@example.org', 'direction', []],
      ['enseignante@example.org', 'enseignant', [classroom.id]],
    ]);
    expect(school.classes).toMatchObject([{ name: 'CE1 B', pupils: 0, grades: ['CE1'] }]);

    // Seule la direction invite ; l'enseignante ne voit pas les invitations.
    expect(
      (await teacher.browser.send('POST', `/schools/${schoolId}/invitations`, {})).statusCode,
    ).toBe(403);
    expect(
      (await teacher.browser.ok<SchoolDto>('GET', `/schools/${schoolId}`)).invitations,
    ).toEqual([]);
    // La dernière direction ne peut pas être retirée.
    const directionId = direction.me.user.id;
    expect(
      (await direction.browser.send('DELETE', `/schools/${schoolId}/members/${directionId}`))
        .statusCode,
    ).toBe(409);

    // L'admin voit l'école dans sa liste.
    const schools = await admin.ok<AdminSchoolDto[]>('GET', '/admin/schools');
    expect(schools).toMatchObject([{ name: 'École des Tilleuls', members: 2, classes: 1 }]);
  });

  it('cloisonnement : une autre école, une autre classe ne sont pas visibles', async () => {
    const { admin, schoolId, direction, teacher, classroom } = await schoolWithClass();
    // Une deuxième enseignante, sans classe, dans la même école.
    const invite = await direction.browser.ok<CreatedInvitation>(
      'POST',
      `/schools/${schoolId}/invitations`,
      {},
    );
    const colleague = await register(invite.code, 'collegue@example.org');
    expect((await colleague.browser.send('GET', `/classes/${classroom.id}`)).statusCode).toBe(404);
    const [pupil] = await teacher.browser.ok<PupilDto[]>(
      'POST',
      `/classes/${classroom.id}/pupils`,
      { pupils: [{ firstName: 'Léo', lastName: 'M.' }] },
    );
    expect((await colleague.browser.send('GET', `/pupils/${pupil!.id}/report`)).statusCode).toBe(
      404,
    );
    // La direction y a accès.
    expect((await direction.browser.send('GET', `/pupils/${pupil!.id}/report`)).statusCode).toBe(
      200,
    );
    // Une autre école : rien n'est visible.
    const other = await admin.ok<{ invitation: CreatedInvitation }>('POST', '/admin/schools', {
      name: 'Autre école',
    });
    const stranger = await register(other.invitation.code, 'autre@example.org');
    expect((await stranger.browser.send('GET', `/schools/${schoolId}`)).statusCode).toBe(404);
    expect((await stranger.browser.send('GET', `/classes/${classroom.id}`)).statusCode).toBe(404);
    expect((await stranger.browser.send('DELETE', `/pupils/${pupil!.id}`)).statusCode).toBe(404);
    // Ni par l'espace parent.
    expect((await stranger.browser.send('GET', `/children/${pupil!.id}/report`)).statusCode).toBe(
      403,
    );
  });

  it('un parent déjà inscrit devient enseignant avec le même compte', async () => {
    const { schoolId, direction } = await schoolWithClass();
    const admin = new Browser();
    // Le parent : invité par l'admin comme famille.
    await admin.ok('POST', '/auth/login', { email: 'admin@example.org', password: PASSWORD });
    const familyCode = await admin.ok<CreatedInvitation>('POST', '/admin/invitations', {});
    const parent = await register(familyCode.code, 'parent-prof@example.org', 'Famille P');
    const invite = await direction.browser.ok<CreatedInvitation>(
      'POST',
      `/schools/${schoolId}/invitations`,
      {},
    );
    const me = await parent.browser.ok<MeResponse>('POST', '/auth/redeem', { code: invite.code });
    expect(me.family?.name).toBe('Famille P');
    expect(me.schools).toMatchObject([{ id: schoolId, role: 'enseignant' }]);
    // Le code a servi.
    expect(
      (await parent.browser.send('POST', '/auth/redeem', { code: invite.code })).statusCode,
    ).toBe(400);
  });
});

describe('élèves et fiches parents', () => {
  it('fiche parent : nouveau compte, frères et sœurs, fusion avec un profil existant', async () => {
    const { teacher, classroom, direction, schoolId } = await schoolWithClass();
    const pupils = await teacher.browser.ok<PupilDto[]>('POST', `/classes/${classroom.id}/pupils`, {
      pupils: [
        { firstName: 'Léo', lastName: 'M.' },
        { firstName: 'Zoé', lastName: 'D.' },
        { firstName: 'Inès', lastName: 'D.' },
      ],
    });
    expect(pupils.map((p) => [p.firstName, p.grade, p.linked])).toEqual([
      ['Léo', 'CE1', false],
      ['Zoé', 'CE1', false],
      ['Inès', 'CE1', false],
    ]);
    expect(new Set(pupils.map((p) => p.avatar)).size).toBe(3);
    const [leo, zoe, ines] = pupils as [PupilDto, PupilDto, PupilDto];
    // Inès est en CE2 dans une autre classe de l'école (classe double niveau).
    const ce2 = await direction.browser.ok<ClassroomDto>('POST', `/schools/${schoolId}/classes`, {
      name: 'CE1-CE2',
      grades: ['CE1', 'CE2'],
      teacherIds: [teacher.me.user.id],
    });
    await teacher.browser.ok('PATCH', `/pupils/${ines.id}`, { classId: ce2.id, grade: 'CE2' });

    const codes = await teacher.browser.ok<PupilCode[]>(
      'POST',
      `/classes/${classroom.id}/pupil-codes`,
      {},
    );
    expect(codes.map((c) => c.pupilId)).toEqual([leo.id, zoe.id]);
    const codeOf = (id: number, list = codes) => list.find((c) => c.pupilId === id)!.code;
    const [inesCode] = await teacher.browser.ok<PupilCode[]>(
      'POST',
      `/classes/${ce2.id}/pupil-codes`,
      {},
    );
    // Réimprimer la fiche de Léo : l'ancien code ne marche plus.
    const reprinted = await teacher.browser.ok<PupilCode[]>(
      'POST',
      `/classes/${classroom.id}/pupil-codes`,
      { pupilIds: [leo.id] },
    );
    const visitor = new Browser();
    expect(
      (await visitor.send('POST', '/auth/invitation', { code: codeOf(leo.id) })).statusCode,
    ).toBe(400);
    const preview = await visitor.ok<InvitationPreview>('POST', '/auth/invitation', {
      code: codeOf(leo.id, reprinted),
    });
    expect(preview).toEqual({
      kind: 'eleve',
      schoolName: 'École des Tilleuls',
      pupil: { firstName: 'Léo', className: 'CE1 B' },
    });

    // 1) Les parents de Léo créent leur compte avec la fiche.
    const leoParents = await register(codeOf(leo.id, reprinted), 'leo@example.org', 'Famille M');
    expect(leoParents.me.children).toMatchObject([
      {
        id: leo.id,
        firstName: 'Léo',
        classroom: { id: classroom.id, name: 'CE1 B', schoolName: 'École des Tilleuls' },
      },
    ]);
    expect(
      (await teacher.browser.ok<ClassroomDetail>('GET', `/classes/${classroom.id}`)).pupilList.find(
        (p) => p.id === leo.id,
      ),
    ).toMatchObject({ linked: true, codeIssuedAt: null });

    // 2) La famille D. avait déjà un profil pour Zoé à la maison, avec du travail fait.
    const admin = new Browser();
    await admin.ok('POST', '/auth/login', { email: 'admin@example.org', password: PASSWORD });
    const familyCode = await admin.ok<CreatedInvitation>('POST', '/admin/invitations', {});
    const dParents = await register(familyCode.code, 'd@example.org', 'Famille D');
    const homeZoe = await dParents.browser.ok<{ id: number }>('POST', '/children', {
      firstName: 'Zoé',
      avatar: '🐱',
      grade: 'CE2',
    });
    await dParents.browser.ok('PATCH', `/children/${homeZoe.id}`, { coins: 30 });
    await dParents.browser.ok('POST', '/auth/active-child', { childId: homeZoe.id });
    const pluginId = registry.pluginsOfNotion('maths.calcul.tables')[0]!.id;
    const plugin = registry.plugin(pluginId)!;
    const session = await dParents.browser.ok<{ id: number }>('POST', '/child/sessions', {
      mode: 'training',
      selection: { pluginId },
    });
    const q = generateQuestion(plugin, 1, 7);
    await dParents.browser.ok('POST', '/child/attempts', {
      sessionId: session.id,
      pluginId,
      pluginVersion: plugin.version,
      level: 1,
      seed: 7,
      answers: [plugin.solve(q)],
      durationMs: 1000,
    });
    const coins = (await dParents.browser.ok<ChildStateResponse>('GET', '/child/state')).child
      .coins;
    expect(coins).toBeGreaterThan(30);
    // Choisir un profil verrouille l'espace parent : il faut le rouvrir.
    expect(
      (await dParents.browser.send('POST', '/auth/redeem', { code: codeOf(zoe.id) })).json().error,
    ).toBe('parent_locked');
    await dParents.browser.ok('POST', '/auth/unlock', { password: PASSWORD });
    const merged = await dParents.browser.ok<MeResponse>('POST', '/auth/redeem', {
      code: codeOf(zoe.id),
      mergeInto: homeZoe.id,
    });
    // Un seul profil : celui de la maison, inscrit dans la classe, au niveau de l'école.
    expect(merged.children).toMatchObject([
      { id: homeZoe.id, firstName: 'Zoé', grade: 'CE1', coins, classroom: { id: classroom.id } },
    ]);
    // Inès, la sœur, rejoint la même famille comme nouveau profil.
    const both = await dParents.browser.ok<MeResponse>('POST', '/auth/redeem', {
      code: inesCode!.code,
    });
    expect(both.children.map((c) => [c.firstName, c.classroom?.name])).toEqual([
      ['Inès', 'CE1-CE2'],
      ['Zoé', 'CE1 B'],
    ]);
    // L'enseignante voit le travail fait à la maison par Zoé, dans la classe.
    const detail = await teacher.browser.ok<ClassroomDetail>('GET', `/classes/${classroom.id}`);
    expect(detail.pupilList.map((p) => [p.id, p.firstName, p.linked])).toEqual([
      [leo.id, 'Léo', true],
      [homeZoe.id, 'Zoé', true],
    ]);
    const report = await teacher.browser.ok<ChildReport>('GET', `/pupils/${homeZoe.id}/report`);
    expect(report.days.at(-1)?.questions).toBe(1);

    // La famille ne change pas la classe d'un élève inscrit, et « supprimer » le détache.
    expect(
      (await dParents.browser.send('PATCH', `/children/${homeZoe.id}`, { grade: 'CE2' })).json()
        .error,
    ).toBe('grade_set_by_school');
    const removed = await dParents.browser.ok<{ detached: boolean }>(
      'DELETE',
      `/children/${homeZoe.id}`,
    );
    expect(removed.detached).toBe(true);
    const after = await teacher.browser.ok<ClassroomDetail>('GET', `/classes/${classroom.id}`);
    expect(after.pupilList.find((p) => p.id === homeZoe.id)).toMatchObject({ linked: false });

    // L'école retire Léo (il a une famille : il lui reste) et Zoé (sans famille : supprimée).
    expect(await teacher.browser.ok('DELETE', `/pupils/${leo.id}`)).toEqual({
      removed: 'detached',
    });
    expect(await teacher.browser.ok('DELETE', `/pupils/${homeZoe.id}`)).toEqual({
      removed: 'deleted',
    });
    const leoMe = await leoParents.browser.ok<MeResponse>('GET', '/auth/me');
    expect(leoMe.children).toMatchObject([{ id: leo.id, classroom: null }]);
  });

  it('supprimer la famille laisse l’élève à son école', async () => {
    const { teacher, classroom } = await schoolWithClass();
    const [pupil] = await teacher.browser.ok<PupilDto[]>(
      'POST',
      `/classes/${classroom.id}/pupils`,
      {
        pupils: [{ firstName: 'Léo' }],
      },
    );
    const [code] = await teacher.browser.ok<PupilCode[]>(
      'POST',
      `/classes/${classroom.id}/pupil-codes`,
      {},
    );
    const parents = await register(code!.code, 'leo@example.org');
    await parents.browser.ok('POST', '/children', { firstName: 'Bébé', avatar: '🐣', grade: 'CP' });
    await parents.browser.ok('DELETE', '/family', { password: PASSWORD });
    const detail = await teacher.browser.ok<ClassroomDetail>('GET', `/classes/${classroom.id}`);
    expect(detail.pupilList).toMatchObject([{ id: pupil!.id, linked: false }]);
  });
});

describe('travail de la classe', () => {
  it('notions de la classe, leçon en cours, devoirs, avis de l’enseignant, suivi', async () => {
    const { teacher, classroom, schoolId, admin } = await schoolWithClass();
    const [leo, zoe] = await teacher.browser.ok<PupilDto[]>(
      'POST',
      `/classes/${classroom.id}/pupils`,
      { pupils: [{ firstName: 'Léo' }, { firstName: 'Zoé' }] },
    );
    const codes = await teacher.browser.ok<PupilCode[]>(
      'POST',
      `/classes/${classroom.id}/pupil-codes`,
      {},
    );
    const parents = await register(codes[0]!.code, 'leo@example.org');
    await parents.browser.ok('POST', '/auth/active-child', { childId: leo!.id });

    // Notions vues : l'enseignante décoche la géométrie, sauf une notion.
    const geometry = registry.notionsInScope('maths.geometrie', 'CE1').map((n) => n.id);
    const { activeNotions } = await teacher.browser.ok<{ activeNotions: string[] }>(
      'PATCH',
      `/classes/${classroom.id}/notions`,
      { notionIds: geometry.slice(1), active: false },
    );
    expect(activeNotions).toContain(geometry[0]);
    expect(activeNotions).not.toContain(geometry[1]);
    // Leçon en cours.
    await teacher.browser.ok('PATCH', `/classes/${classroom.id}`, {
      focusNotions: ['maths.calcul.tables'],
    });
    // Un devoir pour toute la classe.
    const assignment = await teacher.browser.ok<ClassAssignmentDto>(
      'POST',
      `/classes/${classroom.id}/assignments`,
      {
        title: 'Tables de 2',
        notions: ['maths.calcul.tables'],
        questions: 5,
        dueOn: dayKey(new Date()),
      },
    );
    expect(assignment.pupils.map((p) => p.pupilId)).toEqual([leo!.id, zoe!.id]);
    // Une évaluation sur papier : Léo NA en tables, A en géométrie.
    const assessment = await teacher.browser.ok<ClassAssessmentDto>(
      'POST',
      `/classes/${classroom.id}/assessments`,
      {
        title: 'Évaluation de novembre',
        assessedOn: dayKey(new Date()),
        notions: ['maths.calcul.tables', geometry[0]],
        results: { [leo!.id]: { 'maths.calcul.tables': 'NA', [geometry[0]!]: 'A' } },
      },
    );
    expect(assessment.results[leo!.id]).toEqual({
      'maths.calcul.tables': 'NA',
      [geometry[0]!]: 'A',
    });

    // L'enfant, à la maison.
    const state = await parents.browser.ok<ChildStateResponse>('GET', '/child/state');
    expect(state.activeNotions).not.toContain(geometry[1]);
    const blockedPlugin = registry.pluginsOfNotion(geometry[1]!)[0]!.id;
    expect(
      (
        await parents.browser.send('POST', '/child/sessions', {
          mode: 'training',
          selection: { pluginId: blockedPlugin },
        })
      ).json().error,
    ).toBe('practice_unavailable');
    expect(state.focusNotions).toEqual(['maths.calcul.tables']);
    expect(state.toRework).toEqual(['maths.calcul.tables']);
    expect(state.assignments).toMatchObject([{ title: 'Tables de 2', from: 'ecole' }]);

    // Le parent : bilan avec l'avis de l'enseignant ; les notions et le devoir de l'école ne
    // se modifient pas depuis l'espace parent.
    await parents.browser.ok('POST', '/auth/unlock', { password: PASSWORD });
    const report = await parents.browser.ok<ChildReport>('GET', `/children/${leo!.id}/report`);
    expect(report.notionsSetBy).toBe('ecole');
    expect(report.focusNotions).toEqual(['maths.calcul.tables']);
    expect(report.assessments['maths.calcul.tables']).toEqual({
      result: 'NA',
      assessedOn: dayKey(new Date()),
      title: 'Évaluation de novembre',
    });
    expect(
      (
        await parents.browser.send('PATCH', `/children/${leo!.id}/notions`, {
          notionId: geometry[1],
          active: true,
        })
      ).json().error,
    ).toBe('notions_set_by_school');
    expect(
      (
        await parents.browser.send(
          'DELETE',
          `/children/${leo!.id}/assignments/${state.assignments[0]!.id}`,
        )
      ).json().error,
    ).toBe('school_assignment');

    // Correction de la saisie : Léo passe ECA.
    const corrected = await teacher.browser.ok<ClassAssessmentDto>(
      'PUT',
      `/classes/${classroom.id}/assessments/${assessment.batch}`,
      {
        title: 'Évaluation de novembre',
        assessedOn: dayKey(new Date()),
        notions: ['maths.calcul.tables'],
        results: { [leo!.id]: { 'maths.calcul.tables': 'ECA' } },
      },
    );
    expect(corrected.results[leo!.id]).toEqual({ 'maths.calcul.tables': 'ECA' });

    // Suivi de la classe et niveaux.
    const overview = await teacher.browser.ok<ClassOverview>(
      'GET',
      `/classes/${classroom.id}/overview`,
    );
    // Léo a un avis ECA sur la leçon en cours (les tables) : une notion à retravailler.
    expect(overview.pupils[0]).toMatchObject({
      toRework: 1,
      focusAssessments: {
        'maths.calcul.tables': { result: 'ECA', title: 'Évaluation de novembre' },
      },
    });
    expect(overview.pupils[1]).toMatchObject({ toRework: 0, focusAssessments: {} });
    expect(overview.pupils).toMatchObject([
      { pupilId: leo!.id, homeworkTotal: 1, homeworkDone: 0, questions7d: 0 },
      { pupilId: zoe!.id, homeworkTotal: 1 },
    ]);
    const levels = await teacher.browser.ok<Record<string, unknown>>(
      'GET',
      `/classes/${classroom.id}/levels`,
    );
    expect(Object.keys(levels)).toEqual([String(leo!.id), String(zoe!.id)]);
    const list = await teacher.browser.ok<ClassAssessmentDto[]>(
      'GET',
      `/classes/${classroom.id}/assessments`,
    );
    expect(list).toHaveLength(1);

    // Supprimer la classe : Léo reste à sa famille, sans le devoir de la classe ; Zoé disparaît.
    await teacher.browser.ok('DELETE', `/classes/${classroom.id}`);
    const after = await parents.browser.ok<ChildStateResponse>('GET', '/child/state');
    expect(after.child.classroom).toBeNull();
    expect(after.assignments).toEqual([]);
    expect(after.focusNotions).toEqual([]);
    expect(after.activeNotions).toContain(geometry[1]);
    // L'avis de l'enseignant reste dans l'historique de l'enfant.
    expect(after.toRework).toEqual(['maths.calcul.tables']);

    // L'admin supprime l'école : rien ne casse.
    await admin.ok('DELETE', `/admin/schools/${schoolId}`);
    expect((await teacher.browser.ok<MeResponse>('GET', '/auth/me')).schools).toEqual([]);
  });
});

describe('rentrée', () => {
  it('la direction répartit les élèves puis fait la rentrée', async () => {
    const { admin, schoolId, direction, teacher, classroom } = await schoolWithClass();
    const from = schoolYearOf(new Date());
    const start = Number(from.split('-')[0]);
    const to = `${start + 1}-${start + 2}`;
    const pupils = await teacher.browser.ok<PupilDto[]>('POST', `/classes/${classroom.id}/pupils`, {
      pupils: ['Léo', 'Jade', 'Zoé', 'Inès', 'Noah'].map((firstName) => ({ firstName })),
    });
    const [leo, jade, zoe, ines, noah] = pupils as [
      PupilDto,
      PupilDto,
      PupilDto,
      PupilDto,
      PupilDto,
    ];
    // Léo et Jade ont une famille.
    const codes = await teacher.browser.ok<PupilCode[]>(
      'POST',
      `/classes/${classroom.id}/pupil-codes`,
      { pupilIds: [leo.id, jade.id] },
    );
    const codeOf = (id: number) => codes.find((c) => c.pupilId === id)!.code;
    const leoParents = await register(codeOf(leo.id), 'leo@example.org');
    const jadeParents = await register(codeOf(jade.id), 'jade@example.org');
    // Un devoir de classe pas fini, et un avis de l'enseignante.
    await teacher.browser.ok('POST', `/classes/${classroom.id}/assignments`, {
      title: 'Tables',
      notions: ['maths.calcul.tables'],
      questions: 5,
      dueOn: dayKey(new Date()),
    });
    await teacher.browser.ok('POST', `/classes/${classroom.id}/assessments`, {
      title: 'Évaluation de juin',
      assessedOn: dayKey(new Date()),
      notions: ['maths.calcul.tables'],
      results: { [leo.id]: { 'maths.calcul.tables': 'A' } },
    });

    // Les classes de l'année suivante.
    const ce2 = await direction.browser.ok<ClassroomDto>('POST', `/schools/${schoolId}/classes`, {
      name: 'CE2 A',
      grades: ['CE2'],
      schoolYear: to,
      teacherIds: [teacher.me.user.id],
    });
    const mixed = await direction.browser.ok<ClassroomDto>('POST', `/schools/${schoolId}/classes`, {
      name: 'CE1-CE2',
      grades: ['CE1', 'CE2'],
      schoolYear: to,
    });
    expect(
      (
        await direction.browser.send('POST', `/schools/${schoolId}/classes`, {
          name: 'X',
          grades: ['CE1'],
          schoolYear: '2026-2030',
        })
      ).json().error,
    ).toBe('invalid_year');

    // Seule la direction prépare la rentrée.
    expect((await teacher.browser.send('GET', `/schools/${schoolId}/rollover`)).statusCode).toBe(
      403,
    );
    const empty = await direction.browser.ok<RolloverDto>('GET', `/schools/${schoolId}/rollover`);
    expect(empty).toMatchObject({ from, to });
    expect(empty.fromClasses).toHaveLength(1);
    expect(empty.fromClasses[0]!.pupils.map((p) => p.choice)).toEqual([
      null,
      null,
      null,
      null,
      null,
    ]);
    expect(empty.toClasses.map((c) => c.name)).toEqual(['CE1-CE2', 'CE2 A']);

    // Toute la classe en CE2 A (niveau suivant par défaut), puis les cas particuliers.
    const choose = (choices: unknown[]) =>
      direction.browser.send('PUT', `/schools/${schoolId}/rollover`, { choices });
    await choose(pupils.map((p) => ({ pupilId: p.id, classId: ce2.id })));
    await choose([
      { pupilId: noah.id, classId: mixed.id, grade: 'CE1' }, // maintenu en CE1
      { pupilId: jade.id, leaves: true },
      { pupilId: zoe.id, leaves: true },
      { pupilId: ines.id, classId: null }, // à répartir
    ]);
    expect((await choose([{ pupilId: leo.id, classId: ce2.id, grade: 'CE1' }])).json().error).toBe(
      'invalid_grade',
    );
    expect((await choose([{ pupilId: leo.id, classId: classroom.id }])).json().error).toBe(
      'invalid_class',
    );
    // Supprimer une classe d'arrivée remet ses élèves à répartir.
    const temp = await direction.browser.ok<ClassroomDto>('POST', `/schools/${schoolId}/classes`, {
      name: 'Temporaire',
      grades: ['CE2'],
      schoolYear: to,
    });
    await choose([{ pupilId: ines.id, classId: temp.id }]);
    await direction.browser.ok('DELETE', `/classes/${temp.id}`);
    const planned = await direction.browser.ok<RolloverDto>('GET', `/schools/${schoolId}/rollover`);
    const choiceOf = (id: number) =>
      planned.fromClasses[0]!.pupils.find((p) => p.id === id)!.choice;
    expect(choiceOf(leo.id)).toEqual({ classId: ce2.id, grade: 'CE2' });
    expect(choiceOf(noah.id)).toEqual({ classId: mixed.id, grade: 'CE1' });
    expect(choiceOf(jade.id)).toBe('quitte');
    expect(choiceOf(ines.id)).toBeNull();

    // Une autre école ne voit rien.
    const other = await admin.ok<{ invitation: CreatedInvitation }>('POST', '/admin/schools', {
      name: 'Autre école',
    });
    const stranger = await register(other.invitation.code, 'autre@example.org');
    expect((await stranger.browser.send('GET', `/schools/${schoolId}/rollover`)).statusCode).toBe(
      404,
    );

    // Pas de rentrée tant qu'un élève est à répartir.
    const refused = await direction.browser.send('POST', `/schools/${schoolId}/rollover/apply`);
    expect(refused.statusCode).toBe(409);
    expect(refused.json().message).toMatch(/1 élève à répartir/);
    await choose([{ pupilId: ines.id, classId: mixed.id }]);
    expect(
      await direction.browser.ok<RolloverResult>('POST', `/schools/${schoolId}/rollover/apply`),
    ).toEqual({ moved: 3, detached: 1, deleted: 1 });

    // Léo : nouvelle classe, nouveau niveau, sans l'ancien devoir, avec l'avis passé.
    const leoMe = await leoParents.browser.ok<MeResponse>('GET', '/auth/me');
    expect(leoMe.children).toMatchObject([
      { id: leo.id, grade: 'CE2', classroom: { id: ce2.id, name: 'CE2 A' } },
    ]);
    await leoParents.browser.ok('POST', '/auth/active-child', { childId: leo.id });
    expect(
      (await leoParents.browser.ok<ChildStateResponse>('GET', '/child/state')).assignments,
    ).toEqual([]);
    const report = await teacher.browser.ok<ChildReport>('GET', `/pupils/${leo.id}/report`);
    expect(report.assessments['maths.calcul.tables']?.title).toBe('Évaluation de juin');
    // Jade est partie : elle reste à sa famille, sans classe.
    expect((await jadeParents.browser.ok<MeResponse>('GET', '/auth/me')).children).toMatchObject([
      { id: jade.id, classroom: null },
    ]);
    // L'ancienne classe a disparu ; Noah (maintenu) et Inès sont en CE1-CE2.
    expect((await teacher.browser.send('GET', `/classes/${classroom.id}`)).statusCode).toBe(404);
    const mixedNow = await direction.browser.ok<ClassroomDetail>('GET', `/classes/${mixed.id}`);
    expect(mixedNow.pupilList.map((p) => [p.firstName, p.grade])).toEqual([
      ['Inès', 'CE2'],
      ['Noah', 'CE1'],
    ]);
    expect(
      (await teacher.browser.ok<MeResponse>('GET', '/auth/me')).schools[0]!.classes.map(
        (c) => c.name,
      ),
    ).toEqual(['CE2 A']);
    // Les fiches de la nouvelle classe valent jusqu'à la fin de sa propre année.
    const [noahCode] = await direction.browser.ok<PupilCode[]>(
      'POST',
      `/classes/${mixed.id}/pupil-codes`,
      { pupilIds: [noah.id] },
    );
    expect(new Date(noahCode!.expiresAt)).toEqual(new Date(start + 2, 7, 31, 23, 59, 59));
    // L'année suivante commence : plus rien à répartir.
    const next = await direction.browser.ok<RolloverDto>('GET', `/schools/${schoolId}/rollover`);
    expect(next.from).toBe(to);
    expect(next.fromClasses.flatMap((c) => c.pupils.map((p) => p.choice))).toEqual([
      null,
      null,
      null,
    ]);
  });
});

describe('export des données de l’école', () => {
  it('JSON pour la direction, tableur pour la classe', async () => {
    const { admin, schoolId, direction, teacher, classroom } = await schoolWithClass();
    const [leo, formula] = await teacher.browser.ok<PupilDto[]>(
      'POST',
      `/classes/${classroom.id}/pupils`,
      { pupils: [{ firstName: 'Léo', lastName: 'M.' }, { firstName: '=SOMME(A1)' }] },
    );
    const [code] = await teacher.browser.ok<PupilCode[]>(
      'POST',
      `/classes/${classroom.id}/pupil-codes`,
      { pupilIds: [leo!.id] },
    );
    await register(code!.code, 'parent-leo@example.org', 'Famille Martin');
    const geometry = registry.notionsInScope('maths.geometrie', 'CE1').map((n) => n.id);
    await teacher.browser.ok('PATCH', `/classes/${classroom.id}/notions`, {
      notionIds: [geometry[0]],
      active: false,
    });
    await teacher.browser.ok('PATCH', `/classes/${classroom.id}`, {
      focusNotions: ['maths.calcul.tables'],
    });
    await teacher.browser.ok('POST', `/classes/${classroom.id}/assignments`, {
      title: 'Tables de 2',
      notions: ['maths.calcul.tables'],
      questions: 5,
      dueOn: dayKey(new Date()),
    });
    await teacher.browser.ok('POST', `/classes/${classroom.id}/assessments`, {
      title: 'Évaluation de novembre',
      assessedOn: '2026-11-03',
      notions: ['maths.calcul.tables'],
      results: { [leo!.id]: { 'maths.calcul.tables': 'ECA' } },
    });

    // JSON : direction seulement.
    expect((await teacher.browser.send('GET', `/schools/${schoolId}/export`)).statusCode).toBe(403);
    const res = await direction.browser.send('GET', `/schools/${schoolId}/export`);
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-disposition']).toMatch(
      /^attachment; filename="ecole-ecole-des-tilleuls-\d{4}-\d{2}-\d{2}\.json"$/,
    );
    const data = res.json();
    expect(data.school).toMatchObject({ name: 'École des Tilleuls', city: 'Lyon' });
    expect(data.members).toEqual([
      { email: 'directrice@example.org', role: 'direction', classes: [] },
      { email: 'enseignante@example.org', role: 'enseignant', classes: ['CE1 B'] },
    ]);
    const [exported] = data.classes;
    expect(exported).toMatchObject({
      name: 'CE1 B',
      grades: ['CE1'],
      teachers: ['enseignante@example.org'],
      focusNotions: ['maths.calcul.tables'],
      notionsNotSeen: [geometry[0]],
    });
    const pupil = exported.pupils.find((p: { firstName: string }) => p.firstName === 'Léo');
    expect(pupil).toMatchObject({ lastName: 'M.', grade: 'CE1', parentAccount: true });
    expect(pupil.assessments).toEqual([
      {
        notionId: 'maths.calcul.tables',
        notion: 'Tables de multiplication',
        result: 'ECA',
        assessedOn: '2026-11-03',
        title: 'Évaluation de novembre',
      },
    ]);
    expect(pupil.homework).toMatchObject([
      { title: 'Tables de 2', answered: 0, completedAt: null },
    ]);
    // Rien sur la famille, ni secret.
    const text = res.body;
    for (const secret of ['parent-leo@example.org', 'Famille Martin', 'passwordHash', 'codeHash'])
      expect(text).not.toContain(secret);
    // Une autre école ne voit rien.
    const other = await admin.ok<{ invitation: CreatedInvitation }>('POST', '/admin/schools', {
      name: 'Autre école',
    });
    const stranger = await register(other.invitation.code, 'autre@example.org');
    expect((await stranger.browser.send('GET', `/schools/${schoolId}/export`)).statusCode).toBe(
      404,
    );

    // Tableur de la classe : l'enseignante.
    const csv = await teacher.browser.send('GET', `/classes/${classroom.id}/export.csv`);
    expect(csv.statusCode).toBe(200);
    expect(csv.headers['content-type']).toBe('text/csv; charset=utf-8');
    expect(csv.headers['content-disposition']).toMatch(/filename="classe-ce1-b-.+\.csv"/);
    expect(csv.body.startsWith('\uFEFFÉlève;Niveau;Matière;Domaine;Notion;Vue en classe')).toBe(
      true,
    );
    const lines = csv.body.slice(1).trim().split('\r\n');
    const notionsCE1 = registry.notionsInScope('all', 'CE1').length;
    expect(lines).toHaveLength(1 + 2 * notionsCE1);
    const tables = lines.find(
      (l) => l.startsWith('Léo M.;') && l.includes(';Tables de multiplication;'),
    );
    expect(tables!.split(';').slice(5)).toEqual([
      'oui',
      'oui',
      '0',
      'À découvrir',
      '0',
      'ECA',
      '03/11/2026',
      'Évaluation de novembre',
    ]);
    const notSeen = registry.notion(geometry[0]!)!.title;
    expect(
      lines.find((l) => l.startsWith('Léo M.;') && l.includes(`;${notSeen};`))!.split(';')[5],
    ).toBe('non');
    // Un prénom qui ressemble à une formule n'en est pas une.
    expect(lines.some((l) => l.startsWith("'=SOMME(A1);CE1;"))).toBe(true);
    expect(formula).toBeDefined();
    // Une collègue sans cette classe ne l'exporte pas.
    const invite = await direction.browser.ok<CreatedInvitation>(
      'POST',
      `/schools/${schoolId}/invitations`,
      {},
    );
    const colleague = await register(invite.code, 'collegue@example.org');
    expect(
      (await colleague.browser.send('GET', `/classes/${classroom.id}/export.csv`)).statusCode,
    ).toBe(404);
  });
});
