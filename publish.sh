#!/bin/sh
# LetsWork Alpha — crea el repo, primer commit y push a GitHub en un solo paso.
# Uso:  ./publish.sh <github-user/repo> [visibility]
#   visibility = public (default) | private
set -e
if [ -z "$1" ]; then echo "Uso: $0 <usuario/repo> [public|private]"; exit 1; fi
REPO="$1"
VIS="${2:-public}"
cd "$(dirname "$0")"
if ! command -v git >/dev/null; then echo "git no instalado"; exit 1; fi
git init -q
git add -A
git -c user.name="LetsWork Alpha" -c user.email="bot@letswork.local" commit -q -m "feat: LetsWork Alpha v1.0

Next.js 15 + Drizzle/Postgres + PGlite. 27-preset minimal-pro design system.
Real-time collaboration via SSE + Postgres LISTEN/NOTIFY.
Kanban (dnd-kit) + list + calendar. Command palette (Cmd+K). Task drawer.
Railway-ready (Dockerfile + railway.json)."
echo ""
echo "Repo local listo. Ahora crea el repo vacío en GitHub (sin README) y ejecuta:"
echo "  git branch -M main"
echo "  git remote add origin git@github.com:$REPO.git"
echo "  git push -u origin main"
