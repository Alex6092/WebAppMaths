#!/usr/bin/env bash
# Déploie une version sur le serveur ; lancé par le runner GitHub auto-hébergé (deploy.yml).
#   deploy.sh <release.tar.gz> <sha>
#
# Étapes : sauvegarde de la base, installation, démarrage, contrôle de santé.
# Si le contrôle échoue : retour automatique à la version et à la base précédentes, et échec du job.
#
# Variables (avec leurs valeurs par défaut) :
#   APP_HOME=/opt/webappmaths   DEPLOY_MODE=docker|systemd   SERVICE_NAME=webappmaths
#   HEALTH_URL=http://127.0.0.1:3000/api/health   KEEP_RELEASES=5
set -euo pipefail

TARBALL="${1:?usage: deploy.sh <release.tar.gz> <sha>}"
SHA="${2:?usage: deploy.sh <release.tar.gz> <sha>}"
APP_HOME="${APP_HOME:-/opt/webappmaths}"
MODE="${DEPLOY_MODE:-docker}"
SERVICE="${SERVICE_NAME:-webappmaths}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3000/api/health}"
KEEP="${KEEP_RELEASES:-5}"

SHORT="${SHA:0:12}"
RELEASES="$APP_HOME/releases"
DATA="$APP_HOME/data"
CURRENT="$APP_HOME/current"
NEW="$RELEASES/$SHORT"

# En mode Docker, le conteneur tourne avec l'utilisateur du runner : les fichiers de data/ lui appartiennent.
export APP_HOME APP_UID APP_GID
APP_UID="$(id -u)"
APP_GID="$(id -g)"

log() { echo "[deploy] $*"; }

if [ "$MODE" != docker ] && [ "$MODE" != systemd ]; then
  log "DEPLOY_MODE doit valoir docker ou systemd (reçu : $MODE)"
  exit 2
fi

mkdir -p "$RELEASES" "$DATA/backups"
PREV="$( [ -L "$CURRENT" ] && readlink -f "$CURRENT" || true )"
PREV_SHORT="$( [ -n "$PREV" ] && basename "$PREV" || echo "" )"
log "Version $SHORT (précédente : ${PREV_SHORT:-aucune}), mode $MODE"

rm -rf "$NEW"
mkdir -p "$NEW"
tar -xzf "$TARBALL" -C "$NEW"

if [ "$MODE" = docker ]; then
  docker build --quiet -t "webappmaths:$SHORT" -f "$NEW/deploy/Dockerfile" "$NEW" >/dev/null
fi

run_cli() { # run_cli <version> <arguments du cli>
  local version="$1"
  shift
  if [ "$MODE" = docker ]; then
    docker run --rm --user "$APP_UID:$APP_GID" -v "$DATA:/data" -e DATA_DIR=/data \
      "webappmaths:$version" node apps/server/dist/cli.js "$@"
  else
    DATA_DIR="$DATA" node "$RELEASES/$version/apps/server/dist/cli.js" "$@"
  fi
}

start() { # start <version>
  ln -sfn "$RELEASES/$1" "$CURRENT"
  if [ "$MODE" = docker ]; then
    APP_VERSION_TAG="$1" docker compose -p webappmaths -f "$RELEASES/$1/deploy/docker-compose.yml" up -d --remove-orphans
  else
    sudo systemctl restart "$SERVICE"
  fi
}

stop() {
  if [ "$MODE" = docker ]; then
    docker stop webappmaths >/dev/null 2>&1 || true
  else
    sudo systemctl stop "$SERVICE" || true
  fi
}

healthy() { # attend que /api/health annonce la nouvelle version
  for _ in $(seq 1 30); do
    if curl -fsS "$HEALTH_URL" 2>/dev/null | grep -q "\"version\":\"$SHA\""; then
      return 0
    fi
    sleep 2
  done
  return 1
}

# 1. Sauvegarde de la base avant que la nouvelle version n'applique ses migrations.
BACKUP=""
if [ -f "$DATA/app.db" ]; then
  BACKUP_NAME="$(basename "$(run_cli "$SHORT" backup --label "pre-deploy" --keep 10 | tail -n 1)")"
  BACKUP="$DATA/backups/$BACKUP_NAME"
  log "Sauvegarde : $BACKUP"
fi

# 2. Bascule et contrôle de santé.
start "$SHORT"
if healthy; then
  log "OK : la version $SHORT est en ligne."
else
  log "ÉCHEC du contrôle de santé de $SHORT."
  stop
  if [ -n "$PREV_SHORT" ] && [ -d "$RELEASES/$PREV_SHORT" ]; then
    if [ -n "$BACKUP" ] && [ -f "$BACKUP" ]; then
      log "Restauration de la base depuis $BACKUP"
      cp "$BACKUP" "$DATA/app.db"
      rm -f "$DATA/app.db-wal" "$DATA/app.db-shm"
    fi
    log "Retour à la version $PREV_SHORT"
    start "$PREV_SHORT"
  fi
  exit 1
fi

# 3. Ménage : on garde les KEEP dernières versions (et leurs images Docker).
mapfile -t KEPT < <(ls -1t "$RELEASES")
for old in "${KEPT[@]:$KEEP}"; do
  log "Suppression de l'ancienne version $old"
  rm -rf "${RELEASES:?}/$old"
  if [ "$MODE" = docker ]; then docker rmi "webappmaths:$old" >/dev/null 2>&1 || true; fi
done
