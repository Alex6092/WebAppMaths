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

export const parentUsers = sqliteTable('parent_user', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  familyId: integer('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['admin', 'parent'] }).notNull(),
  createdAt: createdAt(),
});

export const invitations = sqliteTable('invitation', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  codeHash: text('code_hash').notNull().unique(),
  role: text('role', { enum: ['admin', 'parent'] }).notNull(),
  /** Famille à rejoindre ; null = nouvelle famille. */
  familyId: integer('family_id').references(() => families.id, { onDelete: 'cascade' }),
  createdBy: integer('created_by').references(() => parentUsers.id, { onDelete: 'set null' }),
  note: text('note'),
  createdAt: createdAt(),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  usedAt: integer('used_at', { mode: 'timestamp_ms' }),
  usedBy: integer('used_by').references(() => parentUsers.id, { onDelete: 'set null' }),
});

export const children = sqliteTable('child', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  familyId: integer('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  firstName: text('first_name').notNull(),
  avatar: text('avatar').notNull(),
  grade: text('grade').notNull(),
  themeId: text('theme_id').notNull(),
  coins: integer('coins').notNull().default(0),
  settings: text('settings', { mode: 'json' })
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),
  createdAt: createdAt(),
});

export const authSessions = sqliteTable(
  'auth_session',
  {
    /** Empreinte SHA-256 du jeton du cookie (le jeton lui-même n'est jamais stocké). */
    id: text('id').primaryKey(),
    familyId: integer('family_id')
      .notNull()
      .references(() => families.id, { onDelete: 'cascade' }),
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
