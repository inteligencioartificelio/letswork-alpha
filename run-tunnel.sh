#!/bin/sh
# LetsWork Alpha — expone el :3000 a una URL pública (localtunnel)
export PATH="/home/opencode/.local/node/bin:$PATH"
npx localtunnel --port 3000 --local-host 127.0.0.1
