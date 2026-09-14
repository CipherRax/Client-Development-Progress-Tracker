# ── Base ───────────────────────────────────────────────────────────
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat

# ── Dependencies (full tree incl. prisma CLI) ─────────────────────
FROM base AS deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci --include=dev

# ── Prisma engine generation ───────────────────────────────────────
# Generates the client + downloads engine binaries ONCE here so the
# production stage never needs to reach binaries.prisma.sh.
FROM deps AS prisma
RUN for i in 1 2 3 4 5; do npx prisma generate && break || sleep 5; done

# ── Build ──────────────────────────────────────────────────────────
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=prisma /app/node_modules/.prisma ./node_modules/.prisma
COPY . .
RUN npx prisma generate
RUN npm run build

# ── Production ─────────────────────────────────────────────────────
FROM base AS production
ENV NODE_ENV=production

COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci --omit=dev

# Copy the already-generated Prisma client + engine binaries
COPY --from=prisma /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/dist ./dist

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/docs || exit 1

CMD ["node", "dist/main.js"]