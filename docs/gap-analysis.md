# Autopilot CRM — Gap Analysis

> Spec → implementation matrix. The spec lives in
> `/home/john/Desktop/Projects/CRM/MVP - HTML y Playbook/Autopilot_CRM_Especificacion_Tecnica_Desarrollo.md`.
> Status legend: **DONE** = implemented and tested · **PARTIAL** = some pieces missing · **MISSING** = not built yet.

Last reviewed: 2026-04-12. Recent changes: Vitest unit test suite — 269
tests across 9 files (§18); Phase 11 AI data analytics + interactive
visualization (§17); `/mis-tareas` overdue TZ fix + shared task calendar
panel mounted in the cockpit right sidebar (§16); seed overhaul —
date-relative + full Phase 10 coverage (§15); Phase 10 multi-instance
per-tenant install (§14). Production readiness pass in §13.

## 1. Data model (16 tables)

| Spec object | Migration | Status | Notes |
|-------------|-----------|--------|-------|
| `usuarios` | 001 | DONE | FK to `auth.users`, role enum |
| `pipelines` | 002 | DONE | Multi-pipeline supported |
| `fases` | 002 | DONE | `tiempo_esperado`, `criterios_entrada` JSONB |
| `empresas` | 002 | DONE | All 15 spec fields, `updated_at` trigger |
| `contactos` | 002 | DONE | `es_principal` enforced |
| `deals` | 003 | DONE | `fecha_entrada_fase`, `motivo_perdida` |
| `actividades` | 003 | DONE | Immutable trigger present |
| `tareas` | 004 | DONE | `origen` enum (manual/sistema), `tipo_tarea` |
| `comisiones` | 004 | DONE | Per period, per deal |
| `scripts` | 004 | DONE | Tags array |
| `notificacion_config` | 005 | DONE | 3 disparadores seeded |
| `kpi_config` | 005 | DONE | 5 KPIs seeded |
| `kpi_snapshots` | 005 | DONE | Series for sparklines |
| `notificaciones_log` | 005 | DONE | Immutable |
| `notificaciones` | 005 | DONE | In-app inbox |
| `vistas_guardadas` | 005 | DONE | JSONB filters/columns |

**RLS:** vendedor/dirección/admin policies in 006. **Indexes:** in 007.

## 2. Roles & permissions (spec §3)

| Capability | Status | Notes |
|------------|--------|-------|
| Configure pipeline phases (admin) | DONE | `/admin/pipelines` (Phase 7) |
| Configure KPIs (admin) | DONE | `/admin/kpis` (Phase 7) |
| Configure notifications (admin) | DONE | `/admin/notificaciones` (Phase 7) |
| Configure commissions (admin) | **MISSING** | A16 deferred (formula hardcoded in seed) |
| Manage users (admin) | DONE | `/admin/usuarios` with last-admin guard |
| View dashboard (dirección) | DONE | `requireRole('admin','direccion')` |
| View own pipeline (vendedor) | DONE | RLS enforced + UI filter |
| Create/edit deals (vendedor) | DONE | Pipeline + create lead modal |
| Create/edit empresas | DONE | POST `/api/empresas` |
| Register activities | DONE | Quick activity + empresa actions |
| Manage scripts (dirección) | DONE | `/admin/scripts` full CRUD (Phase 7) |
| Reassign deals (dirección) | **MISSING** | Bulk action in BBDD (Phase 7 polish) |
| Create tasks for others (dirección) | **PARTIAL** | API supports `vendedor_asignado`, no UI picker for dirección |
| Edit targets/objectives (dirección) | DONE | KPI thresholds editor (Phase 7) |
| Cockpit (own) | DONE | `/mis-tareas` |
| Database read all | DONE | `/empresas`, `/contactos` |
| Edit BBDD (own) | DONE | Inline edit |
| Export CSV | DONE | `/api/empresas/export`, `/api/contactos/export` |

## 3. Pipeline screen (spec §4)

| Feature | Status | File / API |
|---------|--------|------------|
| Kanban columns from `fases` | DONE | `kanban-board.tsx`, `/api/pipeline/[id]` |
| Cards from active deals | DONE | `deal-card.tsx` |
| Empresa name link | DONE | links to `/empresa/[id]` |
| Value | DONE | `formatCurrency` |
| Days in phase | DONE | `semaphore.ts` |
| Próxima acción badge | DONE | from `empresas.proxima_accion` |
| Vendedor avatar | DONE | from join |
| Semáforo (verde/ámbar/rojo) | DONE | `lib/semaphore.ts`, pulse CSS for red |
| Fuente badge | DONE | on card |
| Column counters (count + sum) | DONE | `kanban-column.tsx` |
| Drag-and-drop reorder phase | DONE | `@dnd-kit` + `/api/deals/[id]/mover` |
| Resets `fecha_entrada_fase` on move | DONE | server-side |
| Auto-creates `cambio_fase` activity | DONE | server-side |
| Filters: vendedor | DONE | `pipeline-filters.tsx` |
| Filters: value range | DONE | Task #48 |
| Filters: sector | **MISSING** | spec calls for sector select; not wired |
| Create lead modal (empresa+contacto+deal) | DONE | `create-lead-modal.tsx`, transactional |
| Quick activity (call/note/meeting) | DONE | `quick-activity.tsx` (Task #45) |
| Realtime updates (Supabase channel) | **PARTIAL** | hook subscribes; no visual highlight on incoming change |

## 4. Company detail screen (spec §5)

| Section | Status |
|---------|--------|
| Header (name, lifecycle, vendedor, total value, source) | DONE — `empresa-header.tsx` |
| General data (15 fields, inline edit) | DONE — `empresa-actions.tsx` + PATCH `/api/empresas/[id]` |
| Contacts list with badges | DONE — `empresa-contacts.tsx` |
| Active + closed deals | DONE — `empresa-deals.tsx` |
| Timeline (cronological inverse, immutable) | DONE — `empresa-timeline.tsx`, `/api/empresas/[id]/actividades` |
| Quick actions (call / note / meeting / advance phase) | DONE — `empresa-actions.tsx` |
| "+ Añadir contacto" | DONE |

## 5. Dashboard (spec §6)

| KPI tile | Status |
|----------|--------|
| Pipeline activo (€) | DONE — `/api/dashboard/kpis` |
| Conversion rate | DONE |
| Activity count | DONE — `/api/dashboard/historico?tipo=actividades` |
| Deals at risk | **PARTIAL** — surfaced as "Overdue Tasks" tile + `tareas_vencidas` drill; spec wanted a unified "deals en riesgo" KPI counting stalled deals |
| Top 5 oportunidades | **MISSING** — no top-5 tile yet |
| Sparkline 30 days per tile | DONE — `kpi-tile.tsx` (Recharts AreaChart) |
| Variation % vs previous period | DONE — `prev_kpis` (Task #43) |
| Drill-down panel per tile | DONE — `kpi-drill-dialog.tsx` (Task #47) |
| Per-vendedor breakdown table | DONE — `vendedor-table.tsx` |
| Period selector (7d / month / quarter) | DONE — `dashboard-client.tsx` |
| Historical chart: ventas cerradas/mes | DONE — bar chart |
| Historical chart: leads nuevos/mes | **MISSING** — no `leads_nuevos` historico endpoint |
| Historical chart: tiempo medio cierre | **MISSING** |
| Historical chart: tasa conversion histórica | DONE |
| Click-through to `/empresa/:id` from drill | DONE — `DrillItemList` uses `href` |

## 6. Cockpit / mis-tareas (spec §7)

| Feature | Status |
|---------|--------|
| Task inbox (urgente / alta / normal sections) | DONE — `task-list.tsx` |
| Mark "Done" creates activity + resolves task | DONE — `/api/tareas/[id]` |
| Postpone (change fecha_vencimiento) | **PARTIAL** — API supports PATCH `fecha_vencimiento`, no UI button |
| Click task → mini-ficha in sidebar | **PARTIAL** — sidebar shows KPIs + scripts; no per-task lead preview |
| Personal KPIs (pipeline, conversion, comisión) | DONE — `personal-kpis.tsx` + `/api/mis-kpis` |
| Commissions box | DONE |
| Script library (expandable) | DONE — `script-library.tsx` |
| Auto-generated tasks (sistema origen) | DONE — flagged in seed |
| Filter buttons (all / overdue / today) | DONE |

## 7. Database screen — empresas / contactos (spec §8)

| Feature | Status |
|---------|--------|
| Tab `empresas` table | DONE |
| Tab `contactos` table | DONE |
| Global search (debounced) | DONE — `useDebounce` hook |
| Filter dropdowns (stage, source, priority) | DONE |
| Sortable columns | DONE — `sortable-header.tsx` |
| Inline edit cells | DONE — `inline-edit-cell.tsx` (Task #46) |
| Pagination | DONE — `pagination.tsx` (offset/limit) |
| CSV export | DONE — `/api/empresas/export`, `/api/contactos/export` |
| Saved views (predefined) | **MISSING** — table `vistas_guardadas` exists but no UI |
| Saved views (custom) | **MISSING** |
| Bulk actions (select N, reasignar, etiquetar) | **MISSING** — no checkbox column yet |
| Infinite scroll | **PARTIAL** — uses pagination instead (acceptable per plan) |
| Import CSV | **MISSING** — bonus feature |
| Click-to-call / click-to-mail on contacts | **PARTIAL** — values shown but no `tel:` / `mailto:` anchors |

## 8. Notification engine (spec §9)

| Disparador | Status |
|------------|--------|
| Seguimiento vencido | DONE — `triggers.ts` `checkOverdueFollowUps` |
| Deal estancado | DONE — `triggers.ts` `checkStalledDeals` (1.5× factor) |
| KPI en zona roja | **MISSING** — no `checkKpiThresholds` yet |
| In-app channel (bell + panel) | DONE — `notification-bell.tsx` |
| Email channel | **MISSING** — admin suite (Phase 7) |
| Slack channel | **MISSING** — admin suite (Phase 7) |
| Immutable log (`notificaciones_log`) | **PARTIAL** — table exists, no rows written yet |

## 9. Configurable rules (spec §10) — admin / dirección

| ID | Rule | Status |
|----|------|--------|
| A1 | Pipeline phases (CRUD) | DONE — `/admin/pipelines` |
| A2 | `tiempo_esperado` per phase | DONE — phase row editor |
| A3 | `criterios_entrada` JSONB | DONE — phase row editor (PATCH supports JSON) |
| A4 | Loss reasons (motivos_perdida) | **MISSING** — hardcoded enum, no UI |
| A5 | Multiple pipelines | DONE — admin pipelines supports CRUD |
| A6 | Tags / categories / sources | **MISSING** — hardcoded enums |
| A7 | KPI thresholds | DONE — `/admin/kpis` |
| A8 | Targets / period | DONE — KPI editor `objetivo` field |
| A9 | KPI visibility (v2) | DEFERRED |
| A10 | Comparison period | DONE — period selector covers 7d/month/quarter |
| A11–A15 | Notification config | DONE — `/admin/notificaciones` |
| A16 | Commission formula | **MISSING** — hardcoded in seed |
| A17 | Custom fields | DEFERRED — out of MVP |
| A18 | Dropdown values | **MISSING** — coupled with A6 |
| D1 | Scripts CRUD | DONE — `/admin/scripts` |
| D2 | Manual tasks for vendedores | **PARTIAL** — API supports, no UI picker |
| D3 | Reassign deals | **MISSING** |
| D4 | Edit targets | DONE — KPI editor |

## 10. Invariant system rules (spec §10.3)

| ID | Rule | Status |
|----|------|--------|
| B1 | Activities immutable | DONE — trigger 007 |
| B2 | Retention 12 months | DEFERRED — operational concern |
| B3 | Initial + final phase always exist | DONE — admin DELETE refuses below 2 phases |
| B4 | Lost deal requires reason | DONE — `cerrar` route validates |
| B5 | 7 base fields always required | DONE — Zod schema |
| B6 | Max 5 KPIs in main dashboard | DONE — exactly 5 tiles |
| B7 | Semaphore green/amber/red only | DONE |
| B8 | Notification log always on | **PARTIAL** — table present, writes pending |
| B9 | Audit trail for config changes | **MISSING** — Phase 7 |
| B10 | Role separation inviolable | DONE — RLS + `requireRole` |

## 11. Wow features

| Feature | Status |
|---------|--------|
| AI Chat (Claude streaming) | DONE — `chat-panel.tsx`, `/api/chat` |
| AI Morning Summary | DONE — `morning-summary.tsx`, `/api/chat/summary` |
| Cmd+K command palette | DONE — `command-palette.tsx`, `/api/search` |
| Realtime collaboration | DONE — Supabase Realtime in pipeline hook |
| Pulsing red semáforo | DONE — CSS in `deal-card.tsx` |

## 12. Outstanding work (priority order)

1. ~~Phase 7 — admin suite~~ DONE 2026-04-06. All five sub-screens shipped (pipelines, scripts, users, notifications, KPIs).
2. **KPI red threshold trigger** (notification engine). One server function + cron tick.
3. **Top-5 oportunidades tile** + **deals-at-risk tile** (true semantics). Both already
   computable from current data.
4. **Postpone task button** + **task-to-mini-ficha sidebar wiring**. Small UI gaps.
5. **Bulk actions in BBDD** (reassign + tag). Requires checkbox column + selection state.
6. **Saved views** in BBDD (the `vistas_guardadas` table is unused).
7. **Click-to-call / click-to-mail** anchors on contacts.
8. **Email + Slack notification channels**. Admin-configurable (Phase 7).
9. **Realtime visual highlight** when an incoming `deals` change is received.
10. **Historical charts**: leads nuevos/mes, tiempo medio cierre.

## 13. Production readiness audit (2026-04-07)

Full pre-production pass. Every item below is **DONE**.

| Area | Action | Result |
|------|--------|--------|
| Build blocker | Split `CrmUser` + `hasRole` into `src/lib/auth-client.ts` so `'use client'` components no longer drag `next/headers` in via `@/lib/auth`. | `pnpm build` green on Turbopack. |
| Lint errors | `prefer-const` in `api/search`; four `react-hooks/set-state-in-effect` sites wrapped in `startTransition`. | 0 errors. |
| Lint warnings | 8 unused-symbol warnings resolved (`useRef`, `Button`, `Link`, `jsonError`, `actSpark`, `Search`, `empresaId`, `refresh`, cookie `options` pass-through). | 0 warnings. |
| CSP + headers | `src/proxy.ts` now applies `Content-Security-Policy-Report-Only`, `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and `Strict-Transport-Security` (prod only). Report-Only first rollout — flip to enforce after a week of clean reports. | Applied to every non-asset response. |
| Rate limiting | In-memory LRU token bucket (`src/lib/rate-limit.ts`, 10k-key cap). Applied: `/api/chat` 20/60s, `/api/chat/summary` 5/60s, `/api/search` 60/60s per user. Login is handled client-side by Supabase, so auth limits live upstream. | 429 with `Retry-After` on breach. |
| `robots.txt` | `Disallow: /` — CRM is internal. | Shipped in `public/`. |
| `.well-known/security.txt` | RFC 9116, contact `security@flap.consulting`, expires 2027-04-07. | Shipped in `public/.well-known/`. |
| Error page leak audit | `(dashboard)/error.tsx` now shows `error.message` only in dev; `error.digest` rendered as an opaque `Ref:` in prod. Global + not-found pages already clean. | No stack / DB error leaks to the browser. |
| Logging audit | All `console.*` call sites reviewed. The only survivors are the `logger.ts` transport itself and the `error.tsx` useEffect (server-side). `api/dashboard/drill/[tipo]` migrated to `logger.error`. | No raw PII / secrets in logs. |
| Health probe | New `GET /api/health` returns `{ status: 'ok', ts }`. Liveness-only by design — does not query Supabase. | Dockerfile `HEALTHCHECK` wired via Node's built-in `http`. |

## 14. Phase 10 — Multi-instance per-tenant install (2026-04-08, IMPLEMENTED)

Preparing the CRM for per-customer installs: one repo clone + one Supabase
project per customer, same code and same migrations everywhere. Per-install
customisation via three mechanisms, all runtime-editable from the admin UI:

1. **Branding** — logo, colors, company info in a singleton `configuracion_tenant` row.
2. **Custom fields** — tenant-defined JSONB fields on `empresas`, `contactos`, `deals` via a `campos_personalizados` definition table.
3. **Feature flags** — a fixed catalog of boolean toggles on `configuracion_tenant` (AI chat, morning summary, KPIs, etc.).

Bootstrap config (Supabase URL, AI API keys) stays in `.env.local` — infra
stays in infra. Migrations are identical across all installs.

Full spec: [`phase-10-multi-instance.md`](./phase-10-multi-instance.md).

| Step | Scope | Status |
|------|-------|--------|
| 1 | Migration 010 — `configuracion_tenant`, `campos_personalizados`, JSONB columns, storage bucket, RLS, singleton seed | DONE |
| 2 | Regenerate `src/types/database.ts` | DONE |
| 3 | Tenant loader (`get-tenant-config.ts`) + `TenantProvider` context + `useFeatureFlag` hook; wired into `(dashboard)/layout.tsx` | DONE |
| 4 | `/admin/branding` — logo upload, color pickers, company info; sidebar picks up logo + name | DONE |
| 5 | `/admin/funcionalidades` — feature toggles; hard-404 enforcement via `assertFeatureFlag` (APIs) and `requireFeatureFlag` (pages); client-side conditional mounts for ChatPanel, MorningSummary, CommandPalette, EmpresaTaskCalendar, dashboard historico charts + sparklines, and AI chat commands in the palette | DONE |
| 6 | `/admin/campos` — custom field definitions CRUD + `GET/POST/PATCH/DELETE /api/admin/campos` (migration 011 adds `delete_campo_personalizado(p_id)` for transactional JSONB strip per D3) | DONE 2026-04-08 |
| 7 | `CustomFieldsForm` rendered in `create-lead-modal` (empresa + contacto + deal in one POST) + read-only "Campos personalizados" card on empresa detail; `/api/deals` POST re-validates server-side via `validateCamposPersonalizados` and persists JSONB. `lead-form-fields.tsx` extracted from `create-lead-modal.tsx` to stay under the 300-line cap. | DONE 2026-04-08 |
| 8 | Full verification — `npx tsc --noEmit` clean, `pnpm lint` clean, `pnpm build` clean (all 56 routes generated). Runtime smoke + dual-install brand/flag visual diff are manual user-guide steps. | DONE 2026-04-08 |
| 9 | Doc flip — phase-10 spec `[DRAFT]` → `[IMPLEMENTED]`, CLAUDE.md row, this section | DONE 2026-04-08 |

## 15. Seed overhaul — date-relative, full-coverage demo data (2026-04-08, IMPLEMENTED)

Alejandro flagged that the demo drifted away from "today" as the calendar
moved, and that the cockpit's "Tareas pendientes / Tareas vencidas" cards
looked like the same metric with two different numbers. The seed also left
entire features dark (bell empty, Phase 10 custom-field card never rendered,
dirección historical chart flat, comisiones trend missing).

Full spec: [`seed.md`](./seed.md).

| Part | Scope | Status |
|------|-------|--------|
| 1 | `supabase/seed/seed-date.ts` — `SEED_TODAY` + `dayOffset` / `dateOffset` / `monthOffset` helpers (env-var override for pinned-day demos). Every hard-coded ISO string in the seed migrated to a helper call. | DONE |
| 2a | Core entities expanded — empresas 11→16, contactos 15→25, deals 15→18 active + 6 history, actividades 38→64. | DONE |
| 2b | Tareas 6→**18** with deterministic distribution (Ignacio 8 / Laura 8 / Rebeca 2). Ignacio KPI payload on seed-day: `tareas_pendientes=6`, `tareas_vencidas=2`. | DONE |
| 2c | `notificaciones` 0→**12** (4 per vendedor, mix of `leido` true/false, all linkable `tipo` values). | DONE |
| 2d | Phase 10 seeded — `configuracion_tenant` singleton (UPDATE — migration 010 pre-INSERTs via `DEFAULT VALUES`), 7 `campos_personalizados` definitions (3 empresa + 2 contacto + 2 deal), JSONB values populated on 4 empresas + 3 contactos + 2 deals. | DONE |
| 2e | Comisiones 2→6 across last 3 months, `kpi_snapshots` 3→**120** (30 days × 4 KPI types, deterministic sine drift). | DONE |
| 3 | UI label audit — `personal-kpis.tsx` adds subtitles to the two tareas KPI cards ("Incluye hoy y futuras" / "Fecha límite pasada") so the metrics are visually unambiguous. | DONE |
| 4 | Docs — new `docs/seed.md` (single source of truth), user-guide test-user table refreshed with seed-day expected state, this section, CLAUDE.md status row, phase-10 spec cross-link. | DONE |

## 16. /mis-tareas calendar + "3 vs 2" overdue fix (2026-04-08, IMPLEMENTED)

Alejandro flagged a visual inconsistency: the `/mis-tareas` task list rendered
"VENCIDAS (3)" (VetPartners 04 abr + Animalia 06 abr + PetShop Madrid 07 abr)
while the "Mis KPIs" card showed `Tareas vencidas: 2`. Root cause was a
timezone bug in the client-only overdue helpers — `new Date("YYYY-MM-DD")`
parses as UTC midnight, which in UTC-5 (Bogotá) shifts the rendered day back
by one and incorrectly flags today's task as overdue. The server-side KPI
query was correct (`2`). In the same breath he asked for the empresa task
calendar widget to also appear on `/mis-tareas`, above the Scripts card.

| Part | Scope | Status |
|------|-------|--------|
| 1 | `src/lib/formatting.ts` — central `parsePlainDate()` helper, TZ-safe `formatDate()` for plain `YYYY-MM-DD` strings, new `isOverdueDate()` that compares against a locally-computed today-key. | DONE |
| 2 | `task-card.tsx` and `task-list.tsx` drop their local buggy `isOverdue()` copies and import `isOverdueDate` from `@/lib/formatting`. Both files now agree with the server KPI query. | DONE |
| 3 | `src/features/cockpit/components/task-calendar-panel.tsx` — new presentational component extracted from `empresa-task-calendar.tsx` (calendar + selected-day tasks + overdue + no-date buckets + Nueva tarea modal). Takes `tasks`, `loading`, `onComplete`, `onCreated`, `userId`, optional `empresaId` as props. | DONE |
| 4 | `empresa-task-calendar.tsx` refactored from 220→60 lines as a thin data-fetching wrapper around the shared panel. Public signature unchanged. | DONE |
| 5 | `cockpit-client.tsx` adds a new "Calendario de tareas" card between KPIs and Scripts. Reuses the tasks from the existing `useTasks()` call — no additional network requests. | DONE |
| 6 | Docs — this section, phase-9 spec updated with the shared-component note, CLAUDE.md status row annotated. | DONE |

## 17. Phase 11 — AI Data Analytics & Interactive Visualization (2026-04-12, IMPLEMENTED)

Extends the AI chat assistant with analytical SQL capabilities and inline
interactive visualizations (charts, tables, data citations).

| Part | Scope | Status |
|------|-------|--------|
| 1 | Spec doc `docs/phase-11-ai-analytics.md` — API contracts, widget types, security model, acceptance criteria. | DONE |
| 2 | Migration `012_execute_readonly_query.sql` — Postgres RPC function (`SECURITY INVOKER`, 5s timeout, SELECT-only, system-schema blocklist, row limit 200). | DONE |
| 3 | `sql-validator.ts` — TypeScript defense-in-depth SQL validation (forbidden keywords, blocked schemas, multi-statement check). | DONE |
| 4 | `sql-query.ts` — `query_database` tool: validates SQL, calls RPC, returns `{ columns, rows, rowCount, truncated, sql, title }`. | DONE |
| 5 | `presentation.ts` — `render_chart` + `render_table` presentation tools. Capture structured widgets for client rendering. | DONE |
| 6 | `definitions.ts` — 3 new Gemini tool declarations (`query_database`, `render_chart`, `render_table`). | DONE |
| 7 | `tools/index.ts` — Dispatch cases + widget accumulator + auto-citation for query_database results. | DONE |
| 8 | `api/chat/route.ts` — Widget accumulation during tool-call loop, SSE payload `{ text, widgets? }`. | DONE |
| 9 | `use-chat.ts` — Parse widgets from SSE response, attach to `ChatMessage`. | DONE |
| 10 | UI components — `chat-chart.tsx` (Recharts bar/line/area/pie), `chat-table.tsx` (expandable rows), `chat-citation.tsx` (collapsible SQL pill), `chat-widget.tsx` (dispatcher). | DONE |
| 11 | `chat-message.tsx` — Render widgets array below markdown text in assistant messages. | DONE |
| 12 | System prompts — `schema.ts` updated with analytics tool docs + visualization rules. Role prompts (`vendedor.ts`, `direccion.ts`, `admin.ts`) updated with analytical query patterns. | DONE |
| 13 | Types — `types.ts` with `ChartWidget`, `TableWidget`, `CitationWidget`, `Widget`, `ChatResponsePayload`. | DONE |

## 18. Unit test suite — Vitest (2026-04-12, IMPLEMENTED)

First automated test infrastructure. Vitest + 269 tests across 9 files covering
all pure business logic modules. No mocking of Supabase/Next.js beyond a single
`vi.mock` for `api-utils` import isolation.

| File | Module | Tests | Key coverage |
|------|--------|-------|--------------|
| `sql-validator.test.ts` | `sql-validator.ts` | 49 | 21 forbidden keywords, 8 blocked schemas, injection attempts, LIMIT handling |
| `formatting.test.ts` | `formatting.ts` | 26 | Currency/number locale, relative time, overdue TZ-safe logic |
| `rate-limit.test.ts` | `rate-limit.ts` | 13 | Token bucket, window expiry, 429 response, clientIp extraction |
| `api-utils.test.ts` | `api-utils.ts` | 4 | `jsonError` (isolated via `vi.mock`) |
| `custom-fields.test.ts` | `custom-fields.ts` | 25 | Regex, mapTenantRow, isFeatureFlag, mapCampoRow |
| `custom-fields-validate.test.ts` | `custom-fields.ts` | 25 | 5 field types × required/optional, sanitization, renderCampoValue |
| `schemas.test.ts` | `schemas.ts` | 24 | CreateCampo/UpdateCampo Zod schemas, refine rules, strict mode |
| `helpers.test.ts` | `helpers.ts` | 38 | clampLimit, buildFuzzyOr, parseRelativeDate (Spanish + accents) |
| `presentation.test.ts` | `presentation.ts` | 34 | Chart/table schemas, render fns, isPresentationResult guard |

Run: `npm test` (or `npx vitest run`). Config: `vitest.config.ts`.
