# Stage 1: Dependencies
FROM oven/bun:1.3.1-alpine AS deps
WORKDIR /app
ENV HUSKY=0

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Next/Turbopack needs native Node resolution for hashed external-package links.
FROM node:22-alpine AS development
WORKDIR /app
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
ENV HUSKY=0
COPY --from=deps /usr/local/bin/bun /usr/local/bin/bun
RUN ln -s bun /usr/local/bin/bunx && \
    apk add --no-cache openjdk17-jre-headless openssl && chown node:node /app
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
USER node
COPY --chown=node:node . .
RUN bun run apk:setup && \
    DATABASE_URL=mysql://guardian:guardian_dev@db:3306/guardian_lab bunx prisma generate
EXPOSE 3000
CMD ["sh", "docker/app/dev-entrypoint.sh"]

# Stage 2: Builder
# Reuse the native Node runtime and verified JADX installation from development.
FROM development AS builder
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
# Prisma generation/build must never require the production database or secrets.
ENV DATABASE_URL=mysql://guardian:build_only@127.0.0.1:3306/guardian_lab
ENV NODE_ENV=production

RUN node node_modules/prisma/build/index.js generate && node node_modules/next/dist/bin/next build

# Stage 3: Runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Non-root user for security
RUN apk add --no-cache openjdk17-jre-headless openssl
COPY --from=deps /usr/local/bin/bun /usr/local/bin/bun

# Keep the locked Prisma CLI and generated engines for the one-off migration job.
# No package installation or tool download takes place on the production server.
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/.tools/jadx ./.tools/jadx
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/lib ./lib
COPY --from=builder --chown=node:node /app/tsconfig.json ./tsconfig.json
COPY --from=builder --chown=node:node /app/docker/app/migrate.sh ./docker/app/migrate.sh
RUN mkdir -p .next/cache && chown -R node:node .next

USER node

EXPOSE 3000

CMD ["node", "server.js"]
