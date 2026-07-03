#!/bin/sh
# LetsWork Alpha — arranca el servidor de producción en :3000
export PATH="/home/opencode/.local/node/bin:$PATH"
cd "$(dirname "$0")"
node node_modules/next/dist/bin/next start -H 0.0.0.0 -p 3000
