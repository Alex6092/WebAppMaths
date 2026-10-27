# Déploiement au lycée

Chaque push sur `main` déclenche la chaîne suivante :

1. **CI** (`.github/workflows/ci.yml`, sur les serveurs de GitHub) : lint, typage, tests,
   build, tests de bout en bout, puis fabrication du **paquet de livraison** `release.tar.gz`
   (serveur, interface et dépendances de production pour Linux x64 / Node 24).
2. **Déploiement** (`.github/workflows/deploy.yml`, sur le **runner auto-hébergé du lycée**) :
   `deploy/deploy.sh` sauvegarde la base, installe la nouvelle version, la démarre et attend que
   `/api/health` annonce le bon commit. En cas d'échec, l'ancienne version et la base sauvegardée
   reviennent automatiquement, et le job échoue (GitHub t'envoie un e-mail).

Le runner n'ouvre qu'une connexion **sortante** vers github.com : aucun port entrant à ouvrir.

## Installation (une seule fois)

Prérequis sur le serveur : Linux x64, `curl`, et soit **Docker** (avec le plugin compose, mode
recommandé), soit **Node 24** (mode systemd).

### 1. Utilisateur et dossiers

```bash
sudo useradd --system --create-home --shell /bin/bash webappmaths
sudo mkdir -p /opt/webappmaths/data
sudo chown -R webappmaths:webappmaths /opt/webappmaths
sudo cp deploy/app.env.example /opt/webappmaths/app.env   # puis adapter
sudo chown webappmaths:webappmaths /opt/webappmaths/app.env && sudo chmod 600 /opt/webappmaths/app.env
```

- **Mode Docker** : `sudo usermod -aG docker webappmaths`. Attention : le groupe docker donne
  des droits équivalents à root ; réserve ce compte à cet usage.
- **Mode systemd** : installe Node 24, copie `deploy/webappmaths.service` dans
  `/etc/systemd/system/`, `sudo systemctl daemon-reload && sudo systemctl enable webappmaths`,
  puis autorise uniquement le pilotage du service (`sudo visudo -f /etc/sudoers.d/webappmaths`) :

  ```
  webappmaths ALL=(root) NOPASSWD: /usr/bin/systemctl restart webappmaths, /usr/bin/systemctl stop webappmaths
  ```

### 2. Runner GitHub

Dans GitHub : _Settings → Actions → Runners → New self-hosted runner_ (Linux x64), puis, connecté
en tant que `webappmaths` :

```bash
./config.sh --url https://github.com/Alex6092/WebAppMaths --token <jeton> --labels lycee --unattended
sudo ./svc.sh install webappmaths && sudo ./svc.sh start
```

Si le réseau du lycée passe par un proxy HTTP, ajoute `https_proxy=http://proxy:port` (et
`no_proxy=127.0.0.1,localhost`) dans le fichier `.env` du runner.

### 3. Environnement « production » dans GitHub

_Settings → Environments → New environment_ `production` :

- **Deployment branches** : `main` uniquement.
- **Variables** (facultatives, valeurs par défaut entre parenthèses) :
  `DEPLOY_MODE` (`docker`) ou `systemd` ; `APP_HOME` (`/opt/webappmaths`) ;
  `HEALTH_URL` (`http://127.0.0.1:3000/api/health`, à adapter si `BASE_PATH` n'est pas `/`,
  par exemple `http://127.0.0.1:3000/apprendre/api/health`).

### 4. Sécurité du dépôt

- **Dépôt public = risque** : passe-le en privé, ou exige une approbation pour les workflows des
  contributeurs externes (_Settings → Actions → General_). Le workflow de déploiement ne tourne
  que sur `main` après une CI réussie, jamais pour une pull request.
- Protège `main` (_Settings → Branches_) : la CI doit passer avant toute fusion.

### 5. Reverse proxy

Exemple nginx (l'app écoute sur `127.0.0.1:3000`) :

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Si l'app est publiée sous un sous-chemin (`/apprendre/`), garde le préfixe dans `proxy_pass`
(pas de réécriture) et règle `BASE_PATH=/apprendre/` dans `app.env`. Si le proxy est sur une
autre machine, règle `TRUST_PROXY` sur son adresse, et en mode Docker `BIND_ADDRESS` (variable
d'environnement du runner) sur l'adresse interne du serveur.

### 6. Premier démarrage : le compte administrateur

Au premier démarrage, la base est vide : le serveur écrit dans ses journaux un **code
d'invitation administrateur** (valable 7 jours) :

```bash
docker logs webappmaths 2>&1 | grep invitation       # mode Docker
journalctl -u webappmaths | grep invitation          # mode systemd
```

Ouvre l'app, clique sur « J'ai un code d'invitation », et crée ton compte. Depuis l'espace parent,
tu peux ensuite inviter d'autres familles. Pour générer un nouveau code en ligne de commande :

```bash
docker exec webappmaths node apps/server/dist/cli.js invite --admin             # Docker
DATA_DIR=/opt/webappmaths/data node /opt/webappmaths/current/apps/server/dist/cli.js invite   # systemd
```

## La voix du serveur (Piper)

Les consignes, les dictées et l'anglais sont lus par [Piper](https://github.com/rhasspy/piper)
sur le serveur : la même voix sur tous les appareils, sans dépendre des voix de la tablette.

- **Installation :** chaque déploiement lance `deploy/piper.sh`. Il télécharge Piper et deux voix
  (siwis en français, alba en anglais britannique, données sous licence CC BY 4.0) dans
  `/opt/webappmaths/piper`, et vérifie leur empreinte SHA-256 (`deploy/piper.lock`). Il ne
  retélécharge rien tant que `piper.lock` ne change pas. Il faut un accès sortant à github.com et
  huggingface.co (environ 130 Mo la première fois).
- **Sans réseau ou si l'installation échoue :** le déploiement continue et l'app garde la voix du
  navigateur. `GET /api/health` indique `"tts": "on"` ou `"off"`.
- **Charge :** `TTS_WORKERS` phrases fabriquées en même temps (par défaut le nombre de cœurs − 1,
  3 au plus). Une consigne prend environ 0,3 s sur un cœur. Au-delà de 50 phrases en attente, le
  serveur répond 503 et l'app passe à la voix du navigateur.
- **Cache :** les phrases déjà fabriquées sont gardées dans `data/tts/cache` (`TTS_CACHE_MB`,
  500 Mo par défaut ; les moins écoutées sont effacées).
- **Processeur :** sous Proxmox, le type de processeur `host` (ou `x86-64-v3`) donne les
  instructions AVX2 : Piper va deux fois plus vite qu'avec le type générique.
- **En développement :** dépose Piper pour ta plateforme dans `piper/piper/` et les voix dans
  `piper/voices/` à la racine du dépôt (dossier ignoré par git), ou indique un autre dossier avec
  `TTS_DIR`.

## Sauvegardes et restauration

- Une sauvegarde **quotidienne** est faite par le serveur (`data/backups/app-…-daily.db`, 14
  conservées), et une autre **avant chaque déploiement** (`…-pre-deploy.db`, 10 conservées).
- Restaurer : arrêter l'app, copier la sauvegarde sur `data/app.db`, supprimer `app.db-wal` et
  `app.db-shm`, redémarrer.

  ```bash
  docker stop webappmaths            # ou : sudo systemctl stop webappmaths
  cp /opt/webappmaths/data/backups/app-AAAAMMJJ-HHMMSS-daily.db /opt/webappmaths/data/app.db
  rm -f /opt/webappmaths/data/app.db-wal /opt/webappmaths/data/app.db-shm
  docker start webappmaths           # ou : sudo systemctl start webappmaths
  ```

- Pense à copier `data/backups/` hors du serveur de temps en temps (sauvegarde du lycée, NAS…).

## Revenir à une version précédente à la main

Les 5 dernières versions sont gardées dans `/opt/webappmaths/releases/`. Le plus simple : relancer
le workflow « Déploiement » d'un ancien commit depuis l'onglet _Actions_ de GitHub (_Re-run_).
