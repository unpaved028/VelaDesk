# Stage 1: Dependencies
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Builder
FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Saubere ENV-Syntax
ENV NEXT_TELEMETRY_DISABLED="1"
ENV NODE_ENV="production"
ENV DATABASE_URL="file:./build-dummy.db"
ENV VELADESK_MASTER_KEY="placeholder_for_build_only_1234567890123456"

# Match the runner OpenSSL 3.x so Prisma generates linux-*-openssl-3.0.x engines
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Prisma & Build ausführen
RUN npx prisma generate
RUN npx prisma db push --skip-generate
RUN npm run build

# Stage 3: Runner
FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV="production"
ENV NEXT_TELEMETRY_DISABLED="1"
ENV PORT="3000"
ENV HOSTNAME="0.0.0.0"
ENV HOME="/tmp"

# OpenSSL for Prisma engine detection (bookworm-slim is otherwise missing it)
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Benutzerrechte für Sicherheit
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Dateien aus dem Builder kopieren
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Entrypoint kopieren
COPY --chown=nextjs:nodejs entrypoint.sh ./
COPY --chown=nextjs:nodejs scripts/apply-sqlite-migrations.cjs ./scripts/apply-sqlite-migrations.cjs
RUN chmod +x entrypoint.sh

USER nextjs
EXPOSE 3000

CMD ["./entrypoint.sh", "node", "server.js"]