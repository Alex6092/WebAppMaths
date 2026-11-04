/**
 * Outils d'exploitation :
 *   node dist/cli.js invite [--admin] [--days 7] [--note "Famille Martin"]
 *   node dist/cli.js school --name "École des Tilleuls" [--city Lyon]   (école + code de la direction)
 *   node dist/cli.js school --id 3                                    (nouveau code de la direction)
 *   node dist/cli.js reset --email parent@exemple.fr                  (mot de passe oublié)
 *   node dist/cli.js retention [--dry-run]                             (durée de conservation)
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
import { createAccountReset } from './services/password-reset';
import { applyRetention, describeRetention } from './services/retention';
import { createSchool, getSchool } from './services/school';

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    admin: { type: 'boolean', default: false },
    days: { type: 'string', default: '7' },
    note: { type: 'string' },
    name: { type: 'string' },
    city: { type: 'string' },
    id: { type: 'string' },
    email: { type: 'string' },
    'dry-run': { type: 'boolean', default: false },
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
  case 'school': {
    const db = openDb(dbFile);
    const school = values.id
      ? getSchool(db, Number(values.id))
      : values.name
        ? createSchool(db, { name: values.name, city: values.city ?? null })
        : null;
    if (!school) {
      console.log('Indique --name "Nom de l’école" (nouvelle école) ou --id N (école existante).');
      process.exitCode = 1;
    } else {
      const { code, expiresAt } = createInvitation(db, {
        role: 'direction',
        familyId: null,
        schoolId: school.id,
        createdBy: null,
        note: `Direction : ${school.name}`,
        expiresInDays: Number(values.days),
      });
      console.log(`École n° ${school.id} : ${school.name}`);
      console.log(`Code d'invitation de la direction : ${code}`);
      console.log(`Valable jusqu'au ${new Date(expiresAt).toLocaleString('fr-FR')}`);
    }
    db.$client.close();
    break;
  }
  case 'reset': {
    if (!values.email) {
      console.log('Indique --email adresse@du.compte');
      process.exitCode = 1;
      break;
    }
    const db = openDb(dbFile);
    try {
      const { code, expiresAt } = createAccountReset(db, values.email, null);
      console.log(`Code de réinitialisation pour ${values.email} : ${code}`);
      console.log(
        `À saisir après « Mot de passe oublié ? » (écran de connexion), avant le ${new Date(expiresAt).toLocaleString('fr-FR')}`,
      );
    } catch (error) {
      console.log(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
    db.$client.close();
    break;
  }
  case 'retention': {
    // Ce que la tâche de nuit efface ; --dry-run montre sans rien supprimer.
    const db = openDb(dbFile);
    const dryRun = values['dry-run'];
    if (!dryRun) {
      const dir = join(config.dataDir, 'backups');
      console.log(`Sauvegarde : ${await backupDatabase(db, dir, 'pre-retention')}`);
      pruneBackups(dir, 'pre-retention', 5);
    }
    console.log(
      `${dryRun ? '(simulation) ' : ''}${describeRetention(applyRetention(db, { dryRun }))}`,
    );
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
      'Commandes : invite [--admin] [--days N] [--note "…"] | school --name "…" [--city …] | school --id N | reset --email … | retention [--dry-run] | backup [--label nom] [--keep N]',
    );
    process.exitCode = 1;
}
