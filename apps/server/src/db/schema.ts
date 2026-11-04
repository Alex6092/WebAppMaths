import type { EvaluationCode, EvaluationItem, GradeId, InvitationKind } from '@app/core';
import {
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

const createdAt = () => integer('created_at', { mode: 'timestamp_ms' }).notNull();

export const families = sqliteTable('family', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  createdAt: createdAt(),
});

/**
 * Comptes (parents, enseignants, administrateur). Un compte d'enseignant seul n'a pas de famille ;
 * ses rôles dans les écoles sont dans school_member.
 */
export const parentUsers = sqliteTable('parent_user', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  familyId: integer('family_id').references(() => families.id, { onDelete: 'cascade' }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['admin', 'parent'] }).notNull(),
  createdAt: createdAt(),
});

/** Écoles (établissements). */
export const schools = sqliteTable('school', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  city: text('city'),
  createdAt: createdAt(),
});

/** Rôle d'un compte dans une école : direction (gère l'école) ou enseignant. */
export const schoolMembers = sqliteTable(
  'school_member',
  {
    schoolId: integer('school_id')
      .notNull()
      .references(() => schools.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => parentUsers.id, { onDelete: 'cascade' }),
    role: text('role', { enum: ['direction', 'enseignant'] }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    primaryKey({ columns: [t.schoolId, t.userId] }),
    index('school_member_user_idx').on(t.userId),
  ],
);

/** Classes d'une école (une classe peut avoir deux niveaux : « CE1-CE2 »). */
export const classrooms = sqliteTable(
  'classroom',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    schoolId: integer('school_id')
      .notNull()
      .references(() => schools.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    grades: text('grades', { mode: 'json' }).$type<GradeId[]>().notNull(),
    /** « 2026-2027 ». */
    schoolYear: text('school_year').notNull(),
    /** Notions de la leçon en cours (« En ce moment en classe »). */
    focusNotions: text('focus_notions', { mode: 'json' }).$type<string[]>().notNull().default([]),
    createdAt: createdAt(),
  },
  (t) => [index('classroom_school_idx').on(t.schoolId)],
);

/** Enseignants d'une classe (souvent deux : temps partiel, décharge de direction). */
export const classroomTeachers = sqliteTable(
  'classroom_teacher',
  {
    classId: integer('class_id')
      .notNull()
      .references(() => classrooms.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => parentUsers.id, { onDelete: 'cascade' }),
  },
  (t) => [
    primaryKey({ columns: [t.classId, t.userId] }),
    index('classroom_teacher_user_idx').on(t.userId),
  ],
);

/**
 * Notions vues en classe, réglées par l'enseignant pour toute la classe ; pour un élève inscrit,
 * elles remplacent les réglages du parent. Sans ligne, une notion est considérée comme vue.
 */
export const classNotionSettings = sqliteTable(
  'class_notion_setting',
  {
    classId: integer('class_id')
      .notNull()
      .references(() => classrooms.id, { onDelete: 'cascade' }),
    notionId: text('notion_id').notNull(),
    active: integer('active', { mode: 'boolean' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.classId, t.notionId] })],
);

export const invitations = sqliteTable('invitation', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  codeHash: text('code_hash').notNull().unique(),
  /**
   * Ce que le code ouvre : admin / parent (nouvelle famille, ou second parent avec familyId),
   * direction / enseignant (avec schoolId), eleve (la fiche parent d'un élève, avec childId).
   */
  role: text('role').$type<InvitationKind>().notNull(),
  /** Famille à rejoindre ; null = nouvelle famille. */
  familyId: integer('family_id').references(() => families.id, { onDelete: 'cascade' }),
  schoolId: integer('school_id').references(() => schools.id, { onDelete: 'cascade' }),
  childId: integer('child_id').references(() => children.id, { onDelete: 'cascade' }),
  createdBy: integer('created_by').references(() => parentUsers.id, { onDelete: 'set null' }),
  note: text('note'),
  createdAt: createdAt(),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  usedAt: integer('used_at', { mode: 'timestamp_ms' }),
  usedBy: integer('used_by').references(() => parentUsers.id, { onDelete: 'set null' }),
});

/**
 * Enfants : un seul profil par enfant, rattaché à une famille, à une classe, ou aux deux (l'élève
 * créé par l'école n'a pas de famille tant que le parent n'a pas activé sa fiche).
 */
export const children = sqliteTable(
  'child',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    familyId: integer('family_id').references(() => families.id, { onDelete: 'cascade' }),
    classId: integer('class_id').references(() => classrooms.id, { onDelete: 'set null' }),
    firstName: text('first_name').notNull(),
    /** Nom (ou initiale) : affiché seulement côté école, pour distinguer deux élèves. */
    lastName: text('last_name'),
    avatar: text('avatar').notNull(),
    grade: text('grade').notNull(),
    themeId: text('theme_id').notNull(),
    coins: integer('coins').notNull().default(0),
    settings: text('settings', { mode: 'json' })
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    createdAt: createdAt(),
  },
  (t) => [index('child_family_idx').on(t.familyId), index('child_class_idx').on(t.classId)],
);

export const authSessions = sqliteTable(
  'auth_session',
  {
    /** Empreinte SHA-256 du jeton du cookie (le jeton lui-même n'est jamais stocké). */
    id: text('id').primaryKey(),
    familyId: integer('family_id').references(() => families.id, { onDelete: 'cascade' }),
    parentUserId: integer('parent_user_id')
      .notNull()
      .references(() => parentUsers.id, { onDelete: 'cascade' }),
    parentVerifiedAt: integer('parent_verified_at', { mode: 'timestamp_ms' }),
    activeChildId: integer('active_child_id').references(() => children.id, {
      onDelete: 'set null',
    }),
    userAgent: text('user_agent'),
    createdAt: createdAt(),
    lastSeenAt: integer('last_seen_at', { mode: 'timestamp_ms' }).notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (t) => [index('auth_session_user_idx').on(t.parentUserId)],
);

export const practiceSessions = sqliteTable(
  'practice_session',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    childId: integer('child_id')
      .notNull()
      .references(() => children.id, { onDelete: 'cascade' }),
    mode: text('mode').notNull(),
    selection: text('selection', { mode: 'json' }).$type<Record<string, unknown>>().notNull(),
    startedAt: integer('started_at', { mode: 'timestamp_ms' }).notNull(),
    endedAt: integer('ended_at', { mode: 'timestamp_ms' }),
    nQuestions: integer('n_questions').notNull().default(0),
    nFirstTry: integer('n_first_try').notNull().default(0),
    coinsEarned: integer('coins_earned').notNull().default(0),
  },
  (t) => [index('practice_session_child_idx').on(t.childId, t.startedAt)],
);

export const attempts = sqliteTable(
  'attempt',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    sessionId: integer('session_id')
      .notNull()
      .references(() => practiceSessions.id, { onDelete: 'cascade' }),
    childId: integer('child_id')
      .notNull()
      .references(() => children.id, { onDelete: 'cascade' }),
    pluginId: text('plugin_id').notNull(),
    pluginVersion: integer('plugin_version').notNull(),
    level: integer('level').notNull(),
    seed: integer('seed').notNull(),
    answers: text('answers', { mode: 'json' }).$type<unknown[]>().notNull(),
    firstTryCorrect: integer('first_try_correct', { mode: 'boolean' }).notNull(),
    solved: integer('solved', { mode: 'boolean' }).notNull(),
    tries: integer('tries').notNull(),
    score: real('score').notNull(),
    durationMs: integer('duration_ms').notNull(),
    /** Temps jusqu'à la première réponse (absent pour les tentatives d'avant). */
    firstTryMs: integer('first_try_ms'),
    coins: integer('coins').notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    index('attempt_child_idx').on(t.childId, t.createdAt),
    index('attempt_child_plugin_idx').on(t.childId, t.pluginId),
    // Une question (graine) n'est comptée qu'une fois par séance : pas de double crédit.
    uniqueIndex('attempt_session_question_uq').on(t.sessionId, t.pluginId, t.seed),
  ],
);

export const exerciseStates = sqliteTable(
  'exercise_state',
  {
    childId: integer('child_id')
      .notNull()
      .references(() => children.id, { onDelete: 'cascade' }),
    pluginId: text('plugin_id').notNull(),
    level: integer('level').notNull(),
    recent: text('recent', { mode: 'json' }).$type<boolean[]>().notNull(),
    consecutiveErrors: integer('consecutive_errors').notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.childId, t.pluginId] })],
);

export const rewardsOwned = sqliteTable(
  'reward_owned',
  {
    childId: integer('child_id')
      .notNull()
      .references(() => children.id, { onDelete: 'cascade' }),
    themeId: text('theme_id').notNull(),
    rewardId: text('reward_id').notNull(),
    acquiredAt: integer('acquired_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.childId, t.themeId, t.rewardId] })],
);

/** Ambiances débloquées avec des pièces (les ambiances gratuites n'y sont pas). */
export const themesOwned = sqliteTable(
  'theme_owned',
  {
    childId: integer('child_id')
      .notNull()
      .references(() => children.id, { onDelete: 'cascade' }),
    themeId: text('theme_id').notNull(),
    unlockedAt: integer('unlocked_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.childId, t.themeId] })],
);

/** Badges gagnés : ils restent, même si une notion redevient « en cours ». */
export const badges = sqliteTable(
  'badge',
  {
    childId: integer('child_id')
      .notNull()
      .references(() => children.id, { onDelete: 'cascade' }),
    badgeId: text('badge_id').notNull(),
    earnedAt: integer('earned_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.childId, t.badgeId] })],
);

/**
 * Notions vues en classe, réglées par le parent. Sans ligne, une notion de la classe de
 * l'enfant est considérée comme vue.
 */
export const notionSettings = sqliteTable(
  'notion_setting',
  {
    childId: integer('child_id')
      .notNull()
      .references(() => children.id, { onDelete: 'cascade' }),
    notionId: text('notion_id').notNull(),
    active: integer('active', { mode: 'boolean' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.childId, t.notionId] })],
);

/**
 * Devoirs donnés par le parent ou par l'enseignant : des notions, un nombre de questions, une
 * date. Un devoir de classe est une ligne par élève, avec le même batch.
 */
export const assignments = sqliteTable(
  'assignment',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    childId: integer('child_id')
      .notNull()
      .references(() => children.id, { onDelete: 'cascade' }),
    /** Devoir de la classe (null : donné par le parent). */
    batch: text('batch'),
    classId: integer('class_id').references(() => classrooms.id, { onDelete: 'set null' }),
    createdBy: integer('created_by').references(() => parentUsers.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    notions: text('notions', { mode: 'json' }).$type<string[]>().notNull(),
    questions: integer('questions').notNull(),
    /** Pour quel jour (AAAA-MM-JJ). */
    dueOn: text('due_on').notNull(),
    createdAt: createdAt(),
    completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
  },
  (t) => [
    index('assignment_child_idx').on(t.childId, t.createdAt),
    index('assignment_class_idx').on(t.classId, t.batch),
  ],
);

/**
 * Révision espacée d'une notion acquise : elle revient à J+1, J+3, J+7, J+14 puis J+30.
 * box : révisions réussies d'affilée ; dueAt : quand la reposer.
 */
export const notionReviews = sqliteTable(
  'notion_review',
  {
    childId: integer('child_id')
      .notNull()
      .references(() => children.id, { onDelete: 'cascade' }),
    notionId: text('notion_id').notNull(),
    box: integer('box').notNull(),
    dueAt: integer('due_at', { mode: 'timestamp_ms' }).notNull(),
    reviewedAt: integer('reviewed_at', { mode: 'timestamp_ms' }),
  },
  (t) => [primaryKey({ columns: [t.childId, t.notionId] })],
);

/**
 * Évaluations blanches préparées par le parent : les questions sont tirées à la création
 * (exercice, niveau attendu, graine), groupées par notion comme sur les évaluations de l'école.
 */
export const evaluations = sqliteTable(
  'evaluation',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    childId: integer('child_id')
      .notNull()
      .references(() => children.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    notions: text('notions', { mode: 'json' }).$type<string[]>().notNull(),
    perNotion: integer('per_notion').notNull(),
    items: text('items', { mode: 'json' }).$type<EvaluationItem[]>().notNull(),
    createdAt: createdAt(),
    completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
  },
  (t) => [index('evaluation_child_idx').on(t.childId, t.createdAt)],
);

/**
 * Avis de l'enseignant sur une notion (A / ECA / NA), après une évaluation sur papier. On garde
 * l'historique ; le plus récent fait foi. Un batch regroupe les avis saisis ensemble.
 */
export const notionAssessments = sqliteTable(
  'notion_assessment',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    childId: integer('child_id')
      .notNull()
      .references(() => children.id, { onDelete: 'cascade' }),
    notionId: text('notion_id').notNull(),
    result: text('result').$type<EvaluationCode>().notNull(),
    /** Jour de l'évaluation (AAAA-MM-JJ). */
    assessedOn: text('assessed_on').notNull(),
    title: text('title').notNull(),
    batch: text('batch').notNull(),
    classId: integer('class_id').references(() => classrooms.id, { onDelete: 'set null' }),
    createdBy: integer('created_by').references(() => parentUsers.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
  },
  (t) => [
    index('notion_assessment_child_idx').on(t.childId, t.notionId),
    index('notion_assessment_class_idx').on(t.classId, t.batch),
  ],
);

/**
 * Préparation de la rentrée : la classe de l'année suivante choisie par la direction pour un
 * élève, et son niveau, ou son départ de l'école. Effacé une fois la rentrée faite.
 */
export const rolloverChoices = sqliteTable('rollover_choice', {
  childId: integer('child_id')
    .primaryKey()
    .references(() => children.id, { onDelete: 'cascade' }),
  /** Supprimer la classe d'arrivée remet l'élève « à répartir ». */
  toClassId: integer('to_class_id').references(() => classrooms.id, { onDelete: 'cascade' }),
  grade: text('grade').$type<GradeId>(),
  leaves: integer('leaves', { mode: 'boolean' }).notNull().default(false),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

/**
 * Fiches de réinitialisation du mot de passe (pas d'e-mail dans l'app). Un code vaut pour une
 * famille (fiche imprimée par la direction : n'importe quel parent de la famille, avec son
 * e-mail) ou pour un compte (code donné par l'administrateur). Seule l'empreinte est gardée.
 * Table à part des invitations : un tel code ne crée jamais de compte.
 */
export const passwordResets = sqliteTable('password_reset', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  codeHash: text('code_hash').notNull().unique(),
  userId: integer('user_id').references(() => parentUsers.id, { onDelete: 'cascade' }),
  familyId: integer('family_id').references(() => families.id, { onDelete: 'cascade' }),
  /** L'élève pour qui la fiche a été imprimée (affiché au parent). */
  childId: integer('child_id').references(() => children.id, { onDelete: 'set null' }),
  schoolId: integer('school_id').references(() => schools.id, { onDelete: 'cascade' }),
  createdBy: integer('created_by').references(() => parentUsers.id, { onDelete: 'set null' }),
  createdAt: createdAt(),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  usedAt: integer('used_at', { mode: 'timestamp_ms' }),
});
