# Trackly — Web

Two products, one codebase:

- **Admin Console** (`/dashboard`, `/clients`, `/projects`, `/settings`) — dark technical instrument for developers.
- **Public Client Dashboard** (`/p/<token>`) — warm, editorial, read-only dashboard clients reach through a secure single-token link.

Stack: Next.js 15 (App Router) · TypeScript (strict) · Tailwind CSS v4 · hand-rolled
shadcn-style primitives · TanStack Query · React Hook Form + Zod · Zustand ·
Sonner · Vitest + Testing Library · Playwright.

See [`DESIGN.md`](./DESIGN.md) for the visual direction ("The Studio Ledger").

## Getting started

```bash
npm install
cp .env.example .env.local   # adjust NEXT_PUBLIC_API_URL to your running API
npm run dev                  # serves on http://localhost:3002
```

## Environment

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the NestJS API incl. `/api/v1` prefix | `http://localhost:3000/api/v1` |
| `NEXT_PUBLIC_APP_URL` | Public origin of this web app (used for access links) | `http://localhost:3002` |

`.env.local` is git-ignored; commit only `.env.example`.

## Layout

```
src/
  app/
    (auth)/login|register      admin sign-in/registration
    (admin)/layout             guard + shell (sidebar, theme, logout)
    (admin)/dashboard          overview stats + recent projects
    (admin)/clients            list, create, detail (projects + archive)
    (admin)/projects           list (search/filter) + detail with tabs
    (admin)/settings           profile & password/security
    p/[token]                  PUBLIC dashboard (client-facing, read-only)
    p/invalid                  revoked/expired link state
  components/
    ui/                        button, card, input, dialog, form, skeleton…
    shared/                    pills, ProgressRing, states, pagination
    admin/                     shell, forms, project panels, EstimateTimeline
    public/                    the full client dashboard
  lib/
    api/                       typed fetch client + per-resource modules
    hooks/                     TanStack Query hooks per resource
    validation/                Zod schemas powering every form
    presentation.ts            single source of truth for status→color/icon
  stores/                      zustand auth + ui (theme) stores
```

## How auth works

- Admin: `Authorization: Bearer <accessToken>`; silent rotation via
  `POST /api/v1/auth/refresh` (single-flight retry in `lib/api/client.ts`);
  session persisted in localStorage (documented tradeoff — a production build
  would move refresh tokens into an httpOnly cookie set by a Route Handler).
- Client/public: the dashboard token is **never stored or logged**. Each request
  sends it via the `x-client-access-token` header. Access is derived purely from
  the token — never from a client-supplied project ID.

## Tests

```bash
npm run test        # Vitest component/unit tests (jsdom)
npm run test:e2e    # Playwright — requires the API AND this app both running
```

Playwright specs assume `NEXT_PUBLIC_API_URL` points at a seeded dev API and
this app on `http://localhost:3002`. The primary environment seed (`npm run
seed` in the API repo) creates `admin@trackly.dev` / `DemoPass123!` and
several client-access tokens.

Vitest runs against the components in isolation with mocked API modules —
no network required.

## Design conventions

- Every status/health/priority/visibility maps to a **color + icon** pair
  defined once in `src/lib/presentation.ts` (never color alone, WCAG AA).
- Numbers always render in JetBrains Mono with `tabular-nums`.
- Every list ships skeleton → empty → error states (`components/shared/states.tsx`).
- The progress ring, milestone stepper and estimate timeline are hand-rolled
  SVG, shared between the admin console and the public dashboard.