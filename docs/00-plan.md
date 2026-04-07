# Autopilot CRM — Master Plan

> Originally drafted in session 1 of the project. Mirrored here from
> `/home/john/.claude/plans/prancy-wiggling-kettle.md` so it is visible from the repo.
> Anything in this file represents the **target state**. Reality is tracked in
> [`gap-analysis.md`](./gap-analysis.md).

## 1. Context

Autopilot CRM is an MVP sales management system for SMB sales teams without prior CRM
experience. It's white-label and self-hosted. The product is delivered as a partnership
demo to **Flap Consulting × RSR Bridge**.

- **Original spec:** Node.js + Express + React + Vite monorepo
- **User's choice:** **Next.js (App Router) + Supabase Cloud + shadcn/ui + TypeScript strict**

The original spec (`MVP - HTML y Playbook/Autopilot_CRM_Especificacion_Tecnica_Desarrollo.md`)
defines: 6 modules, 6 screens, **42 features**, 3 roles, 18 admin-configurable rules,
10 invariant system rules.

### Confirmed decisions

| Decision | Choice |
|----------|--------|
| Database | Existing Supabase Cloud project "RSR CRM Project" |
| Deployment | VPS with Docker via Portainer (NOT Vercel) |
| AI chat | Included in MVP — Claude API as key differentiator |
| Wow feature | Command Palette (Cmd+K) for global search + quick actions |
| Realtime | Supabase Realtime for live pipeline updates |
| Credentials | `.env.local` only — never in code, plan, or memory |

## 2. Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js (App Router, latest) | Single project replaces monorepo. Server Components + API routes |
| UI | shadcn/ui + Tailwind CSS | Copy-paste components, fully customizable, matches HTML prototype |
| Language | TypeScript strict (`"strict": true`) | No `any`; all params/returns typed |
| Database | Supabase Cloud (PostgreSQL) | Auth + Realtime + RLS + type generation in one |
| Migrations | Supabase CLI | `supabase migration new` / `db push` / `gen types` |
| Auth | Supabase Auth (JWT + RLS) | No custom middleware |
| Realtime | Supabase Realtime | Live pipeline updates via WebSocket |
| AI | `@anthropic-ai/sdk` | Conversational assistant + morning summaries |
| Drag & Drop | `@dnd-kit` | Modern replacement for react-beautiful-dnd |
| Charts | Recharts | KPI tiles, sparklines, historical charts |
| Validation | Zod | Runtime validation on API inputs + form data |
| Notifications | Sonner | Toast UI |
| Command Palette | `cmdk` | Cmd+K global search + actions |
| Deploy | Docker + Portainer | Self-hosted on VPS |
| Package Manager | pnpm | Fast, disk-efficient |

## 3. Design System

| Token | Value |
|-------|-------|
| Primary | `#0D7377` (teal) |
| Green | `#059669` |
| Amber | `#D97706` |
| Red | `#DC2626` |
| Blue | `#2563EB` |
| Text Primary | `#111827` |
| Text Secondary | `#4B5563` |
| Text Muted | `#9CA3AF` |
| Background | `#F4F5F7` |
| Surface | `#FFFFFF` |
| Border | `#E2E4E9` |
| Font | Inter, system-ui |
| Radius | 8px (main), 6px (small) |
| Shadow SM | `0 1px 2px rgba(0,0,0,.05)` |
| Shadow MD | `0 4px 12px rgba(0,0,0,.08)` |

## 4. Database Schema (16 tables)

```
EMPRESA (master record — never deleted)
  ├── N → CONTACTOS
  ├── N → DEALS
  └── N → ACTIVIDADES (immutable audit log)
```

Tables in migration order:

1. **usuarios** — id (UUID, FK auth.users), nombre, email, rol, avatar_url
2. **pipelines** — id, nombre, created_by
3. **fases** — id, pipeline_id, nombre, orden, tiempo_esperado (days), criterios_entrada (JSONB)
4. **empresas** — id, nombre, lifecycle_stage, fuente_lead, vendedor_asignado, proxima_accion, proxima_accion_fecha, provincia, etiquetas (text[]), notas_internas, prioridad, categoria, descripcion, informador, created_at, updated_at
5. **contactos** — id, empresa_id, nombre_completo, cargo, telefono, email, es_principal
6. **deals** — id, empresa_id, pipeline_id, fase_actual, valor, vendedor_asignado, fecha_entrada_fase, motivo_perdida, cerrado_en, resultado
7. **actividades** — id, empresa_id, contacto_id, deal_id, tipo, contenido, usuario_id, created_at — **IMMUTABLE**
8. **tareas** — id, empresa_id, deal_id, vendedor_asignado, titulo, descripcion, prioridad, fecha_vencimiento, completada, origen, tipo_tarea
9. **comisiones** — id, deal_id, vendedor_id, valor_deal, porcentaje, importe_comision, periodo
10. **scripts** — id, titulo, fase_asociada, contenido, tags (text[]), created_by
11. **notificacion_config** — id, disparador_tipo, activo, umbral_horas, canal, destinatario_id, horario_inicio, horario_fin
12. **kpi_config** — id, tipo, umbral_verde, umbral_ambar, objetivo, periodo
13. **kpi_snapshots** — id, kpi_tipo, valor, fecha
14. **notificaciones_log** — id, disparador_tipo, empresa_id, deal_id, destinatario_id, canal, estado, error_msg, created_at — **IMMUTABLE**
15. **notificaciones** — id, usuario_id, titulo, contenido, leido, tipo, referencia_id
16. **vistas_guardadas** — id, usuario_id, nombre, tab, filtros (JSONB), columnas (JSONB), compartida

### RLS strategy

- **vendedor**: only records where `vendedor_asignado = auth.uid()`
- **dirección**: read all, can create tasks for others, manage scripts
- **admin**: full access including config tables
- Role stored in `usuarios.rol`, joined from `auth.uid()`

### Triggers

- `actividades`: BEFORE UPDATE/DELETE → `RAISE EXCEPTION 'immutable'`
- `notificaciones_log`: same immutability
- `empresas`: BEFORE UPDATE → auto-set `updated_at = NOW()`
- Indexes on `empresas(vendedor_asignado)`, `deals(fase_actual, vendedor_asignado)`,
  `actividades(empresa_id, created_at DESC)`, `contactos(empresa_id, es_principal)`

### Seed (deliverable)

- 1 pipeline "Retail mascotas" with 6 phases (1d, 2d, 5d, 7d, 10d, null)
- 4 users: 1 admin, 1 dirección (Rebeca), 2 vendedores (Ignacio, Laura)
- 11 companies, 15 contacts, 11 deals across the phases
- ~30 activities, 4 scripts, notification + KPI config

## 5. Project Structure (target)

```
autopilot-crm/
├── src/
│   ├── app/
│   │   ├── (auth)/login/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx          # auth + role-aware shell
│   │   │   ├── pipeline/
│   │   │   ├── dashboard/
│   │   │   ├── mis-tareas/
│   │   │   ├── empresas/
│   │   │   ├── contactos/
│   │   │   ├── empresa/[id]/
│   │   │   └── admin/              # phase 7
│   │   └── api/
│   │       ├── empresas/  contactos/  deals/  pipeline/
│   │       ├── tareas/  scripts/  notificaciones/
│   │       ├── dashboard/  mis-kpis/  search/
│   │       ├── chat/                # Claude streaming
│   │       └── admin/               # phase 7
│   ├── features/                   # feature modules
│   │   ├── pipeline/  empresa/  dashboard/  cockpit/
│   │   ├── database/  notifications/  ai-chat/
│   │   ├── command-palette/  admin/
│   ├── lib/
│   │   ├── supabase/{client,server,middleware}.ts
│   │   ├── auth.ts  api-utils.ts  formatting.ts  errors.ts
│   ├── components/{ui,layout,common}/
│   ├── types/{database.ts,api.ts}
│   └── middleware.ts
├── supabase/{migrations,seed,config.toml}
├── docs/{phase-N.md, plan, gap-analysis}
└── Dockerfile  docker-compose.yml
```

## 6. Implementation Phases

| Phase | Focus | Status |
|-------|-------|--------|
| 0 | Project setup (Next.js, shadcn, Supabase CLI, env validation, theme) | DONE |
| 1 | DB migrations (16 tables) + RLS + immutability triggers + auth + seed | DONE |
| 2 | Pipeline Kanban with @dnd-kit + company detail page + Realtime | DONE |
| 3 | Cockpit (vendedor) + Dashboard (dirección) with KPI tiles + drill-downs | DONE |
| 4 | Database tables (empresas/contactos) + notification engine | DONE |
| 5 | AI Chat (Claude API streaming) + Morning Summary | DONE |
| 6 | Cmd+K palette + responsive polish + Docker deploy | DONE |
| 7 | Admin suite (phases, scripts, users, KPI config, notification config) | DONE |
| 8 | UI/UX polish: loading skeletons, error boundary, not-found page | DONE |
| 9 | Empresa task calendar widget | DRAFT (not yet implemented) |
| — | Spanish-only UI sweep + glossary (`docs/i18n.md`) | DONE 2026-04-07 |
| — | Root-redirect moved to proxy (Next.js 16 RootPage perf bug fix) | DONE 2026-04-07 |

See [`gap-analysis.md`](./gap-analysis.md) for the per-feature breakdown.

## 7. Wow Features (confirmed for MVP)

| Feature | Phase | Description |
|---------|-------|-------------|
| **AI Chat Assistant** | 5 | Conversational interface using Claude with CRM context |
| **AI Morning Summary** | 5 | Auto-generated brief on cockpit (urgent, pipeline health, recommendations) |
| **Command Palette (Cmd+K)** | 6 | Global search across companies, deals, contacts + quick actions |
| **Realtime Collaboration** | 2 | Director moves deal → vendedor sees instantly via Supabase Realtime |
| **Pulsing Semaphore** | 2 | Red deals pulse with CSS animation (spec requires) |

### Bonus (if time)

| Feature | Effort | Impact |
|---------|--------|--------|
| Confetti on Deal Won | 0.5h | Low fun |
| Aging heatmap in BBDD | 2h | Medium |
| Dark mode (`next-themes`) | 3h | Medium |
| Activity streak gamification | 2h | Medium |

## 8. Deployment

1. Multi-stage `Dockerfile` (build Next.js → run with node).
2. `docker-compose.yml` (app + optional nginx reverse proxy).
3. Build/push image; deploy via Portainer.
4. Env vars (Supabase URL, anon key, service role key, Claude API key) configured in Portainer stack.

## 9. Resolved Decisions

| Decision | Answer |
|----------|--------|
| Supabase project | Existing "RSR CRM Project" |
| Deployment | VPS with Docker via Portainer |
| AI Chat | Include in MVP (Claude API) |
| Wow features | Cmd+K + Realtime + Pulsing Semaphore + AI |
| Notification channels | In-app first; email/Slack added in admin suite (Phase 7) |
