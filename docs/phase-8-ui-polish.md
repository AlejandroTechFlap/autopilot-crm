# Phase 8: UI/UX Polish [IMPLEMENTED]

## Overview

Closes Task #51. Adds the cross-cutting UX primitives the build was missing:

1. **`loading.tsx`** for every top-level route — Next.js automatically renders these
   while the server component is suspended. Today the user sees a blank screen.
2. **`error.tsx`** at the dashboard layout level — converts uncaught errors into a
   friendly fallback with a *Try again* button instead of a Next.js dev overlay.
3. **`not-found.tsx`** at the dashboard layout level — friendly 404 for unknown
   `/empresa/[id]` etc.
4. **Skeleton helpers** in `src/components/ui/skeletons/` so each route can render a
   shape that matches its real content (table rows, kanban columns, KPI tiles).

## Files

| File | Purpose | LOC budget |
|------|---------|------------|
| `src/components/ui/skeletons/table-skeleton.tsx` | Generic table placeholder (rows × cols) | 30 |
| `src/components/ui/skeletons/kanban-skeleton.tsx` | Kanban column placeholder | 35 |
| `src/components/ui/skeletons/kpi-skeleton.tsx` | 5-tile KPI grid placeholder | 30 |
| `src/components/ui/skeletons/detail-skeleton.tsx` | Detail-page placeholder (header + 2-col grid) — matches `/empresa/[id]` | 55 |
| `src/app/(dashboard)/loading.tsx` | Default fallback — page-shaped skeleton (title + card grid), Spanish aria label | 25 |
| `src/app/(dashboard)/error.tsx` | Error boundary with reset | 35 |
| `src/app/(dashboard)/not-found.tsx` | 404 friendly page | 20 |
| `src/app/(dashboard)/pipeline/loading.tsx` | Kanban skeleton | 5 |
| `src/app/(dashboard)/dashboard/loading.tsx` | KPI skeleton | 5 |
| `src/app/(dashboard)/empresas/loading.tsx` | Table skeleton | 5 |
| `src/app/(dashboard)/contactos/loading.tsx` | Table skeleton | 5 |
| `src/app/(dashboard)/mis-tareas/loading.tsx` | Table skeleton | 5 |
| `src/app/(dashboard)/empresa/[id]/loading.tsx` | Detail skeleton (2026-04-16 addition — heaviest server fetch) | 5 |
| `src/app/(dashboard)/admin/loading.tsx` | Card grid skeleton — parent covers all `/admin/*` children via Next.js Suspense walk-up | 5 |

All files MUST use the existing `Skeleton` primitive from `src/components/ui/skeleton.tsx`.
Client-side `error.tsx` must be a `'use client'` component per Next.js 16 conventions.

## Acceptance criteria

1. Navigating to any route shows a skeleton matching the page shape (not blank, not a
   raw spinner) within 100ms of click.
2. Throwing an error inside a server component renders the friendly fallback.
3. Visiting `/empresa/00000000-0000-0000-0000-000000000000` shows the 404 page.
4. `npx tsc --noEmit` reports zero errors.
5. No file exceeds the 300-line cap; the largest new file is ~35 LOC.

## Out of scope (deferred)

- Empty-state illustrations (just text + icon for now).
- Responsive breakpoints beyond what shadcn already provides.
- Accessibility audit (separate phase).
