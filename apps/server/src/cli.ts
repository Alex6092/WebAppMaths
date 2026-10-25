/**
 * Outils d'exploitation :
 *   node dist/cli.js invite [--admin] [--days 7] [--note "Famille Martin"]
 *   node dist/cli.js backup [--label pre-deploy]
 * (en dev : npm run cli -w @app/server -- invite --admin)
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { loadConfig } from './config';
import { backupDatabase, pruneBackups } from './db/backup';
import { openDb } from './db/client';
import { createInvitation } from './services/invitations';

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    admin: { type: 'boolean', default: false },
    days: { type: 'string', default: '7' },
    note: { type: 'string' },
    label: { type: 'string', default: 'manual' },
    keep: { type: 'string', default: '10' },
  },
});

const config = loadConfig();
const dbFile = join(config.dataDir, 'app.db');

switch (positionals[0]) {
  case 'invite': {
    const db = openDb(dbFile);
    const { code, expiresAt } = createInvitation(db, {
      role: values.admin ? 'admin' : 'parent',
      familyId: null,
      createdBy: null,
      note: values.note ?? null,
      expiresInDays: Number(values.days),
    });
    console.log(`Code d'invitation ${values.admin ? 'administrateur' : 'famille'} : ${code}`);
    console.log(`Valable jusqu'au ${new Date(expiresAt).toLocaleString('fr-FR')}`);
    db.$client.close();
    break;
  }
  case 'backup': {
    if (!existsSync(dbFile)) {
      console.log(`Pas encore de base (${dbFile}) : rien à sauvegarder.`);
      break;
    }
    // Pas de migration ici : on sauvegarde la base telle qu'elle est, avant un déploiement.
    const db = openDb(dbFile, { migrate: false });
    const dir = join(config.dataDir, 'backups');
    const file = await backupDatabase(db, dir, values.label);
    pruneBackups(dir, values.label, Number(values.keep));
    console.log(file);
    db.$client.close();
    break;
  }
  default:
    console.log(
      'Commandes : invite [--admin] [--days N] [--note "…"] | backup [--label nom] [--keep N]',
    );
    process.exitCode = 1;
}
