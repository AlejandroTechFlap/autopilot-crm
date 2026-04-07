# Autopilot CRM — Gap Analysis

> Spec → implementation matrix. The spec lives in
> `/home/john/Desktop/Projects/CRM/MVP - HTML y Playbook/Autopilot_CRM_Especificacion_Tecnica_Desarrollo.md`.
> Status legend: **DONE** = implemented and tested · **PARTIAL** = some pieces missing · **MISSING** = not built yet.

Last reviewed: 2026-04-07. Recent changes: Phase 8 UI polish shipped; full
Spanish UI sweep with glossary in [`i18n.md`](./i18n.md); root-redirect moved
from `app/page.tsx` into `src/lib/supabase/middleware.ts` to avoid the Next.js
16 dev-mode `RootPage` performance bug (see
[`phase-2-pipeline-company.md`](./phase-2-pipeline-company.md)).

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
