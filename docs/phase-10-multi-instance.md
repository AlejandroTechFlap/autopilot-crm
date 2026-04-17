# Phase 10: Multi-instance per-tenant install [IMPLEMENTED]

> Status: **IMPLEMENTED** · Created 2026-04-08 · Implemented 2026-04-08 · Owner: Alejandro
>
> Goal: ship the CRM as a per-customer install. Each customer gets their own
> machine, their own Supabase project, and their own brand — but all installs
> run the **same code and the same migrations**. Differences live in a
> `configuracion_tenant` row, a `campos_personalizados` table, and a boolean
> feature-flag block inside `configuracion_tenant`.

## Terminology

We say "multi-tenant" colloquially, but architecturally this is
**multi-instance, single-tenant per install**:

- One repo clone per customer, one Supabase project per customer.
- No cross-tenant row isolation needed — each database already belongs to
  exactly one customer, so the existing RLS keeps working unchanged.
- "Tenant config" = the single row in `configuracion_tenant` inside that
  install's Supabase database.

This avoids the complexity of row-level multi-tenancy (tenant_id on every
table, cross-tenant leakage risk) while still letting each customer have their
own brand + optional modules.

## Scope

| # | Item | Decided |
|---|------|---------|
| 1 | Bootstrap config (Supabase URL, Gemini key) | **`.env.local` only**, set at install time — admin UI does NOT touch infra |
| 2 | Runtime branding (logo, colors, company info) | Editable from `/admin/branding`, stored in `configuracion_tenant` |
| 3 | Custom fields on empresas / contactos / deals | Editable from `/admin/campos`, stored in `campos_personalizados` + JSONB column per entity |
| 4 | Feature flags (optional modules) | Fixed catalog in `configuracion_tenant`, toggled from `/admin/funcionalidades` |
| 5 | Migrations | Every install runs the same `supabase/migrations/*.sql` files — no per-tenant branching |

## Out of scope

- Row-level multi-tenant (tenant_id columns, shared install) — not the chosen model.
- Plugin architecture / per-tenant custom code.
- Tenant self-service onboarding (who creates the Supabase project, who sets env).
- Font family customization — stick to the existing Inter/Geist stack.
- Custom fields in list views (kanban cards, BBDD tables) — v2 scope. v1 is forms + detail page only.
- `.env.local` editing from admin UI — infra stays in infra.
- Per-tenant AI prompt editing — reuse the existing hard-coded prompts.

## Data model

### 10.1 `configuracion_tenant` — singleton row

```sql
create table configuracion_tenant (
  id                uuid primary key default gen_random_uuid(),
  -- Brand
  nombre_empresa    text        not null default 'Autopilot CRM',
  logo_url          text,                         -- Supabase Storage public URL
  color_primario    text        not null default '#0f172a',
  color_acento      text        not null default '#3b82f6',
  direccion         text,
  email_contacto    text,
  telefono          text,
  -- Feature flags (fixed catalog)
  feat_ai_chat              boolean not null default true,
  feat_morning_summary      boolean not null default true,
  feat_command_palette      boolean not null default true,
  feat_dashboard_historico  boolean not null default true,
  feat_admin_kpis           boolean not null default true,
  feat_admin_scripts        boolean not null default true,
  feat_notifications        boolean not null default true,
  feat_empresa_task_cal     boolean not null default true,
  -- Bookkeeping
  updated_at        timestamptz not null default now(),
  updated_by        uuid        references usuarios(id)
);
-- Enforce singleton
create unique index configuracion_tenant_singleton
  on configuracion_tenant ((true));
-- Seed the single row on every fresh install via migration
insert into configuracion_tenant default values;
```

RLS: `select` for everyone (the brand is public to every logged-in user),
`update` only for `admin` role. No `insert` / `delete`.

### 10.2 `campos_personalizados` — definitions

```sql
create type entidad_personalizable as enum ('empresa', 'contacto', 'deal');
create type tipo_campo_personalizado as enum ('texto', 'numero', 'seleccion', 'fecha', 'booleano');

create table campos_personalizados (
  id              uuid primary key default gen_random_uuid(),
  entidad         entidad_personalizable    not null,
  clave           text                       not null,   -- slug, used as JSONB key
  etiqueta        text                       not null,   -- label shown in forms
  tipo            tipo_campo_personalizado   not null,
  opciones        jsonb,                                  -- only for 'seleccion'
  orden           int                        not null default 0,
  obligatorio     boolean                    not null default false,
  created_at      timestamptz                not null default now(),
  unique (entidad, clave)
);
```

RLS: `select` for every authenticated user (so forms can render the schema);
`insert/update/delete` only for `admin`.

### 10.3 JSONB columns on the three main tables

```sql
alter table empresas  add column campos_personalizados jsonb not null default '{}'::jsonb;
alter table contactos add column campos_personalizados jsonb not null default '{}'::jsonb;
alter table deals     add column campos_personalizados jsonb not null default '{}'::jsonb;
```

No GIN index in v1 — not searched against until we add list filters (v2).

### 10.4 Storage bucket for logo

```sql
-- Public bucket, admin-only write, everyone read
insert into storage.buckets (id, name, public) values ('brand-assets', 'brand-assets', true);
```

RLS via storage policy: `insert/update/delete` only for `admin`, `select` open.

## UX / screens

### 10.5 `/admin/branding`

Single form, two columns:

- Left: logo upload (drag-drop, preview), company name, address, email, phone.
- Right: color pickers for `color_primario` and `color_acento`, with a live
  preview card that shows a fake button + fake sidebar header using the picked
  colors.
- Save = `PATCH /api/admin/tenant`. On success: toast + optimistic update of
  the layout (CSS vars + sidebar logo refresh without reload).

### 10.6 `/admin/campos` [IMPLEMENTED 2026-04-08]

Single-view layout with an entity switcher (segmented `Empresas · Contactos ·
Oportunidades` buttons). The switcher was preferred over three tabs because
the admin area already uses base-ui tabs for the top-level admin nav and
nesting a second tab row was visually noisy.

Each view shows a card list of field definitions with:

- Label, clave (monospace badge, read-only after create), type badge,
  `Obligatorio` badge when set, opciones count for `seleccion`.
- "+ Nuevo campo" opens a modal: entidad/tipo selectors, label, auto-slugged
  clave, opciones list builder (only visible for `seleccion`), orden, and
  `Obligatorio` switch.
- Delete confirmation warns that the stored values in every record will be
  removed and that the action is irreversible (D3 strips the JSONB key
  transactionally via `public.delete_campo_personalizado`). The toast on
  success includes the number of affected rows returned by the function.

### 10.7 `/admin/funcionalidades`

Simple checkbox list, one row per `feat_*` boolean:

```
┌─ Funcionalidades activas ──────────────────┐
│ [x] Chat IA                                │
│ [x] Resumen matinal IA                     │
│ [x] Paleta de comandos (Cmd+K)             │
│ [x] Histórico del dashboard                │
│ [x] KPIs configurables (admin)             │
│ [x] Scripts (admin)                        │
│ [x] Motor de notificaciones                │
│ [x] Calendario de tareas por empresa       │
└────────────────────────────────────────────┘
```

Each row has a short description under the label. Save = `PATCH /api/admin/tenant`.

## API

| Method | Route | Who | Body / returns |
|--------|-------|-----|----------------|
| `GET`    | `/api/tenant/config`        | Any auth | Returns the `configuracion_tenant` row (brand + flags). Cached in React Cache per request. |
| `PATCH`  | `/api/admin/tenant`          | `admin`  | Partial body validated by zod; updates the singleton row. |
| `POST`   | `/api/admin/tenant/logo`     | `admin`  | Multipart upload → Supabase Storage `brand-assets/logo-{timestamp}.{ext}` → returns `{ logo_url }` which the client then PATCHes. |
| `GET`    | `/api/admin/campos`          | `admin`  | List all field definitions (all entities). |
| `POST`   | `/api/admin/campos`          | `admin`  | Body: `{ entidad, clave, etiqueta, tipo, opciones?, obligatorio, orden }` |
| `PATCH`  | `/api/admin/campos/[id]`     | `admin`  | Partial update — `clave` is immutable. |
| `DELETE` | `/api/admin/campos/[id]`     | `admin`  | Hard delete; JSONB values remain on rows until rewritten. |

All existing API routes that return `empresas` / `contactos` / `deals` will
automatically include the new `campos_personalizados` column (no code change
needed — they `select('*')` today, and the generated `Database` type picks up
the new column after `supabase gen types typescript`).

## Enforcement of feature flags

- **Sidebar** (`src/components/layout/sidebar.tsx`) hides disabled nav entries.
- **Command palette** skips commands whose feature is disabled.
- **API routes** of disabled modules return `404` (not `403`) so disabled
  features look like they don't exist at all.
- **AI chat** (`ChatPanel`) does not mount if `feat_ai_chat` is false.
- **Morning summary** (`MorningSummary`) does not mount if
  `feat_morning_summary` is false.

Feature flags are read from the cached tenant config loaded in
`src/app/(dashboard)/layout.tsx` and passed down via React context (new:
`src/features/tenant/lib/tenant-context.tsx`).

## File map

### New files

| File | Purpose |
|------|---------|
| `supabase/migrations/20260408000000_010_tenant_config.sql` | Tables, enums, JSONB columns, storage bucket, RLS, singleton seed. |
| `src/features/tenant/types.ts` | `TenantConfig`, `CampoPersonalizado`, `TipoCampo`, `Entidad`. |
| `src/features/tenant/lib/get-tenant-config.ts` | Server-only loader, `cache()`-wrapped. |
| `src/features/tenant/lib/tenant-context.tsx` | Client context provider + `useTenantConfig()` hook. |
| `src/features/tenant/lib/custom-fields.ts` | Helpers: render value, validate against definition, diff. |
| `src/features/tenant/components/custom-fields-form.tsx` | Renders inputs from a list of `CampoPersonalizado`. Used in empresa/contacto/deal forms. |
| `src/features/admin/branding/branding-form.tsx` | Admin branding form. |
| `src/features/admin/branding/logo-uploader.tsx` | Drag-drop logo upload. |
| `src/features/admin/campos/campos-manager.tsx` | List + entity switcher + delete orchestration. |
| `src/features/admin/campos/campo-dialog.tsx` | Create/edit field modal. |
| `src/features/admin/campos/opciones-builder.tsx` | Controlled editor for the `seleccion` options list. |
| `src/features/admin/campos/save-campo.ts` | Shared POST/PATCH helper + validation (keeps dialog under the 300-line cap). |
| `src/features/admin/campos/schemas.ts` | zod `CreateCampoSchema` + `UpdateCampoSchema`. |
| `src/features/admin/campos/campos-copy.ts` | Spanish labels + `slugifyClave`. |
| `supabase/migrations/20260408010000_011_delete_campo_personalizado.sql` | Stored procedure that strips the JSONB key from every row and deletes the definition in a single transaction (D3). |
| `src/features/admin/funcionalidades/feature-toggles.tsx` | Checkbox list. |
| `src/app/(dashboard)/admin/branding/page.tsx` | Admin route. |
| `src/app/(dashboard)/admin/campos/page.tsx` | Admin route. |
| `src/app/(dashboard)/admin/funcionalidades/page.tsx` | Admin route. |
| `src/app/api/tenant/config/route.ts` | GET. |
| `src/app/api/admin/tenant/route.ts` | PATCH. |
| `src/app/api/admin/tenant/logo/route.ts` | POST multipart upload. |
| `src/app/api/admin/campos/route.ts` | GET + POST. |
| `src/app/api/admin/campos/[id]/route.ts` | PATCH + DELETE. |

### Updated files

| File | Change |
|------|--------|
| `src/app/(dashboard)/layout.tsx` | Load tenant config, wrap children in `<TenantProvider>`, inject CSS vars. |
| `src/components/layout/sidebar.tsx` | Use tenant `nombre_empresa` + `logo_url`; hide nav entries per feature flags. |
| `src/app/(dashboard)/admin/page.tsx` | Add cards for Branding, Campos, Funcionalidades. |
| `src/features/empresa/components/empresa-form.tsx` | Render `<CustomFieldsForm entidad="empresa" ... />` after standard fields. |
| `src/features/contactos/components/contacto-form.tsx` | Same. |
| `src/features/pipeline/components/deal-form.tsx` | Same. |
| `src/types/database.ts` | Regenerate after migration. |
| `CLAUDE.md` | Add Phase 10 row (DRAFT → IMPLEMENTED at end). |
| `docs/gap-analysis.md` | Add §14 Phase 10 section. |

## Implementation order

Strictly sequential — each step is a valid stopping point.

1. **Migration 010** — create tables, enums, JSONB columns, storage bucket, RLS, seed row. Apply via `supabase db push` (CLI, never dashboard SQL editor). **✓ done**
2. **Regenerate types** — `pnpm supabase:types` (or equivalent). Commit. **✓ done**
3. **Tenant loader + context** — `get-tenant-config.ts`, `tenant-context.tsx`, plumb through `(dashboard)/layout.tsx`. **✓ done**
4. **Branding screen** — `/admin/branding`, `PATCH /api/admin/tenant`, `POST /api/admin/tenant/logo`. Sidebar picks up logo + name. **✓ done**
5. **Feature flags screen** — `/admin/funcionalidades`, enforcement in sidebar + admin tabs + admin overview + cockpit (morning summary) + empresa detail (task calendar) + dashboard (historico charts + sparklines) + command palette (AI chat commands) + API routes (hard-404 via `assertFeatureFlag`) + page routes (hard-404 via `requireFeatureFlag`). **✓ done**
6. **Custom fields — admin side** — `/admin/campos`, `GET/POST/PATCH/DELETE /api/admin/campos`. Delete is transactional via `public.delete_campo_personalizado` (migration 011). **✓ done**
7. **Custom fields — forms side** — `CustomFieldsForm` rendered in `create-lead-modal` (writes empresa + contacto + deal in one POST to `/api/deals`), with server-side re-validation via `validateCamposPersonalizados` and JSONB persistence. Empresa detail page renders a read-only "Campos personalizados" card. `lead-form-fields.tsx` extracted as a sibling of `create-lead-modal.tsx` to keep both files under the 300-line cap. Future contacto / deal edit forms (when introduced) plug in `CustomFieldsForm` the same way. **✓ done 2026-04-08**
8. **Full verification** — `npx tsc --noEmit` clean, `pnpm lint` clean, `pnpm build` clean (56 routes generated). Runtime smoke + dual-install brand/flag visual diff are manual checks per `docs/user-guide.md`. **✓ done 2026-04-08**
9. **Doc flip** — this file to `[IMPLEMENTED]`, `CLAUDE.md` row, gap-analysis §14. **✓ done 2026-04-08**

Each step is a valid commit / stopping point. Steps 4–7 are independent enough
to reorder if a blocker shows up.

## Demo coverage in the seed (2026-04-08)

The Phase 10 surfaces are now fully exercised by `npm run seed` — no post-seed
manual setup required to demo any of the three mechanisms:

- **Branding** — `seedTenantConfig` in `supabase/seed/custom-fields.ts` UPDATES
  the singleton row created by migration 010's `INSERT DEFAULT VALUES`. Sets
  `nombre_empresa`, primary/accent colors, contact info, and flips every
  feature flag (`feat_ai_chat`, `feat_morning_summary`, `feat_command_palette`,
  `feat_dashboard_historico`, `feat_admin_kpis`, `feat_admin_scripts`,
  `feat_notifications`, `feat_empresa_task_cal`) to `true`.
- **Custom field definitions** — `seedCustomFieldDefinitions` upserts 7 rows
  (3 empresa + 2 contacto + 2 deal) covering every `tipo` enum value, upserted
  via `onConflict: 'entidad,clave'`.
- **Custom field values** — populated in the JSONB `campos_personalizados`
  column on 4 empresas (in `supabase/seed/companies.ts`), 3 contactos
  (`contacts.ts`), and 2 deals (`deals.ts`). The read-only "Campos
  personalizados" card on `/empresa/[id]` renders out of the box for any of
  those empresas.

See [`seed.md`](./seed.md) for the complete seed entity coverage table.

## Locked decisions (2026-04-08)

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | **Logo: PNG only** in v1 | Smallest scope, no SVG sanitisation risk, no colour-profile edge cases. SVG + JPG can ship in v2 if anyone asks. |
| D2 | **Colors: free-form hex input** | Max flexibility — no curated palette. Validated by a `/^#[0-9a-f]{6}$/i` regex both client and server side. |
| D3 | **On field delete: strip the key from every row's JSONB in one transaction** | No orphan data left behind. Implemented server-side as `update <entidad> set campos_personalizados = campos_personalizados - '<clave>' where campos_personalizados ? '<clave>'`, wrapped in the same transaction as the `delete from campos_personalizados`. |
| D4 | **Feature-flag enforcement: hard-404 for direct URL access** | Disabled features look like they don't exist at all. Sidebar hide + API route hard-404 + page route hard-404 (`notFound()` from `next/navigation` when the flag is false). |

## Observability & clean architecture (non-negotiable)

Every file added in Phase 10 must meet these bars. They are not optional and
will be verified on each commit:

### Observability

- Every API route emits at least one structured log per call path using the
  existing `src/lib/logger.ts`:
  - `logger.info({ scope: 'api.admin.tenant', event: 'updated', userId, fields: Object.keys(body) })` on success
  - `logger.warn({ scope: 'api.admin.tenant', event: 'forbidden', userId })` on auth failure
  - `logger.error({ scope: 'api.admin.tenant', event: 'failed', err })` on exception
- Log payloads NEVER contain raw field values (might be PII), only keys /
  identifiers / boolean outcomes. Field values live in the DB, not the log.
- `scope` is always `api.<area>.<noun>` for API routes,
  `feat.<area>.<noun>` for feature modules, `db.<table>` for DB helpers.
- `event` is always one of a short vocabulary: `requested`, `success`,
  `updated`, `created`, `deleted`, `forbidden`, `not_found`, `invalid`,
  `failed`.
- Custom-field CRUD logs emit `{ entidad, clave }` so tenant admins can
  reconstruct what changed from the logs alone.
- Logo uploads log `{ size, mime, filename }` — never the file bytes.

### Clean architecture

- **≤ 300 lines per file, hard cap**. Any file approaching 250 is split
  before adding more code.
- **Single responsibility per file.** A form file does not fetch. A fetcher
  does not render. A zod schema lives next to the route it validates.
- **Flat module tree.**
  - `src/features/tenant/`       — shared tenant loader, context, types, helpers
  - `src/features/admin/branding/` — branding screen only
  - `src/features/admin/campos/`   — custom fields screen only
  - `src/features/admin/funcionalidades/` — feature flags screen only
  - No deeper nesting. No `utils/utils/helpers/` chains.
- **DRY.** Any logic used in ≥ 2 places goes in `src/features/tenant/lib/`.
  Specifically: the tenant loader, the custom-field zod validator, the
  JSONB strip helper, and the feature-flag guard all live there once.
- **Pure vs. effectful separation.** Pure helpers (validators,
  value renderers, hex regex) have no imports from Next.js or Supabase.
  Effectful modules (API routes, loaders) import the pure helpers, not the
  other way around.
- **No new deps.** Phase 10 adds zero packages to `package.json` — every
  piece (zod, Supabase Storage, shadcn inputs, lucide icons) already exists.
- **Zero `eslint-disable`, zero `@ts-ignore`, zero `any`.** If a type is
  awkward, fix the type definition. The custom-fields JSONB is typed as
  `Record<string, string | number | boolean | null>` — a single discriminated
  union, not `any`.
