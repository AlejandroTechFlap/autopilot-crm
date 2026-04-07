# Phase 7: Admin Suite [IMPLEMENTED]

## Overview

Phase 7 closes the largest remaining spec gap: the **admin-configurable rules
(A1–A18)** and **dirección rules (D1–D4)** from the original spec §10. The
customer (RSR) explicitly listed *"panel de administración para fases — ponerle
nombre a las fases"* in `notas.md`, so the admin suite ships first with the
ability to rename phases and edit `tiempo_esperado`.

The admin suite is gated to `rol = 'admin'` (Settings sidebar entry already
exists in `src/components/layout/sidebar.tsx`). It adds five sub-screens under
`/admin/*` plus a landing page that summarises status.

## Spec rules covered

| ID | Rule | Sub-screen | Status |
|----|------|------------|--------|
| A1 | Pipeline phases (CRUD) | `/admin/pipelines` | DRAFT |
| A2 | `tiempo_esperado` per phase | `/admin/pipelines` | DRAFT |
| A3 | `criterios_entrada` JSONB per phase | `/admin/pipelines` (textarea) | DRAFT |
| A5 | Multiple pipelines | `/admin/pipelines` (CRUD) | DRAFT |
| A7 | KPI thresholds (verde/ámbar) | `/admin/kpis` | DRAFT |
| A8 | KPI targets / period | `/admin/kpis` | DRAFT |
| A11–A15 | Notification config (canal, umbral, destinatario, horario) | `/admin/notificaciones` | DRAFT |
| D1 | Scripts CRUD | `/admin/scripts` | DRAFT |
| Users | Manage usuarios (rol, nombre) | `/admin/usuarios` | DRAFT |
| B3 | Initial + final phase always exist | guarded in `/admin/pipelines` API | DRAFT |

A4 (loss reasons), A6 (sources/tags), A16 (commission formula), A17 (custom
fields), A18 (dropdown values) remain MISSING and are flagged in
`gap-analysis.md` for a follow-up phase. Hardcoded enums make A4/A6/A18
require migration churn that is out of scope here.

## Route Structure

```
src/app/(dashboard)/admin/
  layout.tsx              # admin guard + sub-nav tabs
  page.tsx                # overview dashboard (counts, links)
  pipelines/page.tsx      # list pipelines, edit phases
  scripts/page.tsx        # CRUD scripts
  usuarios/page.tsx       # list + role edit
  notificaciones/page.tsx # rule editor (3 disparadores)
  kpis/page.tsx           # 5-row threshold/target editor
```

## API Routes

```
src/app/api/admin/
  pipelines/route.ts          # GET (list), POST (create)
  pipelines/[id]/route.ts     # PATCH (rename), DELETE
  fases/route.ts              # POST (create phase)
  fases/[id]/route.ts         # PATCH (rename, tiempo, criterios), DELETE
  scripts/route.ts            # POST (create)
  scripts/[id]/route.ts       # PATCH, DELETE
  usuarios/route.ts           # GET (list)
  usuarios/[id]/route.ts      # PATCH (rol, nombre)
  notificaciones/route.ts     # GET (list config), PATCH (bulk update)
  kpis/route.ts               # GET (list), PATCH (bulk update)
```

All routes require `admin` role via `requireApiAuth()` + a role check that
returns `403` for non-admins. The existing RLS policies in migration 006
already restrict config tables to admin, so this is defence in depth.

## API Contracts

### GET /api/admin/pipelines

Returns all pipelines with their phases (ordered by `orden`).

```json
{
  "pipelines": [
    {
      "id": "uuid",
      "nombre": "Retail mascotas",
      "fases": [
        { "id": "uuid", "nombre": "Captación", "orden": 1, "tiempo_esperado": 1, "criterios_entrada": {} }
      ]
    }
  ]
}
```

### POST /api/admin/pipelines

```json
{ "nombre": "Pipeline B2B" }
```

Creates a pipeline with **two seed phases** ("Inicio" orden 1, "Cerrado" orden
99) so invariant **B3** (initial + final phase always exist) cannot be
violated by deleting the only phases.

### PATCH /api/admin/fases/[id]

```json
{ "nombre": "...", "tiempo_esperado": 5, "criterios_entrada": { "key": "..." } }
```

Validates: `tiempo_esperado` ∈ `null` | int ≥ 0; `nombre` non-empty.

### DELETE /api/admin/fases/[id]

Refuses if it would leave the pipeline with fewer than two phases (B3) or if
deals still reference the phase. Returns `409` with the blocking deal count.

### POST /api/admin/fases

```json
{ "pipeline_id": "uuid", "nombre": "...", "orden": 3, "tiempo_esperado": 2 }
```

Re-orders subsequent phases server-side if `orden` collides.

### Scripts (D1)

`POST /api/admin/scripts` body: `{ titulo, contenido, fase_asociada?, tags[] }`
`PATCH /api/admin/scripts/[id]` body: same fields, all optional
`DELETE /api/admin/scripts/[id]`

### Usuarios

`GET /api/admin/usuarios` returns `{ usuarios: [{ id, nombre, email, rol, avatar_url }] }`
`PATCH /api/admin/usuarios/[id]` body: `{ nombre?, rol? }` — admin cannot demote themselves
to a non-admin if they would become the last admin (returns `409`).

### Notificaciones (A11–A15)

`GET /api/admin/notificaciones` returns the 3 seeded `notificacion_config` rows.

`PATCH /api/admin/notificaciones` accepts an array of upserts:
```json
{ "rules": [{ "id": "uuid", "activo": true, "umbral_horas": 24, "canal": "in_app", "destinatario_id": null, "horario_inicio": "09:00", "horario_fin": "18:00" }] }
```

### KPIs (A7, A8)

`GET /api/admin/kpis` returns the 5 seeded `kpi_config` rows.

`PATCH /api/admin/kpis` accepts:
```json
{ "kpis": [{ "id": "uuid", "umbral_verde": 80, "umbral_ambar": 50, "objetivo": 100, "periodo": "mensual" }] }
```

## Component Hierarchy

```
AdminLayout (server, requireRole 'admin')
  └── AdminTabs (Pipelines / Scripts / Users / Notifications / KPIs)

AdminPage (server)               # /admin overview cards (5 tiles)

AdminPipelinesPage (server)
  └── PipelineEditor (client)
      ├── PipelineSelect
      ├── PhaseList
      │   └── PhaseRow (inline edit nombre, tiempo_esperado)
      └── AddPhaseButton

AdminScriptsPage (server)
  └── ScriptManager (client)
      ├── ScriptList
      └── ScriptForm (modal — create/edit)

AdminUsuariosPage (server)
  └── UsuarioTable (client)
      └── UsuarioRow (rol select, nombre input)

AdminNotificacionesPage (server)
  └── NotificacionRulesEditor (client)
      └── RuleRow × 3 (activo, umbral, canal, horario)

AdminKpisPage (server)
  └── KpiThresholdsEditor (client)
      └── KpiRow × 5 (verde, ambar, objetivo, periodo)
```

Each editor uses the same pattern: load via server fetch, hold state client-side,
"Save changes" button does a single PATCH with the full set, toast on success.

## Files (target sizes)

| File | Approx LOC |
|------|-----------|
| `src/app/(dashboard)/admin/layout.tsx` | 30 |
| `src/app/(dashboard)/admin/page.tsx` | 80 |
| `src/app/(dashboard)/admin/pipelines/page.tsx` | 30 |
| `src/app/(dashboard)/admin/scripts/page.tsx` | 30 |
| `src/app/(dashboard)/admin/usuarios/page.tsx` | 30 |
| `src/app/(dashboard)/admin/notificaciones/page.tsx` | 30 |
| `src/app/(dashboard)/admin/kpis/page.tsx` | 30 |
| `src/features/admin/components/admin-tabs.tsx` | 60 |
| `src/features/admin/components/pipeline-editor.tsx` | 220 |
| `src/features/admin/components/script-manager.tsx` | 220 |
| `src/features/admin/components/usuario-table.tsx` | 160 |
| `src/features/admin/components/notificacion-rules-editor.tsx` | 200 |
| `src/features/admin/components/kpi-thresholds-editor.tsx` | 180 |
| `src/features/admin/lib/admin-guard.ts` | 25 |
| 11 API route files | 60–120 each |

All files honour the **≤300 line cap**.

## Data Model Notes

No new tables. Phase 7 is **pure CRUD against existing config tables**:
- `pipelines`, `fases` (migration 002)
- `scripts` (migration 004)
- `usuarios` (migration 001)
- `notificacion_config`, `kpi_config` (migration 005)

The config tables already have RLS policies in migration 006 that restrict
INSERT/UPDATE/DELETE to admin via `current_user_role() = 'admin'`.

## Acceptance Criteria

1. Admin can rename a phase and the new name appears in the Kanban board
   without a server restart.
2. Admin can change `tiempo_esperado` and the semáforo recalculates next page
   load.
3. Admin can create a new pipeline; it appears in `/api/pipeline/[id]` once a
   first deal is moved to it.
4. Admin can create/edit/delete scripts; vendedores see updates immediately in
   `script-library.tsx` after refresh.
5. Admin can change a vendedor's role to dirección and the sidebar/route
   permissions update on next login.
6. Admin can toggle a notification rule off and the corresponding trigger
   stops firing on the next cron tick.
7. Admin can edit KPI thresholds and the dashboard tiles re-colour on next
   load.
8. Non-admins hitting any `/admin/*` route are redirected to `/`.
9. Non-admins hitting any `/api/admin/*` route receive `403`.
10. All 11 admin files stay under 300 LOC.

## Out of scope (deferred)

- A4 (loss reasons CRUD) — would require dropping the enum and adding a table.
- A6 (sources / tags / categorías CRUD) — same migration churn.
- A16 (commission formula editor) — needs a DSL or formula table.
- A17 (custom fields) — requires `empresas_custom_fields` table + dynamic forms.
- A18 (generic dropdown editor) — depends on A6.
- B9 (audit trail of config changes) — needs an `admin_audit_log` table; flag
  it as a follow-up task once admin suite ships.
- Email + Slack channels for notifications — listed separately in
  `gap-analysis.md` Section 12.
