# Phase 3: Cockpit + Dashboard [IMPLEMENTED]

## Overview

Phase 3 delivers two screens:
1. **Cockpit (My Tasks)** — vendedor's daily command center: task inbox, personal KPIs, commissions, scripts
2. **Dashboard** — dirección/admin analytics view: KPI tiles with sparklines, historical charts, drill-down

## Architecture

### Route Structure

```
/mis-tareas              → Cockpit (all roles, scoped by vendedor)
/dashboard               → Dashboard (admin + direccion only)

/api/tareas              → GET (list), POST (create)
/api/tareas/[id]         → PATCH (update/complete)
/api/scripts             → GET (list)
/api/mis-kpis            → GET (personal KPIs for current user)
/api/dashboard/kpis      → GET (aggregate KPIs for dirección)
/api/dashboard/historico → GET (chart data over time)
/api/dashboard/drill/[tipo] → GET (drill-down detail per KPI tile)
```

## API Contracts

### GET /api/tareas

Query params: `completada=false` (default), `prioridad`, `limit` (default 50, max 100)

Vendedor sees own tasks only. Dirección/admin see all (optionally filter by `vendedor_id`).

```json
{
  "tareas": [
    {
      "id": "uuid",
      "titulo": "Follow up with PetFood SA",
      "descripcion": "They asked for pricing last week",
      "prioridad": "alta",
      "fecha_vencimiento": "2026-04-07",
      "completada": false,
      "origen": "manual",
      "tipo_tarea": "follow_up",
      "empresa": { "id": "uuid", "nombre": "PetFood SA" },
      "deal": { "id": "uuid", "valor": 15000 },
      "created_at": "2026-04-01T10:00:00Z"
    }
  ],
  "count": 12
}
```

### POST /api/tareas

```json
{
  "titulo": "Call client about proposal",
  "descripcion": "Discuss pricing options",
  "prioridad": "alta",
  "fecha_vencimiento": "2026-04-10",
  "empresa_id": "uuid",
  "deal_id": "uuid",
  "vendedor_asignado": "uuid"
}
```

Vendedores can only create tasks for themselves. Dirección/admin can assign to any vendedor.

### PATCH /api/tareas/[id]

```json
{
  "completada": true
}
```

When completing a task: creates a sistema activity on the linked empresa ("Task completed: {titulo}").

Also supports updating: `titulo`, `descripcion`, `prioridad`, `fecha_vencimiento`.

### GET /api/scripts

Returns all scripts, ordered by titulo. Optionally filter by `fase_asociada`.

```json
{
  "scripts": [
    {
      "id": "uuid",
      "titulo": "Cold Call Opener",
      "contenido": "Hi, I'm calling from...",
      "tags": ["cold_call", "opener"],
      "fase": { "nombre": "Contacto inicial" }
    }
  ]
}
```

### GET /api/mis-kpis

Personal KPIs for the current user (vendedor perspective).

```json
{
  "kpis": {
    "deals_abiertos": 5,
    "valor_pipeline": 45000,
    "tareas_pendientes": 8,
    "tareas_vencidas": 2,
    "actividades_hoy": 3,
    "deals_ganados_mes": 2,
    "valor_ganado_mes": 25000,
    "comision_mes": 1250
  }
}
```

Calculated from:
- `deals` where `vendedor_asignado = user.id` and `resultado IS NULL`
- `tareas` where `vendedor_asignado = user.id` and `completada = false`
- `actividades` where `usuario_id = user.id` and `created_at >= today`
- `deals` where `vendedor_asignado = user.id` and `resultado = 'ganado'` and `cerrado_en` in current month
- `comisiones` where `vendedor_id = user.id` and `periodo = current month`

### GET /api/dashboard/kpis

Aggregate KPIs for dirección view. Requires admin/direccion role.

Query params: `periodo` (7d | month | quarter, default: month)

```json
{
  "kpis": {
    "total_pipeline_value": 250000,
    "deals_abiertos": 22,
    "deals_ganados": 5,
    "deals_perdidos": 2,
    "tasa_conversion": 71.4,
    "valor_ganado": 85000,
    "ticket_medio": 17000,
    "actividades_periodo": 45,
    "tareas_vencidas": 6
  },
  "por_vendedor": [
    {
      "vendedor": { "id": "uuid", "nombre": "Ignacio" },
      "deals_abiertos": 12,
      "valor_pipeline": 120000,
      "deals_ganados": 3,
      "actividades": 25
    }
  ]
}
```

### GET /api/dashboard/historico

Chart data. Requires admin/direccion role.

Query params: `tipo` (pipeline_value | deals_ganados | actividades | conversion), `periodo` (7d | month | quarter)

```json
{
  "series": [
    { "fecha": "2026-04-01", "valor": 230000 },
    { "fecha": "2026-04-02", "valor": 245000 }
  ]
}
```

Uses `kpi_snapshots` table for historical data. Falls back to live calculation for recent periods without snapshots.

### GET /api/dashboard/drill/[tipo]

Drill-down detail for a specific KPI tile. Requires admin/direccion role (vendedores get 403).

Path params: `tipo` ∈ `pipeline_value | deals_ganados | conversion | ticket_medio | tareas_vencidas`
Query params: `periodo` (7d | month | quarter, default: month)

Response shape is uniform across all `tipo` values so the frontend dialog renders generically:

```json
{
  "title": "Pipeline Value Breakdown",
  "summary": [
    { "label": "Total Pipeline", "value": "€250,000" },
    { "label": "Open Deals", "value": "22" },
    { "label": "Avg. Deal", "value": "€11,364" }
  ],
  "by_vendedor": [
    {
      "vendedor_id": "uuid",
      "vendedor": "Ignacio",
      "count": 12,
      "valor": 145000,
      "ganados": 3,
      "perdidos": 1,
      "rate": 75.0
    }
  ],
  "items": [
    {
      "id": "uuid",
      "primary": "PetFood SA",
      "secondary": "Negociación",
      "vendedor": "Ignacio",
      "valor": 45000,
      "date": "2026-04-01T10:00:00Z",
      "href": "/empresa/uuid"
    }
  ]
}
```

Per-tipo specifics:
- `pipeline_value`: open deals (resultado IS NULL), top 10 by value, items linked to empresa
- `deals_ganados`: won deals in period, ordered by value
- `conversion`: closed deals (won + lost) in period; `items` shows lost deals with `motivo_perdida` for actionability; `by_vendedor` includes win rate
- `ticket_medio`: same dataset as `deals_ganados` but summary shows avg/max/min
- `tareas_vencidas`: open tasks with `fecha_vencimiento < today`; secondary shows "{empresa} · {N}d overdue"

Implementation lives in `src/features/dashboard/lib/`:
- `drill.ts` (entry point): `buildDrill()` dispatcher, `getPeriodStart()`, `aggregateByVendedor()`, `pickOne()` helper
- `drill-builders.ts`: 5 builder functions (one per tipo)

Split across two files to honor the 300-line module rule.

## Component Hierarchy

### Cockpit Page (`/mis-tareas`)

```
MisTareasPage (server)
└── CockpitClient (client)
    ├── CockpitToolbar
    │   ├── CreateTaskModal
    │   └── Filter buttons (all / overdue / today)
    ├── TaskList (main area)
    │   ├── TaskSection (urgent — vencidas)
    │   │   └── TaskCard[]
    │   ├── TaskSection (high priority — alta)
    │   │   └── TaskCard[]
    │   └── TaskSection (normal — media/baja)
    │       └── TaskCard[]
    └── CockpitSidebar (right panel)
        ├── PersonalKpis (mini KPI cards)
        ├── CommissionBox (monthly commission)
        └── ScriptLibrary (expandable scripts)
```

### TaskCard

Displays: titulo, empresa link, prioridad badge, fecha_vencimiento (with overdue highlighting), origen badge, checkbox to complete.

Click checkbox → PATCH completada=true → toast "Task completed" → remove from list.

### Dashboard Page (`/dashboard`)

```
DashboardPage (server — requireRole admin/direccion)
└── DashboardClient (client)
    ├── PeriodSelector (7d | this month | quarter)
    ├── KpiTileGrid (5 tiles)
    │   ├── KpiTile (Pipeline Value) — with sparkline
    │   ├── KpiTile (Deals Won) — with sparkline
    │   ├── KpiTile (Conversion Rate) — with sparkline
    │   ├── KpiTile (Average Ticket) — with sparkline
    │   └── KpiTile (Overdue Tasks) — alert color
    ├── ChartGrid (2x2)
    │   ├── PipelineValueChart (area)
    │   ├── DealsWonChart (bar)
    │   ├── ActivityChart (line)
    │   └── ConversionChart (line)
    ├── VendedorTable (per-seller breakdown)
    └── KpiDrillDialog (modal — opens on tile click)
        ├── DrillSummary (3 stat cards)
        ├── DrillVendedorBreakdown (table — by_vendedor)
        └── DrillItemList (top 10 items, each linked to /empresa/[id])
```

### KpiDrillDialog

Each `KpiTile` is clickable. Clicking sets `drillTipo` state in `DashboardClient` which opens the
`KpiDrillDialog`. The dialog fetches `/api/dashboard/drill/[tipo]?periodo=...` on open and renders
the unified `DrillData` shape: title in `DialogHeader`, summary stats in a 3-column grid,
seller breakdown as a `Table`, and the top items as a clickable list. Items with an `href` link to
the corresponding `/empresa/[id]` page so dirección can pivot directly from the KPI into the
underlying record.

### KpiTile

Card with: label, large number, delta vs previous period (green/red arrow), mini sparkline (Recharts AreaChart, 50x20px, no axes).

The delta is computed client-side using `prev_kpis` returned by `/api/dashboard/kpis`. For each KPI, the previous period of the same length is queried (e.g. for "month": last calendar month; for "7d": days -14 to -7). Tiles supporting deltas: Deals Won, Conversion Rate, Avg. Ticket. Pipeline Value (always-current snapshot) and Overdue Tasks (point-in-time alert) intentionally do not show a delta. The `invertDelta` flag flips the up/down color semantics for "lower is better" KPIs.

## KPI Calculations

| KPI | Source | Calculation |
|-----|--------|-------------|
| Pipeline Value | `deals` | SUM(valor) WHERE resultado IS NULL |
| Deals Won | `deals` | COUNT WHERE resultado='ganado' AND cerrado_en in period |
| Conversion Rate | `deals` | ganados / (ganados + perdidos) * 100 for period |
| Average Ticket | `deals` | AVG(valor) WHERE resultado='ganado' in period |
| Overdue Tasks | `tareas` | COUNT WHERE completada=false AND fecha_vencimiento < today |
| Activities | `actividades` | COUNT WHERE created_at in period |

## Recharts Usage

Using Recharts for all charts. Components needed:
- `AreaChart` — pipeline value over time
- `BarChart` — deals won per week/day
- `LineChart` — activity count, conversion rate
- Sparklines use `AreaChart` with no axes, 50x20 size, gradient fill

## Role Enforcement

- `/mis-tareas`: All roles. Vendedor sees own tasks. Dirección sees all + can filter by vendedor.
- `/dashboard`: Admin + dirección only. Enforced via `requireRole()` in server component.
- API routes: Each checks `user.rol` and scopes queries accordingly.

## Seed Data Requirements

The existing seed should include:
- Tasks across vendedores with varying priorities and due dates
- Some overdue tasks for testing
- Scripts linked to pipeline phases
- Commissions for won deals
- KPI snapshots for chart data
