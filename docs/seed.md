# Seed — single source of truth

> Last updated: 2026-04-08. Owner: Alejandro. Status: **IMPLEMENTED**.
>
> Entry point: [`supabase/seed.ts`](../supabase/seed.ts). Sub-modules live under
> [`supabase/seed/*`](../supabase/seed/). Every module is idempotent
> (`upsert` with fixed UUIDs) so `npm run seed` can run any number of times.

## 1. Purpose

The seed must guarantee four things:

1. **Date-relative.** Every `fecha_*` / `created_at` derives from a single
   `SEED_TODAY` constant. "Overdue", "today", "this month" stay aligned with
   the real calendar no matter when the seed runs.
2. **Full coverage.** Every Phase 0-10 feature has at least one non-empty row
   to render: bell notifications, custom field definitions + values, tenant
   branding singleton, 30-day KPI history, etc.
3. **Unambiguous task counters.** Each test user has clearly distinct values
   for `tareas_pendientes` and `tareas_vencidas` — the two KPIs can never be
   mistaken for each other.
4. **Reproducible demos.** `SEED_TODAY=2026-04-15 npm run seed` produces the
   exact same distribution as running it on that real date.

## 2. How to run

```bash
# Normal reseed — anchored to real today
npm run seed

# Pinned-day reseed (for screencasts / specific dates)
SEED_TODAY=2026-04-15 npm run seed
```

The script reads `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
from `.env.local`. Needs `tsx` — already a dev dependency.

## 3. Entity coverage

| Table | Rows | What it exercises |
|---|---:|---|
| `usuarios` (auth + row)   | **4**   | 1 admin + 1 direccion + 2 vendedores (Ignacio, Laura) |
| `pipelines` + `fases`     | 1 + 6   | Nuevo Lead → Postventa, with `tiempo_esperado` thresholds |
| `empresas`                | **16**  | Every `sector`/`tamano` combo + 4 with `campos_personalizados` values |
| `contactos`               | **25**  | 1+ per empresa, 3 with custom-field values, `es_principal` enforced |
| `deals` (active + closed) | **18**  | Spread across every fase; VetPartners stuck 24d in Negociacion (red) |
| `deals` (history)         | **6**   | Synthetic rows giving the dashboard MTD vs prev-MTD real deltas |
| `actividades`             | **64**  | Llamada / email / reunion / nota mix, clustered in −7..0d |
| `tareas`                  | **18**  | Per-vendedor distribution — see §5 |
| `notificaciones`          | **12**  | 4 per vendedor — mix `leido: true/false` + all linkable `tipo`s |
| `scripts`                 | **4**   | One per fase (apertura, seguimiento, negociacion, onboarding) |
| `comisiones`              | **6**   | 3 months × mixed vendedores → dirección trend line |
| `kpi_config`              | **5**   | 5 KPIs (deals_ganados, ingresos, llamadas, conversion, tiempo_cierre) |
| `kpi_snapshots`           | **120** | 30 days × 4 KPI tipos → sparklines + historical chart |
| `notificacion_config`     | **3**   | 3 disparadores with active thresholds |
| `configuracion_tenant`    | **1**   | Singleton — brand + all feature flags `true` (Phase 10) |
| `campos_personalizados`   | **7**   | Definitions: 3 empresa + 2 contacto + 2 deal (Phase 10) |

## 4. Date helpers

File: [`supabase/seed/seed-date.ts`](../supabase/seed/seed-date.ts). All other
seed files MUST derive dates from these helpers — no hard-coded ISO strings
outside this module.

| Export | Returns | Use for |
|---|---|---|
| `SEED_TODAY`   | `Date` (midnight local)   | Anchor constant |
| `dayOffset(n, h?)`  | ISO timestamp (`Z`)   | `timestamptz` columns (`created_at`, `cerrado_en`, `fecha_entrada_fase`) |
| `dateOffset(n)`     | `YYYY-MM-DD`          | `date` columns (`fecha_vencimiento`, `fecha` on snapshots) |
| `monthOffset(n)`    | `YYYY-MM`             | `periodo` on `comisiones` |

Examples:

```ts
dayOffset(0)        // today, 10:00 local ISO
dayOffset(-3, 15)   // 3 days ago, 15:00 local
dateOffset(-24)     // 24 days ago, YYYY-MM-DD
monthOffset(-1)     // last month, YYYY-MM
```

Override via env: `SEED_TODAY=2026-04-15 npm run seed`.

## 5. Tareas distribution — the "pendientes vs vencidas" fix

Each vendedor gets a deterministic mix so both KPIs are visibly distinct and
non-zero. Anchored to `SEED_TODAY`.

| Vendedor | Overdue | Today | Tomorrow | +3..+10 | Completed | No date | Total |
|---|---:|---:|---:|---:|---:|---:|---:|
| Ignacio | 2 | 1 | 1 | 2 | 2 | 0 | **8** |
| Laura   | 1 | 1 | 1 | 2 | 2 | 1 | **8** |
| Rebeca  | 0 | 0 | 0 | 1 | 1 | 0 | **2** |

**Expected KPI payload on seed-day for Ignacio** (from `/api/mis-kpis`):

| Field | Value | Query |
|---|---:|---|
| `tareas_pendientes` | **6** | `completada = false` (2+1+1+2) |
| `tareas_vencidas`   | **2** | `completada = false AND fecha_vencimiento < todayStart` |

The `personal-kpis.tsx` KPI cards display both values with distinct subtitles
("Incluye hoy y futuras" / "Fecha límite pasada") so the two metrics can
never be confused with each other.

## 6. Test user starting state (at seed-day)

| User | Pipeline | Mis tareas | Notifications | Dashboard |
|---|---|---|---|---|
| ignacio | 5+ active deals, VetPartners red | 6 pendientes / 2 vencidas | 4 (2 unread) | — |
| laura   | 5+ active deals, Clinica Sol tarea overdue | 6 pendientes / 1 vencida | 4 (3 unread) | — |
| rebeca  | all deals visible | 1 future tarea | 4 (2 unread) | 5 KPI tiles + 30-day historical chart populated |
| admin   | all deals visible | — | — | All admin screens populated + tenant brand applied |

## 7. Idempotency & cleanup

Re-running `npm run seed` must converge on the same final state every time.
Two strategies are used depending on the table:

**a. Fixed UUIDs + `upsert(..., { onConflict: 'id' })`** — used by parent
entities (`empresas`, `contactos`, `deals`, `pipelines`, `fases`) and the leaf
tables that have an explicit ID namespace (`tareas` → `70xxx`, `notificaciones`
→ `80xxx`, `actividades` → `90xxx`). Rows with the same UUID are updated
in place; no row growth across runs.

**b. Wipe-then-insert** — for config-shaped tables that historically did not
set explicit IDs (`comisiones`, `kpi_snapshots`, `kpi_config`,
`notificacion_config`, `scripts`). [`supabase/seed/cleanup.ts`](../supabase/seed/cleanup.ts)
runs first in the orchestrator and `DELETE`s every row from these tables
before they are reinserted.

**`actividades` is special.** Migration 007 installs a `BEFORE UPDATE OR
DELETE` trigger that raises `Records in actividades are immutable`. The seed
side-steps this by giving each row a fixed UUID in the `90xxx` namespace and
upserting with `{ onConflict: 'id', ignoreDuplicates: true }` — `ON CONFLICT
DO NOTHING` does not fire the trigger, so existing rows are silently skipped.
The cleanup module intentionally excludes `actividades` for this reason.

## 8. Adding a new seed module

1. Create `supabase/seed/<topic>.ts`. Export one `async seed<Topic>(supabase, users)` function.
2. Use fixed UUIDs (see `ids.ts` or pick a namespace like `70xxx`/`80xxx`/`90xxx`)
   so the seed is idempotent via `upsert({...}, { onConflict: 'id' })`.
3. Import date helpers from `./seed-date` — never hard-code an ISO string.
4. Call the new function from `seedConfig` in `config.ts` (if it's config-shaped)
   or from `seed.ts` (if it's a new top-level entity).
5. If the table is config-shaped and you cannot give rows fixed UUIDs, add it
   to the `tables` array in `cleanup.ts` so re-runs do not accumulate.
6. Keep each file under the 300-line cap. Split by entity or by semantic group.

**Rule:** a grep for `'20\d\d-\d\d-\d\d'` inside `supabase/seed/` must return
zero hits outside `seed-date.ts` itself.

## 9. Verification after a reseed

```bash
npx tsc --noEmit                       # no type errors
npm run seed                           # completes cleanly
SEED_TODAY=2026-04-15 npm run seed     # same distribution on any day
```

Then manually: login as Ignacio → `/mis-tareas` shows 6 pending / 2 overdue;
bell shows 4 notifications; `/empresa/<id>` shows the Phase 10 "Campos
personalizados" card on the 4 empresas with values. Login as Rebeca →
`/dashboard` shows populated tiles + a 30-point historical chart line.
