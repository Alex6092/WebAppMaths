import { join } from 'node:path';
import { buildApp } from './app';
import { loadConfig } from './config';
import { scheduleDailyBackups } from './db/backup';
import { openDb } from './db/client';
import { ensureAdminInvitation } from './services/invitations';

const config = loadConfig();
const db = openDb(join(config.dataDir, 'app.db'));
const app = await buildApp(config, db, { warmSpeech: true });

const adminCode = ensureAdminInvitation(db, config.adminInviteCode);
if (adminCode) {
  app.log.warn(
    `Aucun compte administrateur. Inscris-toi avec ce code d'invitation (valable 7 jours) : ${adminCode}`,
  );
}

scheduleDailyBackups(db, join(config.dataDir, 'backups'), config.backupKeep, app.log);

if (!config.webDist)
  app.log.info('Interface non construite : seule l’API est servie (npm run dev lance Vite).');

const shutdown = async (signal: string) => {
  app.log.info(`${signal} reçu, arrêt…`);
  await app.close();
  db.$client.close();
  process.exit(0);
};
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

await app.listen({ port: config.port, host: config.host });
app.log.info(`Version ${config.version}, base ${config.basePath}, données ${config.dataDir}`);
