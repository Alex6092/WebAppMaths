#!/usr/bin/env bash
# Fabrique build/release.tar.gz (lancé par la CI après le build) :
# serveur, interface et dépendances de production déjà installées pour Linux x64 / Node 24.
# Le serveur du lycée n'a donc pas besoin d'accéder à npm.
#   deploy/package.sh <sha>
set -euo pipefail

SHA="${1:?usage: deploy/package.sh <sha>}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAGE="$ROOT/build/release"

rm -rf "$ROOT/build"
mkdir -p "$STAGE"

cp "$ROOT/package.json" "$ROOT/package-lock.json" "$STAGE/"
for ws in apps/server apps/web packages/core packages/content packages/themes; do
  mkdir -p "$STAGE/$ws"
  cp "$ROOT/$ws/package.json" "$STAGE/$ws/"
done
cp -r "$ROOT/apps/server/dist" "$STAGE/apps/server/dist"
cp -r "$ROOT/apps/web/dist" "$STAGE/apps/web/dist"
cp -r "$ROOT/deploy" "$STAGE/deploy"
echo "$SHA" > "$STAGE/VERSION"

(cd "$STAGE" && npm ci --omit=dev --no-audit --no-fund)

tar -czf "$ROOT/build/release.tar.gz" -C "$STAGE" .
echo "Paquet : build/release.tar.gz ($(du -h "$ROOT/build/release.tar.gz" | cut -f1))"
