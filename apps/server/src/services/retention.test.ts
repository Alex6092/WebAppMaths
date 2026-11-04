import { eq } from 'drizzle-orm';
import { expect, it } from 'vitest';
import { openDb, type Db } from '../db/client';
import {
  attempts,
  authSessions,
  children,
  classrooms,
  families,
  invitations,
  parentUsers,
  passwordResets,
  practiceSessions,
  rolloverChoices,
  schoolMembers,
  schools,
} from '../db/schema';
import { applyRetention } from './retention';

const NOW = new Date('2026-10-01T03:00:00Z');
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);

let seq = 0;
const code = () => `hash-${++seq}`;

function account(
  db: Db,
  email: string,
  opts: { familyId?: number | null; role?: 'admin' | 'parent'; lastSeen?: Date | null } = {},
) {
  return db
    .insert(parentUsers)
    .values({
      email,
      familyId: opts.familyId ?? null,
      passwordHash: 'x',
      role: opts.role ?? 'parent',
      createdAt: daysAgo(1000),
      lastSeenAt: opts.lastSeen === undefined ? daysAgo(1) : opts.lastSeen,
    })
    .returning()
    .get();
}

function child(db: Db, firstName: string, familyId: number | null, classId: number | null) {
  return db
    .insert(children)
    .values({
      firstName,
      familyId,
      classId,
      avatar: '🦄',
      grade: 'CE1',
      themeId: 'foret',
      createdAt: daysAgo(400),
    })
    .returning()
    .get();
}

function seed() {
  const db = openDb(':memory:');
  const family = db
    .insert(families)
    .values({ name: 'F', createdAt: daysAgo(900) })
    .returning()
    .get();
  const admin = account(db, 'admin@example.org', { role: 'admin', lastSeen: daysAgo(900) });
  const parent = account(db, 'parent@example.org', { familyId: family.id, lastSeen: daysAgo(900) });
  const school = db
    .insert(schools)
    .values({ name: 'École', createdAt: daysAgo(900) })
    .returning()
    .get();
  const teacher = account(db, 'prof@example.org', { lastSeen: daysAgo(900) });
  db.insert(schoolMembers)
    .values({
      schoolId: school.id,
      userId: teacher.id,
      role: 'enseignant',
      createdAt: daysAgo(900),
    })
    .run();
  const goneLongAgo = account(db, 'parti@example.org', { lastSeen: daysAgo(200) });
  const goneRecently = account(db, 'recent@example.org', { lastSeen: daysAgo(60) });
  // Un compte d'avant la colonne last_seen_at : sa création fait foi.
  const neverSeen = account(db, 'ancien@example.org', { lastSeen: null });

  const classOf = (name: string, schoolYear: string) =>
    db
      .insert(classrooms)
      .values({ schoolId: school.id, name, grades: ['CE1'], schoolYear, createdAt: daysAgo(800) })
      .returning()
      .get();
  // Au 1er octobre 2026 : 2024-2025 est finie depuis plus d'un an, 2025-2026 depuis un mois.
  const stale = classOf('CE1 2024', '2024-2025');
  const recent = classOf('CE1 2025', '2025-2026');
  const next = classOf('CE2 2026', '2026-2027');
  const alone = child(db, 'Zoé', null, stale.id);
  const withFamily = child(db, 'Léo', family.id, stale.id);
  const keptPupil = child(db, 'Inès', null, recent.id);
  db.insert(rolloverChoices)
    .values({
      childId: withFamily.id,
      toClassId: next.id,
      grade: 'CE2',
      leaves: false,
      updatedAt: daysAgo(500),
    })
    .run();
  const session = db
    .insert(practiceSessions)
    .values({ childId: withFamily.id, mode: 'training', selection: {}, startedAt: daysAgo(400) })
    .returning()
    .get();
  db.insert(attempts)
    .values({
      sessionId: session.id,
      childId: withFamily.id,
      pluginId: 'p',
      pluginVersion: 1,
      level: 1,
      seed: 1,
      answers: [],
      firstTryCorrect: true,
      solved: true,
      tries: 1,
      score: 1,
      durationMs: 1000,
      coins: 1,
      createdAt: daysAgo(400),
    })
    .run();

  const sessionRow = (id: string, userId: number, expiresAt: Date) =>
    db
      .insert(authSessions)
      .values({
        id,
        parentUserId: userId,
        familyId: null,
        createdAt: daysAgo(400),
        lastSeenAt: daysAgo(30),
        expiresAt,
      })
      .run();
  sessionRow('expired', parent.id, daysAgo(1));
  sessionRow('valid', parent.id, daysAgo(-100));

  const invitation = (usedAt: Date | null, expiresAt: Date) =>
    db
      .insert(invitations)
      .values({
        codeHash: code(),
        role: 'parent',
        familyId: null,
        createdBy: admin.id,
        createdAt: daysAgo(400),
        expiresAt,
        usedAt,
      })
      .returning({ id: invitations.id })
      .get().id;
  const usedLongAgo = invitation(daysAgo(40), daysAgo(-10));
  const usedRecently = invitation(daysAgo(10), daysAgo(-10));
  const expiredLongAgo = invitation(null, daysAgo(40));
  const pending = invitation(null, daysAgo(-5));

  const reset = (usedAt: Date | null, expiresAt: Date) =>
    db
      .insert(passwordResets)
      .values({ codeHash: code(), familyId: family.id, createdAt: daysAgo(400), expiresAt, usedAt })
      .returning({ id: passwordResets.id })
      .get().id;
  const resetOld = reset(daysAgo(45), daysAgo(30));
  const resetPending = reset(null, daysAgo(-3));

  return {
    db,
    ids: {
      admin,
      parent,
      teacher,
      goneLongAgo,
      goneRecently,
      neverSeen,
      stale,
      recent,
      next,
      alone,
      withFamily,
      keptPupil,
      usedLongAgo,
      usedRecently,
      expiredLongAgo,
      pending,
      resetOld,
      resetPending,
    },
  };
}

it('efface ce qui ne sert plus, et seulement cela', () => {
  const { db, ids } = seed();
  const report = applyRetention(db, { now: NOW });
  expect(report).toEqual({
    sessions: 1,
    invitations: 2,
    resets: 1,
    classes: 1,
    pupilsDeleted: 1,
    pupilsDetached: 1,
    accounts: 2,
  });

  // Sessions : l'expirée part, la valide reste.
  expect(db.select({ id: authSessions.id }).from(authSessions).all()).toEqual([{ id: 'valid' }]);
  // Invitations et codes : un mois d'historique, ceux en attente restent.
  expect(
    db
      .select({ id: invitations.id })
      .from(invitations)
      .all()
      .map((r) => r.id)
      .sort(),
  ).toEqual([ids.usedRecently, ids.pending].sort());
  expect(db.select({ id: passwordResets.id }).from(passwordResets).all()).toEqual([
    { id: ids.resetPending },
  ]);
  // Classe d'une année finie depuis plus d'un an : supprimée ; Zoé (sans famille) aussi ; Léo
  // reste à sa famille, avec sa progression, sans classe ni choix de rentrée.
  const classes = db
    .select({ id: classrooms.id })
    .from(classrooms)
    .all()
    .map((c) => c.id);
  expect(classes.sort()).toEqual([ids.recent.id, ids.next.id].sort());
  expect(db.select().from(children).where(eq(children.id, ids.alone.id)).get()).toBeUndefined();
  expect(db.select().from(children).where(eq(children.id, ids.withFamily.id)).get()).toMatchObject({
    familyId: ids.parent.familyId,
    classId: null,
  });
  expect(
    db.select().from(attempts).where(eq(attempts.childId, ids.withFamily.id)).all(),
  ).toHaveLength(1);
  expect(db.select().from(rolloverChoices).all()).toEqual([]);
  expect(db.select().from(children).where(eq(children.id, ids.keptPupil.id)).get()).toBeDefined();
  // Comptes : sans école ni famille et inactifs depuis 6 mois, supprimés ; les autres restent.
  const emails = db
    .select({ email: parentUsers.email })
    .from(parentUsers)
    .all()
    .map((u) => u.email);
  expect(emails.sort()).toEqual(
    ['admin@example.org', 'parent@example.org', 'prof@example.org', 'recent@example.org'].sort(),
  );
  // Une deuxième passe ne trouve plus rien.
  expect(Object.values(applyRetention(db, { now: NOW })).every((n) => n === 0)).toBe(true);
});

it('simulation : compte sans rien supprimer', () => {
  const { db } = seed();
  const before = db.select().from(parentUsers).all().length;
  const simulated = applyRetention(db, { now: NOW, dryRun: true });
  expect(simulated.accounts).toBe(2);
  expect(simulated.classes).toBe(1);
  expect(db.select().from(parentUsers).all()).toHaveLength(before);
  expect(db.select().from(authSessions).all()).toHaveLength(2);
  expect(applyRetention(db, { now: NOW })).toEqual(simulated);
});
