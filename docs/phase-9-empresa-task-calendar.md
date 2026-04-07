# Phase 9: Empresa Task Calendar [DRAFT]

## Overview

Adds an interactive month-calendar widget to the company detail page
(`/empresa/[id]`) so sales reps can see — and manage — pending and upcoming tasks
scoped to that company without leaving the page.

Today, tasks live in the `tareas` table and are only visible from the global
`/mis-tareas` cockpit. From a company's perspective they are invisible until you
navigate away. This widget closes that gap and offers a fast path to create new
tasks already wired to the company.

## UX

A new `Tareas` card lives in the right sidebar of `empresa/[id]/client.tsx`,
above `Contactos`. Layout:

```
┌─ Tareas ───────────────┐
│ [Month calendar]    ‹›│
│  M T W T F S S         │
│      1 2 3 4 5 6       │
│  7•8 9•10 11 12 13     │
│  14 15•16 17 18 19 20  │
├────────────────────────┤
│ Tue, 8 Apr (2)         │
│ ☐ Llamar Juan  [alta]  │
│ ☐ Enviar prop. [media] │
│                        │
│ Vencidas (1)           │
│ ☐ Cerrar contrato      │
│                        │
│ + Nueva tarea          │
└────────────────────────┘
```

- Days that have at least one open task get a primary-coloured dot under the date.
- Today is highlighted by the existing `today` calendar style.
- Selected day defaults to today; clicking another day swaps the list below.
- Each row uses the existing `TaskCard` component (checkbox completes the task).
- Below the selected-day list, an "Vencidas" section shows overdue tasks not on
  the selected day, so they are never hidden.
- "+ Nueva tarea" opens `CreateTaskModal` pre-scoped to this empresa.

## Files

| File | Purpose | LOC budget |
|------|---------|------------|
| `src/app/api/tareas/route.ts` | Add optional `empresa_id` query param to GET | +5 |
| `src/features/cockpit/components/create-task-modal.tsx` | Add optional `empresaId` prop, included in POST body when set | +6 |
| `src/features/empresa/components/empresa-task-calendar.tsx` | New client component — calendar + selected-day list + create button | ≤ 220 |
| `src/app/(dashboard)/empresa/[id]/page.tsx` | Pass current `userId` to client | +3 |
| `src/app/(dashboard)/empresa/[id]/client.tsx` | Render the new card; thread `userId` to it | +8 |

No schema migration. No new dependencies. `react-day-picker` v9 + `date-fns` are
already installed and the shadcn `Calendar` wrapper is in place.

## API contract

`GET /api/tareas?empresa_id={uuid}&completada=false`

- New optional param `empresa_id` (uuid). When present, the query is filtered with
  `.eq('empresa_id', empresa_id)`.
- All other behaviour unchanged. Vendedor RLS still scopes to own tasks.
- Response shape unchanged: `{ tareas: Task[], count: number }`.

## Reuse

- `Calendar` from `src/components/ui/calendar.tsx` (`modifiers` + `modifiersClassNames`)
- `TaskCard`, `Task` type, `useTasks` patterns from `src/features/cockpit/`
- `CreateTaskModal` (extended with one optional prop, fully backwards-compatible)
- `formatDate` from `src/lib/formatting.ts`
- `PRIORIDAD_LABELS` / `PRIORIDAD_COLORS` from `src/lib/constants.ts`

## Acceptance criteria

1. Opening a company shows the calendar in the right sidebar.
2. Days with open tasks show a primary-coloured dot.
3. Clicking a day swaps the task list below to that day's tasks.
4. Ticking a task removes it from the list and clears its dot if it was the
   only one.
5. "Nueva tarea" with a future date adds a dot to that day after refresh.
6. Vendedores only see their own tasks for the company; dirección/admin see all.
7. Empty state ("No hay tareas para esta empresa") renders cleanly when there
   are zero tasks.
8. `npx tsc --noEmit` clean.
