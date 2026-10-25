import type { SessionStore } from '../auth/session';
import type { Config } from '../config';
import type { Db } from '../db/client';

export interface Deps {
  db: Db;
  config: Config;
  sessions: SessionStore;
}
