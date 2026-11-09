#!/bin/sh
set -eu

# Run once under the deployment lock, before replacing the web container.
node node_modules/prisma/build/index.js migrate deploy
ALLOW_DEMO_SEED=true bun prisma/seed.ts
