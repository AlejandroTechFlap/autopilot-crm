# Phase 4: Database View + Notifications [IMPLEMENTED]

## Overview

Phase 4 delivers two features:
1. **Database View** — table view of empresas and contactos with search, sort, filter, pagination, CSV export, and inline editing
2. **Notifications** — in-app notification bell with panel, notification triggers for overdue follow-ups and stalled deals

## Architecture

### Route Structure

```
/empresas                      → Empresas table view
/contactos                     → Contactos table view

/api/empresas                  → GET (already exists — add sort, filters)
/api/contactos                 → GET (new list endpoint), POST (already exists)
/api/contactos/[id]            → PATCH (inline edit)
/api/empresas/export           → GET (CSV export)
/api/contactos/export          → GET (CSV export)
/api/notificaciones            → GET (list), PATCH (mark read)
/api/notificaciones/count      → GET (unread count)
```

## API Contracts

### GET /api/empresas (enhanced)

Existing endpoint enhanced with additional params:

- `search` — ilike on nombre (existing)
- `sort` — column name (default: updated_at)
- `order` — asc|desc (default: desc)
- `lifecycle_stage` — filter
- `fuente_lead` — filter
- `prioridad` — filter
- `vendedor_id` — filter (vendedores auto-scoped)
- `limit`, `offset` — pagination (default 25/0)

### GET /api/contactos (list)

Query params: `search` (ilike nombre_completo), `empresa_id`, `sort`, `order`, `limit`, `offset`

```json
{
  "contactos": [
    {
      "id": "uuid",
      "nombre_completo": "Juan Pérez",
      "cargo": "Director Comercial",
      "telefono": "+34...",
      "email": "juan@...",
      "es_principal": true,
      "empresa": { "id": "uuid", "nombre": "PetFood SA" },
      "created_at": "..."
    }
  ],
  "count": 15
}
```

### PATCH /api/contactos/[id]

Inline edit: `nombre_completo`, `cargo`, `telefono`, `email`

### GET /api/empresas/export + /api/contactos/export

Returns CSV with Content-Type text/csv. Applies current filters from query params.

### GET /api/notificaciones

```json
{
  "notificaciones": [
    {
      "id": "uuid",
      "titulo": "Overdue follow-up",
      "contenido": "PetFood SA has not been contacted in 7 days",
      "tipo": "follow_up",
      "leido": false,
      "referencia_id": "empresa-uuid",
      "created_at": "..."
    }
  ]
}
```

### PATCH /api/notificaciones (bulk mark read)

```json
{ "ids": ["uuid1", "uuid2"] }
```

### GET /api/notificaciones/count

```json
{ "count": 3 }
```

## Component Hierarchy

### Empresas Page (`/empresas`)

```
EmpresasPage (server)
└── DatabaseViewClient (client)
    ├── DatabaseToolbar
    │   ├── SearchInput (debounced)
    │   ├── FilterDropdowns (lifecycle, source, priority)
    │   ├── ExportButton (CSV)
    │   └── Tab switches (empresas/contactos)
    ├── EmpresasTable
    │   ├── SortableHeader[]
    │   └── EmpresaRow[] (with inline edit cells)
    └── Pagination
```

### Contactos Page (`/contactos`)

Same structure with ContactosTable.

### Notification Panel (TopBar)

```
TopBar
├── ... existing
└── NotificationBell
    ├── Badge (unread count)
    └── NotificationPanel (popover)
        ├── NotificationItem[]
        └── "Mark all read" button
```

## Database View Features

1. **Search** — debounced text input, filters by nombre (empresas) or nombre_completo (contactos)
2. **Column sorting** — click header to toggle asc/desc, indicator arrow
3. **Filters** — dropdown filters for enums (lifecycle_stage, fuente_lead, prioridad)
4. **Pagination** — page size 25, previous/next buttons, total count display
5. **CSV export** — downloads filtered data as CSV file
6. **Inline editing** — click cell to edit in place, PATCH on blur/enter. Implemented via `InlineEditCell` (`src/features/database/components/inline-edit-cell.tsx`). Editable fields: `provincia` on empresas; `cargo`, `email`, `telefono` on contactos. Enter commits, Escape reverts, blur commits if changed. Empty submissions save `null` (the field is cleared). Local state is updated optimistically — failures revert and toast the error.

## Notification Triggers

Built as on-demand API checks (not cron for MVP). Logic lives in
`src/features/notifications/lib/triggers.ts` and runs from `GET /api/notificaciones/count`.

1. **Overdue follow-up** — empresa with `proxima_accion_fecha < today`. Inserts a `follow_up_overdue` notification for the assigned vendedor.
2. **Stalled deal** — deal where `now - fecha_entrada_fase > fase.tiempo_esperado * 1.5` days. Inserts a `deal_stalled` notification for the assigned vendedor.

**Dedupe**: Each trigger checks for an existing notification with the same `(usuario_id, tipo, referencia_id)` created today before inserting, so notifications are not duplicated within a 24-hour window.

**Scope**: For vendedores, triggers only check their own records (RLS-aligned). For dirección/admin, checks span all records but only assigned vendedores receive notifications.
