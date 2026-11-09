#!/bin/sh
set -eu

# Compose waits for the development database before starting this process.
bunx prisma generate
bunx prisma migrate deploy
bun run academy:seed

# Keep Next and its workers on native Node, even when Bun is installed.
exec /usr/local/bin/node node_modules/next/dist/bin/next dev --hostname 0.0.0.0 --port 3000
