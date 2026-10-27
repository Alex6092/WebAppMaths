import type { SessionStore } from '../auth/session';
import type { Config } from '../config';
import type { Db } from '../db/client';
import type { TtsService } from '../tts/service';

export interface Deps {
  db: Db;
  config: Config;
  sessions: SessionStore;
  /** La voix du serveur (Piper), ou null si elle n'est pas installée. */
  tts: TtsService | null;
}
