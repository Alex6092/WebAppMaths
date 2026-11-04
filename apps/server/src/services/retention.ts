import { schoolYearEnd } from '@app/core';
import { and, eq, isNotNull, isNull, lt, ne, notExists, or, sql } from 'drizzle-orm';
import type { Db } from '../db/client';
import {
  authSessions,
  classrooms,
  invitations,
  parentUsers,
  passwordResets,
  schoolMembers,
} from '../db/schema';
import { removeClass } from './school';

/**
 * Durée de conservation : chaque nuit, juste après la sauvegarde du jour, l'app efface ce qui ne
 * sert plus. Les avis de l'enseignant, les devoirs et la progression des enfants restent, tant que
 * leur profil existe ; une famille n'est jamais supprimée parce qu'elle est inactive.
 */

const DAY_MS = 86_400_000;
/** Invitations et codes utilisés ou expirés : un mois d'historique. */
export const SPENT_CODES_DAYS = 30;
/** Une classe dont l'année est finie depuis un an (la rentrée n'a jamais été faite). */
export const STALE_CLASS_DAYS = 365;
/** Un compte sans école ni famille (enseignant parti), après 6 mois sans connexion. */
export const ORPHAN_ACCOUNT_DAYS = 182;

export interface RetentionReport {
  sessions: number;
  invitations: number;
  resets: number;
  classes: number;
  /** Élèves des classes supprimées : sans famille, supprimés ; avec une famille, détachés. */
  pupilsDeleted: number;
  pupilsDetached: number;
  accounts: number;
}

/** Signale l'annulation voulue d'une transaction (simulation). */
class DryRun extends Error {}

export function applyRetention(
  db: Db,
  { now = new Date(), dryRun = false }: { now?: Date; dryRun?: boolean } = {},
): RetentionReport {
  const report: RetentionReport = {
    sessions: 0,
    invitations: 0,
    resets: 0,
    classes: 0,
    pupilsDeleted: 0,
    pupilsDetached: 0,
    accounts: 0,
  };
  const spent = new Date(now.getTime() - SPENT_CODES_DAYS * DAY_MS);
  try {
    db.transaction((tx) => {
      report.sessions = tx
        .delete(authSessions)
        .where(lt(authSessions.expiresAt, now))
        .returning({ id: authSessions.id })
        .all().length;

      report.invitations = tx
        .delete(invitations)
        .where(
          or(
            and(isNotNull(invitations.usedAt), lt(invitations.usedAt, spent)),
            and(isNull(invitations.usedAt), lt(invitations.expiresAt, spent)),
          ),
        )
        .returning({ id: invitations.id })
        .all().length;

      report.resets = tx
        .delete(passwordResets)
        .where(
          or(
            and(isNotNull(passwordResets.usedAt), lt(passwordResets.usedAt, spent)),
            and(isNull(passwordResets.usedAt), lt(passwordResets.expiresAt, spent)),
          ),
        )
        .returning({ id: passwordResets.id })
        .all().length;

      for (const row of tx.select().from(classrooms).all()) {
        const end = schoolYearEnd(row.schoolYear).getTime();
        if (Number.isNaN(end) || end + STALE_CLASS_DAYS * DAY_MS >= now.getTime()) continue;
        const { detached, deleted } = removeClass(tx, row);
        report.classes++;
        report.pupilsDetached += detached;
        report.pupilsDeleted += deleted;
      }

      const lastActivity = sql`coalesce(${parentUsers.lastSeenAt}, ${parentUsers.createdAt})`;
      report.accounts = tx
        .delete(parentUsers)
        .where(
          and(
            ne(parentUsers.role, 'admin'),
            isNull(parentUsers.familyId),
            notExists(
              tx
                .select({ userId: schoolMembers.userId })
                .from(schoolMembers)
                .where(eq(schoolMembers.userId, parentUsers.id)),
            ),
            lt(lastActivity, now.getTime() - ORPHAN_ACCOUNT_DAYS * DAY_MS),
          ),
        )
        .returning({ id: parentUsers.id })
        .all().length;

      if (dryRun) throw new DryRun();
    });
  } catch (error) {
    if (!(error instanceof DryRun)) throw error;
  }
  return report;
}

/** Une ligne pour le journal : des nombres, jamais de noms. */
export function describeRetention(r: RetentionReport): string {
  return (
    `Conservation : ${r.sessions} session(s) expirée(s), ${r.invitations} invitation(s) et ` +
    `${r.resets} code(s) de réinitialisation périmés, ${r.classes} classe(s) d'années passées ` +
    `(${r.pupilsDeleted} élève(s) sans famille supprimé(s), ${r.pupilsDetached} rendu(s) à leur ` +
    `famille), ${r.accounts} compte(s) sans école ni famille supprimé(s).`
  );
}
