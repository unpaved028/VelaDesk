# Stage 1: Dependencies
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Builder
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Prisma Client generieren
RUN npx prisma generate
# Next.js Build (Telemetry deaktiviert für Privacy)
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

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