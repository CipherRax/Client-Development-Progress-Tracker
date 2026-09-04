# ── Base ───────────────────────────────────────────────────────────
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl

# ── Dependencies ───────────────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm install

# ── Build ──────────────────────────────────────────────────────────
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ── Production ─────────────────────────────────────────────────────
FROM base AS production
ENV NODE_ENV=production

COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm install --omit=dev
RUN npx prisma generate

COPY --from=build /app/dist ./dist

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/docs || exit 1

CMD ["node", "dist/main.js"]
