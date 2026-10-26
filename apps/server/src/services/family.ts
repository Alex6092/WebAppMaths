import { isGrade, type ChildDto, type MeResponse } from '@app/core';
import { and, asc, eq } from 'drizzle-orm';
import { isParentUnlocked, PARENT_UNLOCK_MS, type AuthContext } from '../auth/session';
import type { Db } from '../db/client';
import { children, families } from '../db/schema';
import { notFound } from '../errors';

type ChildRow = typeof children.$inferSelect;

export function toChildDto(row: ChildRow): ChildDto {
  return {
    id: row.id,
    firstName: row.firstName,
    avatar: row.avatar,
    grade: isGrade(row.grade) ? row.grade : 'CP',
    themeId: row.themeId,
    coins: row.coins,
    sound: row.settings.sound !== false,
  };
}

/** Enfant de la famille connectée ; toute requête sur un enfant passe par ici (cloisonnement). */
export function getFamilyChild(db: Db, familyId: number, childId: number): ChildRow {
  const child = db
    .select()
    .from(children)
    .where(and(eq(children.id, childId), eq(children.familyId, familyId)))
    .get();
  if (!child) throw notFound('child_not_found', 'Profil introuvable.');
  return child;
}

export function buildMe(db: Db, auth: AuthContext, version: string): MeResponse {
  const family = db.select().from(families).where(eq(families.id, auth.familyId)).get();
  if (!family) throw notFound('family_not_found', 'Famille introuvable.');
  const kids = db
    .select()
    .from(children)
    .where(eq(children.familyId, auth.familyId))
    .orderBy(asc(children.createdAt))
    .all();
  return {
    user: auth.user,
    family: { id: family.id, name: family.name },
    parentVerifiedUntil: isParentUnlocked(auth) ? auth.parentVerifiedAt! + PARENT_UNLOCK_MS : null,
    activeChildId: auth.activeChildId,
    children: kids.map(toChildDto),
    version,
  };
}
