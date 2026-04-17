@AGENTS.md

# Autopilot CRM — Project Notes for Claude

**Repository:** `https://github.com/Flap-Consulting-Internal/autopilot-crm`

> Read this file at the start of every session. It points to the up-to-date specs and
> summarises project state so you do not have to re-derive context.

## Stack

- **Next.js 16.2.2** App Router (NOT the Next.js you remember — read
  `node_modules/next/dist/docs/` before coding). `params` is `Promise<{...}>`, must be awaited.
- **Supabase Cloud** (Postgres + Auth + Realtime + RLS). Generated types live in
  `src/types/database.ts`.
- **shadcn/ui** components in `src/components/ui/` — built on **base-ui** (not Radix).
  `Dialog` is controlled via `open`/`onOpenChange` state, NOT `DialogTrigger render`.
- **Tailwind v4**, **sonner** toasts, **lucide-react** icons, **zod** validation.
- **Google Gemini SDK** (`@google/genai`) for the AI chat panel and morning summary.

## Document-first workflow

Specs live in `docs/`. Read [`docs/README.md`](./docs/README.md) for the full index.
Every phase has its own doc (`phase-2-…` through `phase-7-…`). Update the spec **before**
writing code, mark `[DRAFT]`, implement, then mark `[IMPLEMENTED]`.

## Current state (2026-04-08)

| Phase | Scope | Status |
|-------|-------|--------|
| 0–1 | Setup, schema (16 tables), RLS, auth, seed | IMPLEMENTED |
| 2 | Pipeline kanban + company detail | IMPLEMENTED |
| 3 | Cockpit (vendedor) + Dashboard (dirección) + drill-downs | IMPLEMENTED |
| 4 | Database (empresas/contactos) + notification engine | IMPLEMENTED |
| 5 | AI chat + morning summary | IMPLEMENTED |
| 6 | Cmd+K palette, polish, Docker deploy | IMPLEMENTED |
| 7 | Admin suite (pipelines, scripts, users, notifications, KPIs) | IMPLEMENTED |
| 8 | UI/UX polish (loading skeletons, error boundary, not-found page) | IMPLEMENTED |
| 9 | Empresa task calendar widget (on `/mis-tareas`: migrated sidebar→`Lista\|Calendario` tab 2026-04-16) | IMPLEMENTED |
| 10 | Multi-instance per-tenant install (branding, custom fields, feature flags) | IMPLEMENTED |
| 11 | AI data analytics + interactive visualization (SQL queries, charts, tables, citations) | IMPLEMENTED |
| — | Spanish-only UI sweep + glossary (`docs/i18n.md`) | IMPLEMENTED |
| — | Root redirect moved to proxy (Next.js 16 RootPage perf bug fix) | IMPLEMENTED |
| — | Seed overhaul — date-relative + full coverage (see `docs/seed.md`) | IMPLEMENTED |

Outstanding work is tracked in [`docs/gap-analysis.md`](./docs/gap-analysis.md) §12.
Production readiness pass (CSP, rate limits, security.txt, health probe,
logging audit, error-page audit, full lint/build green) completed 2026-04-07 —
see [§13](./docs/gap-analysis.md).

## Roles

- **vendedor** — Cockpit, own deals, own tasks, scripts (read), AI chat. **Cannot create leads** — leads are created and assigned by direccion/admin.
- **direccion** — Dashboard, all deals, KPIs, drill-downs. Creates and assigns leads. Cannot edit admin config.
- **admin** — Everything above + `/admin/*` (Phase 7 admin suite).

`requireRole('admin')` is enforced at both the layout and API levels (`requireAdmin()`
in `src/features/admin/lib/admin-guard.ts`). For the middle tier (admin OR direccion),
use `requireApiRole('admin', 'direccion')` from `src/lib/api-utils.ts`.
RLS in Postgres is the second line of defence.

## Routes overview

```
(auth)/login                     Public
(dashboard)/pipeline             Vendedor + dirección — kanban
(dashboard)/empresas             BBDD empresas
(dashboard)/empresa/[id]         Company detail
(dashboard)/contactos            BBDD contactos
(dashboard)/mis-tareas           Vendedor task inbox
(dashboard)/dashboard            Dirección KPIs + drill-down
(dashboard)/admin                Admin overview (Phase 7)
(dashboard)/admin/pipelines      A1/A2/A3/A5 — pipelines + phases
(dashboard)/admin/scripts        D1 — scripts CRUD
(dashboard)/admin/usuarios       D3 (partial) — users + roles
(dashboard)/admin/notificaciones A11–A15 — notification rules
(dashboard)/admin/kpis           A7/A8 — KPI thresholds
```

API routes mirror the same tree under `src/app/api/`. Admin endpoints live under
`src/app/api/admin/*` and all start with `requireAdmin()`.

## Conventions

- **English only** in code, comments, commits, docs, memory. UI strings in Spanish are
  the only exception.
- **300-line file cap.** Split before adding code if a file is approaching 250.
- **Forward Progress Only.** Never break existing functionality. When in doubt: add, don't
  replace.
- **Ask before architectural decisions** — folder structure, library picks, schema
  changes, state strategy. Never assume a "sensible default".
- **Always WebSearch** before using a third-party API to confirm current signatures.
- For Supabase inserts/updates that touch JSONB columns, cast to `Json` from
  `@/types/database` — `Record<string, unknown>` is too broad for the generated type.

## Deployment

| Item | Value |
|------|-------|
| VPS | `root@49.13.25.179` (Hetzner, Ubuntu 24.04) |
| URL | `https://crm.dev.flapconsulting.com` |
| Orchestration | Docker Swarm (`docker-stack.yml`) |
| Reverse proxy | Traefik v3.5.3 on `FlapDevNet` overlay network |
| Cert resolver | `letsencryptresolver` |
| Container port | 3000 |
| Health check | `GET /api/health` |
| Stacks dir | `/opt/stacks/autopilot-crm/` |
| Env vars | `.env.local` (4 vars — see `.env.example`) |

Full deployment guide: [`docs/deploy-vps.md`](./docs/deploy-vps.md).

## Testing

- **Unit tests:** `npm test` (Vitest). 269 tests across 9 files covering SQL validator,
  formatting, rate-limit, custom fields, campo schemas, AI tool helpers, and presentation tools.
  Run `npm run test:watch` for interactive mode.
- **Type check:** `npx tsc --noEmit` after every change.
- **Manual E2E:** documented in [`docs/user-guide.md`](./docs/user-guide.md).
