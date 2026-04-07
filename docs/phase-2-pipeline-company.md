# Phase 2: Pipeline + Company Detail [IMPLEMENTED]

## Overview

Phase 2 delivers the core sales pipeline view (Kanban board), company detail page, and supporting API routes. This is the primary interface for vendedores and the most demo-critical screen.

## Role-based landing redirect

The root route `/` redirects authenticated users to their default landing page
(`/mis-tareas` for `vendedor`, `/dashboard` for `admin` / `direccion`). This
redirect lives in `src/lib/supabase/middleware.ts` (called by the Next.js 16
proxy at `src/proxy.ts`) — **not** in `app/page.tsx`. Doing it from a Server
Component triggered a Next.js 16 dev-mode bug where `redirect()` throws before
the `RootPage` performance mark closes, producing
`Failed to execute 'measure' on 'Performance': 'RootPage' cannot have a
negative time stamp`. The proxy intercepts `/` first, so `app/page.tsx` is now
effectively dead code kept only as a defensive fallback.

## Architecture

### Route Structure

```
src/app/(dashboard)/
  layout.tsx          # Sidebar + TopBar + auth guard
  pipeline/page.tsx   # Kanban board (default pipeline)
  empresa/[id]/page.tsx  # Company detail
```

### API Routes

```
src/app/api/
  pipeline/[id]/route.ts   # GET: phases + deals for a pipeline
  deals/route.ts            # POST: create deal
  deals/[id]/mover/route.ts # PATCH: move deal to new phase
  deals/[id]/cerrar/route.ts # PATCH: close deal (won/lost)
  empresas/route.ts         # GET: list, POST: create
  empresas/[id]/route.ts    # GET: detail, PATCH: update
  empresas/[id]/actividades/route.ts # GET: timeline, POST: add activity
  contactos/route.ts        # POST: create contact
```

### Feature Modules

```
src/features/pipeline/
  components/
    kanban-board.tsx     # Main board container
    kanban-column.tsx    # Phase column
    deal-card.tsx        # Individual deal card
    pipeline-filters.tsx # Vendor + value range filters
    create-lead-modal.tsx # Create empresa+contact+deal
    quick-activity.tsx   # Register activity from card
  hooks/
    use-pipeline.ts      # Fetch + realtime subscription
    use-deal-mutations.ts # Move, close, create deal
  lib/
    semaphore.ts         # Calculate semaphore color
    
src/features/empresa/
  components/
    empresa-header.tsx   # Company name, stage, assigned seller
    empresa-contacts.tsx # Contact list with primary badge
    empresa-deals.tsx    # Deal cards for this company
    empresa-timeline.tsx # Activity timeline
    empresa-actions.tsx  # Quick actions panel
  hooks/
    use-empresa.ts       # Fetch empresa + related data
```

## Data Flow

### Pipeline Page
1. Server component fetches first pipeline ID
2. Client `KanbanBoard` calls `GET /api/pipeline/[id]`
3. Response: phases with nested deals (joined with empresas + usuarios)
4. Realtime subscription on `deals` table updates board live
5. Drag-and-drop calls `PATCH /api/deals/[id]/mover`

### Company Detail
1. Server component fetches empresa + contacts + deals + recent activities
2. Tabs: Profile | Contacts | Deals | Timeline
3. Quick actions: register activity, create task, edit fields

## API Contracts

### GET /api/pipeline/[id]
Response:
```json
{
  "pipeline": { "id": "...", "nombre": "..." },
  "fases": [
    {
      "id": "...", "nombre": "...", "orden": 1, "tiempo_esperado": 2,
      "deals": [
        {
          "id": "...", "valor": 45000, "fecha_entrada_fase": "...",
          "resultado": null,
          "empresa": { "id": "...", "nombre": "...", "fuente_lead": "...", "proxima_accion": "..." },
          "vendedor": { "id": "...", "nombre": "..." },
          "semaphore": "green" | "amber" | "red",
          "days_in_phase": 3,
          "semaphore_pct": 0.5
        }
      ]
    }
  ]
}
```

### PATCH /api/deals/[id]/mover
Body: `{ "fase_destino": "uuid" }`
- Updates `fase_actual`, resets `fecha_entrada_fase` to NOW
- Creates `cambio_fase` activity
- Returns updated deal

### PATCH /api/deals/[id]/cerrar
Body: `{ "resultado": "ganado" | "perdido", "motivo_perdida?": "string" }`
- Sets `resultado`, `cerrado_en`
- If won: updates empresa `lifecycle_stage` to `cliente`
- Creates system activity
- Returns updated deal

### POST /api/deals (Create Lead)
Body: `{ "empresa": {...}, "contacto": {...}, "deal": {...} }`
- Creates empresa + contacto + deal in sequence
- Creates `sistema` activity for new lead
- Returns all three created records
- **Role gate**: only `admin` and `direccion` can call this — see "Lead creation — role gating" below.
- `deal.vendedor_asignado` (uuid) is **required**: the creator must explicitly pick which vendedor owns the new lead. Both the empresa and the deal are assigned to that vendedor; the `actividad` row is still authored by the actual creator for audit.

## Lead creation — role gating [IMPLEMENTED]

Vendedores cannot create new leads. Lead creation (and the underlying empresa/contacto/deal records that come with it) is reserved to `admin` and `direccion`, who must explicitly assign each new lead to a specific vendedor.

This is enforced at three layers — UI, API, and RLS — so a vendedor cannot bypass the rule via the command palette, a direct `fetch`, or a raw SQL insert.

### UI
- `KanbanBoard` only renders the **"Nuevo lead"** button when `canCreateLead` (passed down from `PipelineClient`, computed via `hasRole(user, 'admin', 'direccion')`).
- `PipelineClient` only mounts `<CreateLeadModal>` for those same roles, so the modal isn't even in the vendedor's bundle.
- `CreateLeadModal` exposes a required `Select` for `vendedor_asignado` populated from the `vendedores` prop the page passes in (fetched server-side from `usuarios` where `rol = 'vendedor'`).
- The Cmd+K command palette hides the **"Crear nuevo lead"** quick action for vendedores.

### API
- `POST /api/deals` and `POST /api/empresas` use `requireApiRole('admin', 'direccion')` (helper in `src/lib/api-utils.ts`). Vendedores get a `403 Forbidden`.
- Both endpoints require `vendedor_asignado` in the body — there is no implicit self-assignment.
- `GET /api/empresas` is unchanged: vendedores can still read their own empresas.

### RLS (defence in depth)
Migration `009_lead_creation_role_gate.sql`:
- `empresas_insert` and `deals_insert` `WITH CHECK (get_user_role() IN ('admin','direccion'))`.
- `contactos_insert` allows vendedores **only** when the parent empresa is already assigned to them — so they can still add contactos to a company they own, but cannot create a contact under a brand-new empresa they're inserting in the same transaction.

### What vendedores can still do
- Drag their own deals between phases.
- Close their own deals (won/lost).
- Add contactos, actividades, and tareas to companies already assigned to them.
- Everything else under `/cockpit`, `/mis-tareas`, `/empresas` (read), AI chat, etc.

## Semaphore Logic

```
percentage = days_in_phase / fase.tiempo_esperado * 100
green:  percentage <= 70
amber:  percentage > 70 AND percentage <= 100
red:    percentage > 100 (add CSS pulsing class)
```

If `tiempo_esperado` is null (e.g., last phase "Cerrado"), semaphore is always green.

## Component Hierarchy

```
PipelinePage (server)
  └── KanbanBoard (client)
      ├── PipelineFilters
      ├── DndContext
      │   └── KanbanColumn (per phase)
      │       └── SortableContext
      │           └── DealCard (draggable)
      │               ├── Semaphore indicator
      │               ├── Quick activity button (hover-revealed)
      │               │   └── QuickActivity modal
      │               ├── Company name + value
      │               ├── Seller badge
      │               └── Days in phase
      └── CreateLeadModal
```

### Pipeline Filters

`PipelineFilters` exposes two filters applied client-side in `KanbanBoard`:

1. **Vendedor** — `Select` showing all sellers extracted from current deals.
   `all` shows everything; selecting a vendedor narrows to their deals only.
2. **Value range** — two number `Input`s (min/max EUR) that hide deals
   outside the range. Empty inputs are ignored, so partial ranges (only min,
   only max) are valid. Filtering happens in the `filteredFases` memo so the
   board updates instantly without refetching.

The filtered set still respects the underlying RLS scope: vendedores only ever
see their own deals because the API enforces `vendedor_asignado = auth.uid()`.

### Quick Activity from Deal Card

Each deal card exposes a small lightning-bolt icon (revealed on hover) next to the
semaphore. Clicking it stops drag/click propagation and opens a `QuickActivity`
modal pre-bound to the deal's empresa + deal IDs. The modal supports `llamada`,
`nota`, and `reunion` types and submits to `POST /api/empresas/[id]/actividades`
with `{ tipo, contenido, deal_id }`. This avoids forcing the vendedor to navigate
to the company detail page just to log a call after a drag.

## Dashboard Layout

```
DashboardLayout (server, auth guard)
  ├── Sidebar (client)
  │   ├── Logo + app name
  │   ├── NavLinks (role-filtered)
  │   │   ├── Pipeline (all roles)
  │   │   ├── My Tasks (vendedor)
  │   │   ├── Companies (all roles)
  │   │   ├── Contacts (all roles)
  │   │   ├── Dashboard (admin, direccion)
  │   │   └── Admin (admin only)
  │   └── UserMenu (name, role, sign-out)
  └── Main content area
      ├── TopBar (page title, breadcrumb, actions)
      └── {children}
```

## Navigation Items by Role

| Route | Label | vendedor | direccion | admin |
|-------|-------|----------|-----------|-------|
| /pipeline | Pipeline | yes | yes | yes |
| /mis-tareas | My Tasks | yes | yes | yes |
| /empresas | Companies | yes | yes | yes |
| /contactos | Contacts | yes | yes | yes |
| /dashboard | Dashboard | no | yes | yes |
| /admin | Settings | no | no | yes |
