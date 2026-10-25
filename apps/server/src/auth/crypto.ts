import { hash, verify } from '@node-rs/argon2';
import { createHash, randomBytes, randomInt } from 'node:crypto';

// argon2id avec les paramètres minimaux recommandés par l'OWASP (19 Mio, 2 passes).
const ARGON2 = { memoryCost: 19456, timeCost: 2, parallelism: 1 };

export function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2);
}

// Empreinte factice : on vérifie quand même un mot de passe quand le compte n'existe pas,
// pour ne pas révéler par le temps de réponse quels e-mails sont inscrits.
let dummyHash: Promise<string> | null = null;

export async function verifyPassword(
  passwordHash: string | null,
  password: string,
): Promise<boolean> {
  dummyHash ??= hashPassword('mot-de-passe-factice');
  try {
    return await verify(passwordHash ?? (await dummyHash), password);
  } catch {
    return false;
  }
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function newSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

// Sans 0/O, 1/I/L : un code se recopie sans ambiguïté.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** Code d'invitation lisible : XXXX-XXXX-XXXX (≈ 59 bits). */
export function newInvitationCode(): string {
  const chars = Array.from({ length: 12 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]);
  return [0, 4, 8].map((i) => chars.slice(i, i + 4).join('')).join('-');
}

export function normalizeInvitationCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '');
}
