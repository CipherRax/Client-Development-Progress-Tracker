# ------------------------------------------------------------------
# Trackly — combined image: NestJS API + Next.js dashboard
# Single container, both processes. The Next.js server is the public
# entry point and rewrites /api/* to the internal NestJS server.
# ------------------------------------------------------------------

FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat

# ════════════════════════ BACKEND (NestJS) ════════════════════════

FROM base AS backend-deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci --include=dev

FROM backend-deps AS backend-prisma
RUN for i in 1 2 3 4 5; do npx prisma generate && break || sleep 5; done

FROM base AS backend-build
COPY --from=backend-deps /app/node_modules ./node_modules
COPY --from=backend-prisma /app/node_modules/.prisma ./node_modules/.prisma
COPY . .
RUN npm run build

# ════════════════════════ FRONTEND (Next.js) ══════════════════════

FROM base AS web-deps
WORKDIR /app/web
COPY web/package.json web/package-lock.json ./
COPY web/shims ./shims
RUN npm ci

FROM base AS web-build
WORKDIR /app/web
COPY --from=web-deps /app/web/node_modules ./node_modules
COPY web ./
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ════════════════════════ PRODUCTION ══════════════════════════════

FROM base AS production
ENV NODE_ENV=production

# Backend production dependencies + Prisma
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci --omit=dev
COPY --from=backend-prisma /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=backend-build /app/dist ./dist

# Frontend standalone runtime (+ static assets).
# Next 15 nests the standalone server under a <package-name> folder.
COPY --from=web-build /app/web/.next/standalone ./web/standalone
COPY --from=web-build /app/web/.next/static ./web/standalone/web/.next/static

COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider "http://localhost:${PORT:-3000}/api/docs" || exit 1

CMD ["sh", "./entrypoint.sh"]