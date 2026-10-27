#!/usr/bin/env bash
# Installe Piper et ses voix (la voix du serveur) ; lancé par deploy.sh.
#   piper.sh <dossier>      (en général $APP_HOME/piper)
#
# Les fichiers listés dans deploy/piper.lock sont téléchargés et leur empreinte SHA-256 vérifiée.
# Rien n'est retéléchargé tant que piper.lock ne change pas. En cas d'échec, l'ancienne
# installation reste en place (ou aucune : l'app garde alors la voix du navigateur).
set -euo pipefail

DEST="${1:?usage: piper.sh <dossier>}"
LOCK="$(cd "$(dirname "$0")" && pwd)/piper.lock"

log() { echo "[piper] $*"; }

if [ -f "$DEST/.lock" ] && cmp -s "$LOCK" "$DEST/.lock"; then
  log "Voix du serveur à jour."
  exit 0
fi

mkdir -p "$(dirname "$DEST")"
WORK="$(mktemp -d "$DEST.XXXXXX")"
trap 'rm -rf "$WORK"' EXIT
mkdir -p "$WORK/new/voices" "$WORK/download"

while read -r sha url target; do
  if [ -z "$sha" ] || [ "${sha:0:1}" = "#" ]; then continue; fi
  file="$WORK/download/$(basename "$url")"
  log "Téléchargement de $(basename "$url")"
  curl -fsSL --retry 3 --max-time 900 -o "$file" "$url"
  echo "$sha  $file" | sha256sum --check --quiet -
  if [ "$target" = "piper/" ]; then
    tar -xzf "$file" -C "$WORK/new"
  else
    cp "$file" "$WORK/new/$target"
  fi
done < "$LOCK"

cp "$LOCK" "$WORK/new/.lock"
# Bascule : l'app relancée juste après trouve la nouvelle installation complète.
rm -rf "$DEST.old"
if [ -d "$DEST" ]; then mv "$DEST" "$DEST.old"; fi
mv "$WORK/new" "$DEST"
rm -rf "$DEST.old"
log "Voix du serveur installée dans $DEST."
