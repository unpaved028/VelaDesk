# Stage 1: Dependencies
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Builder
FROM node:22-alpine AS builder
WORKDIR /app

# WICHTIG: Erst Abhängigkeiten kopieren
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Umgebungsvariablen für den Build (verhindert Abstürze)
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production
ENV DATABASE_URL="file:./prisma/data/veladesk.db"
ENV VELADESK_MASTER_KEY="placeholder_for_build_only_1234567890123456"

# 1. Prisma Client explizit generieren
RUN npx prisma generate

# 2. Build ausführen (mit Error-Logging)
RUN npm run build || (echo "Build failed! Check the output above for Next.js errors." && exit 1)

# Stage 3: Runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# User-Management für Sicherheit
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Nur notwendige Dateien kopieren
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Skript für automatische Datenbank-Migrationen beim Start
COPY --chown=nextjs:nodejs entrypoint.sh ./
RUN chmod +x entrypoint.sh

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "server.js"]