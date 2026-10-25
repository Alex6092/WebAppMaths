# Cartable magique (nom provisoire)

Application d'apprentissage pour l'école élémentaire, puis le collège : exercices générés à
l'infini, organisés par **matière → domaine → notion → exercice → niveaux**, avec un suivi de la
progression par enfant, des ambiances à collectionner et des comptes famille.

L'app CP d'origine (« Maths Magiques ») est conservée dans [`legacy/index.html`](legacy/index.html).

## Structure

```
apps/web        Interface (Svelte 5 + Vite) : profils, exercices, boutique, espace parent
apps/server     API (Fastify + SQLite/Drizzle) : comptes, séances, recorrection, sauvegardes
packages/core   Contrat des plugins, RNG à graine, logique des widgets, progression
packages/content Catalogue et plugins d'exercices (un dossier = un exercice)
packages/themes Ambiances : couleurs, mascotte, monnaie, récompenses
scripts/        Génération du registre des plugins, création d'un exercice
deploy/         Paquet de livraison, Docker, systemd, script de déploiement
e2e/            Tests de bout en bout (Playwright, vues PC et tablette)
```

## Démarrer en développement

Node **24** recommandé (Node 20.9 minimum).

```bash
npm install
```

```bash
npm run dev
```

L'interface est sur http://localhost:5173 (Vite), l'API sur le port 3000. Au premier lancement,
la console du serveur affiche un **code d'invitation administrateur** : clique sur « J'ai un code
d'invitation » pour créer le compte. La base locale est dans `data/app.db`.

| Commande                                            | Rôle                                                              |
| --------------------------------------------------- | ----------------------------------------------------------------- |
| `npm test`                                          | tests unitaires, test de contrat de tous les plugins, tests d'API |
| `npm run test:e2e`                                  | parcours complets dans un navigateur (après `npm run build`)      |
| `npm run lint` / `npm run typecheck`                | qualité du code                                                   |
| `npm run build`                                     | construit l'interface et le serveur                               |
| `npm run new:exercise -- <matière>/<domaine>/<nom>` | crée un nouvel exercice                                           |
| `npm run db:generate -w @app/server`                | crée une migration après un changement du schéma                  |

## Documentation

- [Ajouter un exercice](docs/ajouter-un-exercice.md)
- [Déploiement au lycée et CI/CD](docs/deploiement.md)

## Note sur Node 20

Avec Node 20 (avant 20.19), deux sous-dépendances récentes de Fastify ne se chargent pas.
`package.json` fixe donc `light-my-request` (override) et `@fastify/cookie` sur des versions
compatibles. Une fois le poste de développement passé à Node 24, ces deux réglages peuvent être
retirés. npm 10.5 (livré avec Node 20.13) a aussi un bug d'installation avec ce projet ; en
attendant, `npx npm@10.9.4 install` fonctionne.
