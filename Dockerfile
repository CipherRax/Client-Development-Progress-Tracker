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

# Backend runtime deps (Prisma client, no CLI — CLI is copied below)
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci --omit=dev

# Prisma CLI + engines are dev-only deps, but we need `migrate deploy` at
# runtime. Copy the already-downloaded/generated artifacts so the container
# never needs to reach binaries.prisma.sh or the npm registry on boot.
COPY --from=backend-prisma /app/node_modules/prisma ./node_modules/prisma
COPY --from=backend-prisma /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=backend-prisma /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=backend-build /app/dist ./dist

# Frontend standalone runtime. The server.js entry point can be nested at
# different depths depending on the build environment, so flatten it to the
# canonical /app/web/app for the entrypoint script.
COPY --from=web-build /app/web/.next/standalone ./web/standalone-src
COPY --from=web-build /app/web/.next/static ./web/static-src
RUN SRV="$(find /app/web/standalone-src -maxdepth 3 -name server.js | head -1)" \
    && [ -n "$SRV" ] \
    && mkdir -p /app/web/app \
    && cp -R "$(dirname "$SRV")"/. /app/web/app/ \
    && mkdir -p /app/web/app/.next \
    && cp -R /app/web/static-src/. /app/web/app/.next/static/ \
    && rm -rf /app/web/standalone-src /app/web/static-src

COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider "http://localhost:${PORT:-3000}/api/docs" || exit 1

CMD ["sh", "./entrypoint.sh"]