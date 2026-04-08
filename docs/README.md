# Autopilot CRM — Documentation Index

> **Start here.** This index points to every spec the team and Claude should read before touching code.
> Rule from `AGENTS.md` / `CLAUDE.md`: **Document First** — write or update the relevant spec before
> writing or modifying code.

## 0. Plan & status

| Doc | Purpose | Status |
|-----|---------|--------|
| [`00-plan.md`](./00-plan.md) | Original implementation plan from session 1: stack, schema, 6 phases, wow features | Living |
| [`gap-analysis.md`](./gap-analysis.md) | Spec → implementation matrix (42 features × DONE / PARTIAL / MISSING) | Living |

## 1. Phase specs

Phases are the units of work. Each phase doc owns its API contracts, component
hierarchy, and acceptance criteria.

| Phase | Doc | Scope | Status |
|-------|-----|-------|--------|
| 0 | (no doc — see plan) | Project setup, env, shadcn, Supabase CLI | IMPLEMENTED |
| 1 | (no doc — see plan) | DB schema (16 tables), RLS, auth, seed | IMPLEMENTED |
| 2 | [`phase-2-pipeline-company.md`](./phase-2-pipeline-company.md) | Kanban pipeline + company detail | IMPLEMENTED |
| 3 | [`phase-3-cockpit-dashboard.md`](./phase-3-cockpit-dashboard.md) | Cockpit (vendedor) + Dashboard (dirección) + drill-downs | IMPLEMENTED |
| 4 | [`phase-4-database-notifications.md`](./phase-4-database-notifications.md) | Database tables (empresas/contactos) + notification engine | IMPLEMENTED |
| 5 | [`phase-5-ai-chat.md`](./phase-5-ai-chat.md) | Claude-powered chat assistant + morning summary | IMPLEMENTED |
| 6 | [`phase-6-polish-deploy.md`](./phase-6-polish-deploy.md) | Cmd+K palette, responsive polish, Docker deploy | IMPLEMENTED |
| 7 | [`phase-7-admin-suite.md`](./phase-7-admin-suite.md) | Admin panel: phases, scripts, users, KPI config, notification config | IMPLEMENTED |
| 8 | [`phase-8-ui-polish.md`](./phase-8-ui-polish.md) | Loading skeletons, error boundary, not-found page | IMPLEMENTED |
| 9 | [`phase-9-empresa-task-calendar.md`](./phase-9-empresa-task-calendar.md) | Empresa task calendar widget | IMPLEMENTED |
| 10 | [`phase-10-multi-instance.md`](./phase-10-multi-instance.md) | Multi-instance per-tenant install (branding, custom fields, feature flags) | DRAFT |
| — | [`i18n.md`](./i18n.md) | Spanish-only UI rule + glossary + per-file translation status | Living |
| — | [`user-guide.md`](./user-guide.md) | End-user feature guide and step-by-step test scenarios | Living |
| — | [`seed.md`](./seed.md) | Seed system: date-relative anchoring, entity coverage, helpers, test-user starting state | Living |

## 2. Source-of-truth spec from the customer

The original product spec (Spanish, by Flap Consulting × RSR) lives outside this repo at:

```
/home/john/Desktop/Projects/CRM/MVP - HTML y Playbook/
├── Autopilot_CRM_Especificacion_Tecnica_Desarrollo.md   # 679 lines, 42 features, 18 admin rules
├── Autopilot_CRM_Playbook_Claude_Code.md                # AI-coding playbook
├── MVP_CRM_Direccion.html                               # HTML prototype: dashboard view
└── MVP_CRM_Vendedor.html                                # HTML prototype: cockpit view
```

It defines **6 screens, 42 features, 3 roles, 18 admin-configurable rules, 10 invariant
system rules**. The gap-analysis doc reconciles every requirement against the current build.

## 3. How to use these docs (for Claude or any contributor)

1. Before writing code, read the relevant phase doc + the gap-analysis row.
2. If the spec needs to change, update the phase doc **first**, mark it `[DRAFT]`, then code,
   then mark `[IMPLEMENTED]`.
3. Cross-link aggressively: every API contract should name its callers; every component
   should name its API.
4. Files cap at **300 lines**. If a spec or module crosses 250, split it before adding more.
5. All docs and code are written in **English only**, even though the user-facing UI
   contains Spanish strings.
