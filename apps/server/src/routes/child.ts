import type {
  AttemptRequest,
  ChildDto,
  ChildStateResponse,
  EvaluationReport,
  StartSessionRequest,
  ThemeResponse,
} from '@app/core';
import { eq } from 'drizzle-orm';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { requireAuth } from '../auth/session';
import { children, exerciseStates, rewardsOwned } from '../db/schema';
import { forbidden } from '../errors';
import { getFamilyChild, toChildDto } from '../services/family';
import {
  buyReward,
  childMasteries,
  endSession,
  recordAttempt,
  startSession,
} from '../services/practice';
import {
  awardBadges,
  chooseTheme,
  dailyState,
  earnedBadges,
  unlockedThemes,
} from '../services/motivation';
import { childEvaluations, evaluationReport, getEvaluation } from '../services/evaluation';
import { childAssignments } from '../services/homework';
import { activeNotions } from '../services/notions';
import { reviewQueue } from '../services/report';
import { childReviews } from '../services/spaced';
import type { Deps } from './deps';

/** Routes du profil enfant actif sur cet appareil. */
export function childRoutes(api: FastifyInstance, { db }: Deps): void {
  const activeChild = (req: FastifyRequest) => {
    const auth = requireAuth(req);
    if (auth.activeChildId === null)
      throw forbidden('no_active_child', 'Choisis d’abord un profil.');
    return getFamilyChild(db, auth.familyId, auth.activeChildId);
  };

  api.get('/child/state', async (req): Promise<ChildStateResponse> => {
    const child = activeChild(req);
    const states = db
      .select()
      .from(exerciseStates)
      .where(eq(exerciseStates.childId, child.id))
      .all();
    const owned = db
      .select({ themeId: rewardsOwned.themeId, rewardId: rewardsOwned.rewardId })
      .from(rewardsOwned)
      .where(eq(rewardsOwned.childId, child.id))
      .all();
    const notions = childMasteries(db, child.id);
    // Rattrape les badges mérités avant leur arrivée (ou gagnés sur un autre appareil).
    awardBadges(db, child.id, notions);
    return {
      child: toChildDto(child),
      levels: Object.fromEntries(
        states.map((s) => [
          s.pluginId,
          { level: s.level, recent: s.recent, consecutiveErrors: s.consecutiveErrors },
        ]),
      ),
      notions,
      owned,
      themes: unlockedThemes(db, child.id),
      badges: earnedBadges(db, child.id),
      daily: dailyState(db, child.id),
      mistakes: reviewQueue(db, child.id).length,
      activeNotions: activeNotions(db, child),
      assignments: childAssignments(db, child),
      reviews: childReviews(db, child.id),
      evaluations: childEvaluations(db, child),
    };
  });

  /** Le bilan d'une évaluation finie, montré à l'enfant à la fin. */
  api.get<{ Params: { id: number } }>(
    '/child/evaluations/:id',
    { schema: { params: { type: 'object', properties: { id: { type: 'integer' } } } } },
    async (req): Promise<EvaluationReport> => {
      const child = activeChild(req);
      return evaluationReport(db, child, getEvaluation(db, child, req.params.id));
    },
  );

  api.post<{ Body: StartSessionRequest }>(
    '/child/sessions',
    {
      schema: {
        body: {
          type: 'object',
          required: ['mode', 'selection'],
          additionalProperties: false,
          properties: {
            mode: {
              type: 'string',
              enum: ['training', 'mix', 'daily', 'review', 'homework', 'evaluation'],
            },
            selection: {
              type: 'object',
              additionalProperties: false,
              properties: {
                pluginId: { type: 'string', maxLength: 100 },
                assignmentId: { type: 'integer' },
                evaluationId: { type: 'integer' },
                notions: {
                  type: 'array',
                  maxItems: 200,
                  items: { type: 'string', maxLength: 100 },
                },
              },
            },
          },
        },
      },
    },
    async (req) => startSession(db, activeChild(req), req.body),
  );

  api.post<{ Params: { id: number } }>(
    '/child/sessions/:id/end',
    { schema: { params: { type: 'object', properties: { id: { type: 'integer' } } } } },
    async (req) => endSession(db, activeChild(req), req.params.id),
  );

  api.post<{ Body: AttemptRequest }>(
    '/child/attempts',
    {
      schema: {
        body: {
          type: 'object',
          required: [
            'sessionId',
            'pluginId',
            'pluginVersion',
            'level',
            'seed',
            'answers',
            'durationMs',
          ],
          additionalProperties: false,
          properties: {
            sessionId: { type: 'integer' },
            pluginId: { type: 'string', maxLength: 100 },
            pluginVersion: { type: 'integer', minimum: 1 },
            level: { type: 'integer', minimum: 1, maximum: 100 },
            seed: { type: 'integer', minimum: 0, maximum: 4294967295 },
            answers: { type: 'array', minItems: 1, maxItems: 5 },
            durationMs: { type: 'integer', minimum: 0 },
            firstTryMs: { type: 'integer', minimum: 0 },
          },
        },
      },
    },
    async (req) => recordAttempt(db, activeChild(req), req.body),
  );

  api.post<{ Body: { themeId: string; rewardId: string } }>(
    '/child/rewards',
    {
      schema: {
        body: {
          type: 'object',
          required: ['themeId', 'rewardId'],
          additionalProperties: false,
          properties: {
            themeId: { type: 'string', maxLength: 60 },
            rewardId: { type: 'string', maxLength: 60 },
          },
        },
      },
    },
    async (req) => buyReward(db, activeChild(req), req.body.themeId, req.body.rewardId),
  );

  api.post<{ Body: { themeId: string } }>(
    '/child/theme',
    {
      schema: {
        body: {
          type: 'object',
          required: ['themeId'],
          additionalProperties: false,
          properties: { themeId: { type: 'string', maxLength: 60 } },
        },
      },
    },
    async (req): Promise<ThemeResponse> => chooseTheme(db, activeChild(req), req.body.themeId),
  );

  api.patch<{ Body: { sound: boolean } }>(
    '/child/settings',
    {
      schema: {
        body: {
          type: 'object',
          required: ['sound'],
          additionalProperties: false,
          properties: { sound: { type: 'boolean' } },
        },
      },
    },
    async (req): Promise<ChildDto> => {
      const child = activeChild(req);
      const row = db
        .update(children)
        .set({ settings: { ...child.settings, sound: req.body.sound } })
        .where(eq(children.id, child.id))
        .returning()
        .get();
      return toChildDto(row);
    },
  );
}
