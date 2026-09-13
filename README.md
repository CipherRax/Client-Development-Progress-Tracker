# Client Development Progress Tracker — API

A developer-controlled client progress portal. Admins (developers/agencies) manage
clients, projects, milestones, tasks, and change requests internally. Each project
gets a secure, tokenized link that gives the client a **read-only** dashboard of
their own project — and only their own project.

This is not a project-management tool for the admin's internal workflow (it's not
Jira/Trello). It exists to eliminate "what's the status?" messages by giving clients
a self-serve, accurate, always-current view of progress.

---

## 1. Architecture

```
src/
├── auth/                 Admin registration/login/refresh/logout, JWT strategy & guard
├── profile/               Admin profile + password management
├── clients/               Client CRUD, archiving
├── projects/               Project CRUD, lifecycle (status/health/pause/resume/complete/archive)
│   └── services/           Progress calculation, timeline (ETA) calculation
├── milestones/             Milestone CRUD, status transitions, reordering
├── tasks/                  Task CRUD, status transitions
├── change-requests/        Change request creation + atomic approve/reject/cancel
├── project-updates/        Public/internal client-facing updates
├── current-work/           "What's happening now" single active item per project
├── activity/               Immutable project activity/audit log
├── client-access/          Secure token generation, revoke, regenerate (admin side)
├── public/                 Client-facing read-only API — the multi-tenant boundary
│   ├── guards/              ClientAccessGuard — the sole gatekeeper of /public/project
│   ├── mappers/             Allow-list DTOs: Public*Dto, never the raw Prisma entity
│   └── decorators/          @ClientProject() — the guard-resolved, already-authorized project
├── common/                 Shared decorators, guards, filters, interceptors, DTOs, utils
├── database/               PrismaService (global module)
└── config/                 Environment-based configuration
```

### Why the public module is structured the way it is

The single most important security property of this system is: **a client token
can never resolve to any project other than the one it was issued for.**

This is enforced structurally, not just by an authorization check:

- `ClientAccessGuard` is the *only* way into `/api/v1/public/*`. It takes the raw
  token from the request, hashes it, looks up the matching `ClientAccess` row, and
  attaches the resolved `Project` entity to `request.clientProject`.
- Every handler in `PublicController` reads `@ClientProject()` — never a client-
  supplied ID. There is no `GET /public/projects/:id` route and never will be;
  the only way to see a project publicly is to hold a valid token for it.
- Responses are built with **allow-list mappers** (`src/public/mappers/*`) that
  explicitly pick client-safe fields. Nothing ever does `return project` or spreads
  a raw Prisma entity into a public response.

See `test/app.e2e-spec.ts` → `describe('Client Access links and public API')` for
the explicit isolation test suite, including the "CRITICAL" test that attempts
parameter-tampering bypasses.

---

## 2. Technology stack

- NestJS 10 + TypeScript
- PostgreSQL + Prisma ORM
- JWT (access + rotating refresh tokens) for admin auth, Argon2id for password hashing
- SHA-256–hashed, 256-bit random tokens for client access (see §7)
- `@nestjs/throttler` for rate limiting
- Swagger/OpenAPI via `@nestjs/swagger`
- Docker + Docker Compose
- Jest (unit) + Supertest (e2e)

---

## 3. Getting started

### 3.1 Prerequisites

- Node.js 20+
- PostgreSQL 14+ (or use the provided `docker-compose.yml`)

### 3.2 Install

```bash
npm install
cp .env.example .env
# edit .env — at minimum set DATABASE_URL and strong JWT secrets
```

### 3.3 Generate the Prisma client and run migrations

```bash
npx prisma generate
npx prisma migrate dev --name init
```

> **Note on this deliverable:** this project was built in a sandboxed environment
> without network access to `binaries.prisma.sh` (Prisma's engine-binary CDN), so
> `prisma generate` could not be executed here and the compiled output has not been
> runtime-verified end-to-end. Everything **was** verified as far as possible in
> that environment: `npm install` succeeded, `tsc --noEmit` was run and every
> remaining error was confirmed to be exclusively caused by the un-generated
> Prisma client (missing enum/model exports) — there are zero unrelated type
> errors. Prisma-independent unit tests (secure token generation, date/duration
> math, and the fully-mocked `AuthService`) were actually executed and pass. Run
> `npx prisma generate` in your own environment (a normal machine or CI will reach
> `binaries.prisma.sh` without issue) and the project will compile clean.

### 3.4 Seed demo data (optional but recommended)

```bash
npm run seed
```

This creates one admin (`admin@devtracker.dev` / `DemoPass123!`), three clients,
and three projects in different states (active with an approved change request,
paused, and completed) with milestones, tasks, updates, and activity history. It
prints two live client-access tokens at the end so you can try the public API
immediately.

### 3.5 Run

```bash
npm run start:dev
```

- API: `http://localhost:3000/api/v1/...`
- Swagger: `http://localhost:3000/api/docs`

### 3.6 Docker

```bash
docker compose up -d
```

This starts PostgreSQL and the API together. The API container runs
`prisma migrate deploy` on startup before booting. Set `JWT_ACCESS_SECRET` /
`JWT_REFRESH_SECRET` in your shell or an `.env` file next to `docker-compose.yml`
before running in anything beyond local development.

---

## 4. Environment variables

See `.env.example`. Key ones:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string (Prisma format) |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Signing secrets — must be strong, random, and different from each other |
| `JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | Token lifetimes, e.g. `15m` / `7d` |
| `CLIENT_PUBLIC_URL` | Base URL used to build the `url` field returned when generating a client-access link |
| `CORS_ORIGIN` | Allowed CORS origin(s) |
| `RATE_LIMIT_TTL` / `RATE_LIMIT_LIMIT` | Global rate-limit window/count; public and auth endpoints have additional stricter per-route limits |

---

## 5. Authentication

Admin auth is JWT access + refresh, with refresh **rotation**: each call to
`/auth/refresh` revokes the presented refresh token and issues a new pair. Reusing
a revoked refresh token is rejected. Changing your password revokes all active
sessions.

```bash
# Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Jane Dev","email":"jane@agency.dev","password":"Str0ng!Passw0rd"}'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"jane@agency.dev","password":"Str0ng!Passw0rd"}'

# Authenticated request
curl http://localhost:3000/api/v1/clients \
  -H 'Authorization: Bearer <accessToken>'
```

All admin routes require `Authorization: Bearer <accessToken>` by default; routes
are opted **out** of this with `@Public()` (used only for `/auth/*` and the entire
`/public/*` namespace, which uses its own guard instead — see below).

---

## 6. Client-access links

```bash
# Generate (admin)
curl -X POST http://localhost:3000/api/v1/projects/<projectId>/client-access \
  -H 'Authorization: Bearer <accessToken>'
# => { "url": "http://localhost:3000/p/<token>", "token": "<token>", ... }

# The client's frontend calls the public API with the token as a header:
curl http://localhost:3000/api/v1/public/project \
  -H 'x-client-access-token: <token>'
```

- Only one **active** link exists per project at a time. Generating a second one
  while one is active is rejected — use `regenerate` instead, which atomically
  revokes the old one and issues a new one in a single transaction.
- The raw token is only ever returned in the `generate`/`regenerate` response body.
  Only its SHA-256 hash is stored (`ClientAccess.tokenHash`); the admin-facing
  `GET .../client-access` listing never returns it, even hashed.
- Revoking or regenerating takes effect immediately — there is no caching layer
  that could serve a stale "still valid" answer.
- Archiving a project (or disabling `clientAccessEnabled`) also blocks public
  access, independent of whether the token itself is still active.

### Token extraction

The public guard reads the token, in order of preference: the `x-client-access-token`
header, then a `Bearer` token in `Authorization`, then a `?token=` query parameter
(documented as the least secure option — query strings end up in logs/history —
kept only for convenience, e.g. testing a link by pasting it in a browser).

---

## 7. Security decisions worth calling out

- **Token hashing algorithm**: client-access tokens are generated with 256 bits of
  entropy (`crypto.randomBytes(32)`) and hashed with SHA-256 before storage, *not*
  Argon2/bcrypt. This is intentional: Argon2/bcrypt are designed to slow down
  brute-forcing of **low-entropy human passwords**. A 256-bit random token has no
  meaningful brute-force surface, so a fast, deterministic hash is both correct
  and necessary (a slow hash would make every public API request needlessly
  expensive, an easy DoS vector). Lookups compare hashes with `crypto.timingSafeEqual`
  reasoning applied at the utility level (`safeCompareHashes`); the primary lookup
  path uses a unique index on `tokenHash` for both performance and simplicity, which
  is the standard, accepted pattern for API-key-style credentials.
- **Admin passwords**: Argon2id, which *is* the right tool for human passwords.
- **Generic public-auth errors**: the `ClientAccessGuard` returns the same
  "Invalid or expired access link" message whether the token was never valid,
  revoked, or expired — this prevents an attacker from using error messages to
  fingerprint which tokens once existed.
- **Rate limiting**: a global limit (default 100 req/min, configurable) plus
  stricter per-route `@Throttle` overrides on `/auth/register` (5/min),
  `/auth/login` (10/min), `/public/project` (30/min), and especially
  `/public/project/contact` (3/min) to blunt brute-force and abuse.
- **No stack traces or internal errors leak**: `GlobalExceptionFilter` maps every
  thrown error (including raw Prisma errors) to a safe, consistent JSON shape.

---

## 8. Business rules encoded in the code

A non-exhaustive map of where the spec's business rules live:

| Rule | Where |
|---|---|
| Progress never below 0 / above 100 | `ProgressCalculationService.clamp()` |
| Milestone-weighted project progress, equal-weight fallback | `ProgressCalculationService.calculateProjectProgress()` |
| Approved change requests move the ETA; rejected/pending do not | `ChangeRequestsService.approve()` only path that calls `ProjectsService.addAdditionalTime()` |
| Original estimate is immutable; current estimate is always derived | `Project.originalEstimatedCompletionDate` is never written to after creation; `TimelineCalculationService.recalculate()` is the only place `currentEstimatedCompletionDate` is computed |
| Paused time tracked and extends the deadline | `ProjectsService.resume()` accumulates `pausedTimeDays` and recalculates |
| Two concurrent approvals can't both succeed | `ChangeRequestsService.approve()` uses a conditional `updateMany({ where: { status: PENDING }})` inside a transaction — only one concurrent caller can flip `PENDING → APPROVED` |
| Completed projects require 100% progress + audit event | `ProjectsService.complete()` |
| Internal updates/tasks never reach the client | Public queries filter `visibility: PUBLIC` / `clientVisible: true` at the database level, never in application code after the fact |
| Client access revocation is immediate and independent of project archival | `ClientAccessGuard` checks both `access.active` and `project.archivedAt`/`clientAccessEnabled` |
| Activity log is immutable | No update/delete endpoint exists for `ProjectActivity`; it's only ever created |

---

## 9. Interpretation decisions (spec ambiguities)

Per the instruction to resolve ambiguities toward the safest, most maintainable
interpretation and document the choice here:

1. **Generic status-change endpoint vs. `COMPLETED`/`ARCHIVED`**: the spec lists
   both a generic `PATCH /projects/:id/status` and dedicated `/complete` and
   `/archive` endpoints. To avoid two different code paths being able to reach the
   same terminal state with different side effects (e.g. skipping the "are
   milestones done?" check), the generic endpoint explicitly rejects `COMPLETED`
   and `ARCHIVED` as targets and tells the caller to use the dedicated endpoint.
2. **One active client-access link per project**: the spec doesn't say whether
   multiple simultaneously-valid links are allowed. I chose to disallow it
   (`generate` fails if one is already active; `regenerate` is the explicit,
   audited way to replace it) because multiple live links widen the credential
   surface with no stated benefit, and "regenerate invalidates the previous link"
   (spec §33) reads as the intended single-active-link model.
3. **Deleting clients/projects with history**: the spec lists a `DELETE`
   endpoint for both but also says historical records should be preserved. I
   implemented `DELETE` as a genuinely destructive operation that's only allowed
   when there's no history to lose (a client with zero projects; a project with
   no milestones/change-requests/updates/activity beyond its creation event).
   Otherwise it returns 409 and points at the archive endpoint instead.
4. **Forcing project completion with incomplete milestones**: allowed, but
   requires `force: true` **and** a `reason` string, and both are recorded on the
   `PROJECT_COMPLETED` activity event, per §26's instruction that an override
   must be recorded in the audit history.
5. **Milestone deletion**: allowed only when the milestone has zero tasks and is
   not `COMPLETED`, to satisfy "delete milestones where safe" (§14) without
   silently discarding task or completion history.
6. **Change-request visibility to the client**: a change request becomes
   `clientVisible: true` automatically the moment it's approved (so the client
   sees *why* their timeline moved), matching §20's "make the approved change
   visible to the client if appropriate." Pending/rejected ones are never
   client-visible.
7. **Public API auth mechanism**: the spec shows `GET /api/public/project` "with
   the token supplied securely" without specifying exactly how. I implemented a
   custom header (`x-client-access-token`) as the primary mechanism (keeps the
   token out of URLs/logs), with a `Bearer` fallback and a documented, explicitly
   less-secure query-string fallback for convenience.

---

## 10. Testing

```bash
npm run test          # unit tests
npm run test:e2e       # full e2e suite against a dedicated TEST database
npm run test:cov       # coverage
```

> **Important:** the e2e suite wipes every row in its target database. It runs
> against a **dedicated** database, never the dev/seed one. By default it derives
> it from `DATABASE_URL` by replacing `client_tracker` → `client_tracker_test`
> (create it and run `npx prisma migrate deploy` with the test URL once),
> or set `TEST_DATABASE_URL` explicitly.

The e2e suite (`test/app.e2e-spec.ts`) exercises the full admin lifecycle
(register → login → refresh rotation → logout revocation → clients → projects →
milestones → tasks → change requests → status transitions → pause/resume →
manual progress override → complete → archive) and then, critically, proves the
isolation guarantee from spec §57: it generates two tokens for two different
clients' projects and asserts that each token can only ever see its own project,
that common tampering attempts (query params, path segments) don't leak the
other project, that internal-only fields/updates/tasks never appear in the
public payload, and that revoking/regenerating a link takes effect immediately.

Lifecycle integrity is also asserted: completed projects hold at 100% progress
even if milestones/tasks change afterwards, reopening a completed task/milestone
clears its completion timestamp and recomputes progress, pause remembers the
pre-pause status and resume restores it while extending the ETA by exactly the
paused days, and cancelled projects reject further lifecycle/milestone changes.

Unit tests cover the calculation-heavy, easy-to-get-subtly-wrong logic in
isolation: progress weighting and milestone/next-milestone selection, UTC-safe
date arithmetic, timeline recalculation (the September-10-to-September-17 example
from §60), secure token generation/hashing, and the full `AuthService` (register/
login/refresh-rotation/logout) against a mocked Prisma layer.

---

## 11. API summary

Full documentation is generated at `/api/docs` (Swagger UI). High-level surface:

```
/api/v1/auth/{register,login,refresh,logout,me}
/api/v1/profile[/password]
/api/v1/clients[/:id[/archive]]
/api/v1/projects[/:id[/status|/health|/pause|/resume|/complete|/archive|/progress-override]]
/api/v1/projects/:projectId/milestones[/reorder]
/api/v1/milestones/:id[/status]
/api/v1/milestones/:milestoneId/tasks
/api/v1/tasks/:id[/status]
/api/v1/projects/:projectId/change-requests
/api/v1/change-requests/:id[/approve|/reject|/cancel]
/api/v1/projects/:projectId/updates
/api/v1/updates/:id
/api/v1/projects/:projectId/current-work
/api/v1/projects/:projectId/activity
/api/v1/projects/:projectId/client-access[/revoke|/regenerate]
/api/v1/public/project[/contact]
```

Every response is wrapped as `{ success, data, message? }` or, for paginated
lists, `{ success, data: [...], meta: { page, limit, total, totalPages } }`.
Errors are `{ success: false, statusCode, error, message, timestamp, path }`.

---

## 12. Web frontend (`web/`)

A hand-built Next.js 15 (App Router) client for both products — the **admin
console** and the **public client dashboard**.

```
web/
├── src/
│   ├── app/                  Routes: (auth)/login|register, (admin)/dashboard|clients|projects|settings,
│   │                         p/[token] (public dashboard), p/invalid
│   ├── components/
│   │   ├── ui/               Primitives: button, card, input, label, switch, dialog, form, skeleton
│   │   ├── shared/           Pills (color/icon pairs), ProgressRing, pagination, loading/empty/error states
│   │   ├── admin/            Console: shell, stat-card, client/project forms, per-tab project panels
│   │   └── public/           Client-facing dashboard (hero, stepper, timeline, updates, contact)
│   ├── lib/
│   │   ├── api/              Typed API client (single-flight refresh) + per-resource modules + Public DTOs
│   │   ├── validation/       zod schemas mirroring the API's DTOs
│   │   ├── hooks/            TanStack Query hooks per resource
│   │   └── presentation.tsx  Single source of truth for status/health/priority color+icon pills
│   ├── stores/               zustand: auth session (persisted) + UI (theme, sidebar)
│   └── fonts/                Self-hosted latin-subset woff2 (Inter, Space Grotesk, Fraunces, JetBrains Mono)
├── e2e/smoke.spec.ts         Full-stack Playwright smoke: login → client/project → public link → revoke
└── playwright.config.ts
```

### Design language

"The Studio Ledger": warm paper (`oklch(0.97 0.006 90)`) for the public side,
dark canvas (`#0B0E12`, panels `#12161C`) for the console, brand teal
`oklch(0.66 0.13 170)`. Fraunces for the public hero, Space Grotesk for admin
headings, Inter for body, JetBrains Mono for numbers. Fonts are **vendored** and
served by `next/font/local` — no external CDN calls at runtime.

### Run

```bash
cd web
cp .env.example .env.local     # NEXT_PUBLIC_API_URL, NEXT_PUBLIC_APP_URL
npm install
npm run dev                    # http://localhost:3002
# or:
npm run build && npm run start
```

### Tests

```bash
npm run lint      # eslint --max-warnings 0
npm run test      # vitest (presentation maps, validation schemas, ProgressRing, pill)
npm run test:e2e  # Playwright — requires API on :3000 (seeded) + web on :3002
```

The e2e smoke drives the real stack: admin login → create client + project +
milestone + task → the console lists it → generate a client-access link →
the public dashboard renders → revoke → the link dies.

### Local dev notes (this machine)

- Postgres runs as a **per-user cluster on `localhost:5433`** (data dir
  `~/.local/share/devtracker-pgdata`, started with
  `pg_ctl -D ~/.local/share/devtracker-pgdata -l /tmp/opencode/pg-5433.log -o "-p 5433 -h 127.0.0.1 -k /tmp" start`),
  matching `DATABASE_URL` in `.env`. `npx prisma migrate deploy` + `npm run seed`
  were applied there.
- API: `node dist/main.js` on :3000. Web: `next start -p 3002`. Both are started
  detached (`setsid`) to survive shell timeouts.
- Playwright uses the system Chromium if browsers aren't downloaded
  (`PW_EXECUTABLE_PATH=/usr/bin/chromium`); it tolerates the version skew via
  the `executablePath` option rather than Playwright's own browser bundle.
