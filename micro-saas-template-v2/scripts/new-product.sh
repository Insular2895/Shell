#!/usr/bin/env bash
#
# scripts/new-product.sh
# Duplique le template en un nouveau repo de produit prêt à être adapté.
#
# Usage :
#   ./scripts/new-product.sh
#   ./scripts/new-product.sh "PlaylistBrief" "playlistbrief" "playlistbrief.com" "#FF0033" "job" "https://github.com/acme/core"

set -euo pipefail

PRODUCT_NAME="${1:-}"
PRODUCT_ID="${2:-}"
DOMAIN="${3:-}"
PRIMARY_COLOR="${4:-}"
ENGINE_MODE="${5:-}"
SOURCE_REPO="${6:-}"

[ -n "$PRODUCT_NAME" ] || read -p "Nom du produit (ex: PlaylistBrief) : " PRODUCT_NAME
[ -n "$PRODUCT_ID" ] || read -p "ID kebab-case (ex: playlistbrief) : " PRODUCT_ID
[ -n "$DOMAIN" ] || read -p "Domaine (ex: playlistbrief.com) : " DOMAIN
[ -n "$PRIMARY_COLOR" ] || read -p "Couleur principale (#hex, ex: #FF0033) : " PRIMARY_COLOR
[ -n "$ENGINE_MODE" ] || read -p "Mode du moteur (job/service) : " ENGINE_MODE
[ -n "$SOURCE_REPO" ] || read -p "Repo GitHub source (URL) : " SOURCE_REPO

TARGET_DIR="../${PRODUCT_ID}-saas"

if [ -d "$TARGET_DIR" ]; then
  echo "❌ $TARGET_DIR existe déjà"
  exit 1
fi

echo "📋 Copie du template vers $TARGET_DIR…"
cp -R . "$TARGET_DIR"

cd "$TARGET_DIR"
rm -rf .git node_modules .next
git init -q

# Patch product.config.ts (remplacements simples)
sed -i.bak \
  -e "s/id: 'playlistbrief'/id: '${PRODUCT_ID}'/" \
  -e "s/name: 'PlaylistBrief'/name: '${PRODUCT_NAME}'/" \
  -e "s|domain: 'playlistbrief.com'|domain: '${DOMAIN}'|" \
  -e "s/primaryColor: '#FF0033'/primaryColor: '${PRIMARY_COLOR}'/" \
  config/product.config.ts
rm config/product.config.ts.bak

# Patch manifest.yaml
sed -i.bak \
  -e "s/^id: playlistbrief/id: ${PRODUCT_ID}/" \
  -e "s/^mode: job/mode: ${ENGINE_MODE}/" \
  engine/manifest.yaml
rm engine/manifest.yaml.bak

# Note pour Claude : le repo source à analyser
cat >> CLAUDE.md <<NOTE

---

## 🎯 Mission spécifique pour ce produit

Repo source à analyser : ${SOURCE_REPO}

Procédure :
1. Lis le repo source.
2. Identifie input / traitement / output.
3. Adapte UNIQUEMENT engine/adapter.py et config/run.schema.json.
4. Suis PORTING_CHECKLIST.md.
NOTE

echo "✅ Nouveau produit créé : $TARGET_DIR"
echo ""
echo "Étapes suivantes :"
echo "  cd $TARGET_DIR"
echo "  npm install"
echo "  cp .env.example .env.local  # → remplir les variables"
echo "  # → demander à Claude d'analyser ${SOURCE_REPO} et adapter engine/adapter.py"
