# Design Direction — "The Studio Ledger"

We build **two products** on one codebase, and they must feel like they were made
by the same studio, but for different rooms of the building.

**Public Client Dashboard** — *warm, editorial, reassuring.* Clients are people
who are usually anxious about money and timelines. The dashboard reads like a
beautifully printed studio ledger or a well-made annual report: warm paper, a
distinctive serif for the hero, disciplined whitespace, unobtrusive teal "ink".
It must feel calm and credible on a phone screen opened from a WhatsApp link.

**Admin Console** — *dark technical instrument.* Developers live in dark UIs.
The console is a precision tool: ink-black surfaces, a single confident acid-teal
accent, mono-spaced numbers, sharp 1px borders instead of fuzzy shadows. It
should feel like using a well-tuned terminal and a dashboard in one.

**Why this direction.** Progress tracking is fundamentally about *trust and
accountability*. A client needs emotional reassurance; a developer needs clarity
and speed. Warm-paper + instrument-dark gives each audience the emotional mode
they actually operate in, while the shared teal/amber accent system keeps both
recognizably part of one product — the same way Linear and Vercel keep a
consistent language across public and internal surfaces.

---

## Color tokens

Defined once in `globals.css` as CSS custom properties, consumed by Tailwind v4
`@theme` so every utility (`bg-surface-…`, `text-ink-…`) is generated from the
same source of truth.

| Token | Value | Use |
|---|---|---|
| `--brand` | `oklch(0.66 0.13 170)` | Primary action, progress, links |
| `--brand-strong` | `oklch(0.55 0.14 170)` | Hover/pressed states |
| `--ink` | near-black teal-tinted neutral | Primary text (dark) |
| `--paper` | warm off-white `oklch(0.97 0.006 90)` | Public background |
| `--amber` | `oklch(0.75 0.15 75)` | Warnings: AT_RISK, AWAITING_CLIENT |
| `--danger` | `oklch(0.6 0.2 25)` | DELAYED, CANCELLED, destructive |
| `--info` | `oklch(0.6 0.13 250)` | IN_PROGRESS, TESTING |
| `--success` | `oklch(0.7 0.14 150)` | ON_TRACK, COMPLETED |

Dominant surfaces: public `paper` (#FAF7F1), admin `#0B0E12` canvas and
`#12161C` panels. Elevation is achieved with borders and slightly lifted normal
values, **not** broad `shadow-md`. Real shadows are reserved for floating thinghs
(modals, popovers, toasts).

## Type

- **Fraunces** (display serif, variable optical size) — public hero headings and
  large numbers. Warmth + editorial credibility.
- **Space Grotesk** — admin headings, buttons, labels. Technical and geometric.
- **Inter** — body copy everywhere.
- **JetBrains Mono** — every number, code, token, date/math display.

Self-hosted via `next/font` — zero external CDN at runtime.

## Spacing & shape

- 4px base scale; generous section paddings on the public page (`px-6 sm:px-10
  lg:px-16`), tight density in the admin console.
- Corners: `2px` for cards in the admin (instrument-like), `12px` on the public
  page (welcoming). Buttons are `2px` in admin, subtly rounded on public.

## Component conventions

1. **Pills** — `StatusPill`, `HealthPill`, `PriorityPill`. Color + icon pairs
   (never color alone) for WCAG AA and (spec §7).
2. **ProgressRing** — custom hand-rolled SVG with a true `stroke-dashoffset`
   sweep, animated on mount, mono percent label in the center.
3. **Milestone Stepper** — completed (filled brand), current (pulsing ring),
   upcoming (outlined), blocked (danger), with connecting lines.
4. **EstimateTimeline** — the signature visual: a drawn time axis from the
   *original* estimate to the *current* estimate, with approved change-request
   markers plotted +5d/+3d between them, recreated from real API history.
5. **Empty/error/loading states** — every list and screen ships all three, using
   skeletons that match the final layout shape.

## Dark / light

- **Admin Console: dark by default**, with a light mode toggle persisted in
  Zustand (`ui-store`).
- **Public Dashboard: light (paper) by default**, with a dark mode toggle.
  Fully responsive; the public page is explicitly optimized for small phones.