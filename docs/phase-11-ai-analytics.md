# Phase 11: AI Data Analytics & Interactive Visualization [IMPLEMENTED]

## Overview

Extends the AI assistant (Phase 5) with analytical query capabilities and
interactive visualization. The AI can write SQL queries against the CRM
database, render charts and tables inline in chat, and show data-source
citations.

Features:

1. **SQL Analytics** — AI generates SELECT queries using schema knowledge.
   Server validates (SELECT-only, timeout, row limit) and executes via
   the user's RLS-scoped Supabase session.
2. **Inline Charts** — Bar, line, area, and pie charts rendered in chat
   bubbles using recharts (already in the project).
3. **Data Tables** — Formatted tables with column headers rendered inline.
4. **Citations** — Collapsible indicators showing the SQL query and row
   count for transparency.

## New Tools

### `query_database`

AI-generated SQL execution with validation.

```typescript
// Input (Zod-validated)
{
  sql: string;    // SELECT statement
  title?: string; // Optional label for citation
}

// Validation (server-side, before execution)
// 1. Single statement (no semicolons except trailing)
// 2. Must start with SELECT (case-insensitive, after trimming)
// 3. Blocklist: INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, CREATE,
//    GRANT, REVOKE, COPY, EXECUTE, CALL
// 4. Table blocklist: auth.*, pg_*, information_schema.*, supabase_*
// 5. No SET, LOCK, LISTEN, NOTIFY, VACUUM, ANALYZE commands
// 6. Appended: LIMIT 200 (if no LIMIT clause present)

// Execution
// - Via user's RLS-scoped Supabase client (supabase.rpc)
// - Statement timeout: 5 seconds
// - Read-only transaction

// Output
{
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  truncated: boolean;  // true if hit 200-row limit
}
```

### `render_chart`

Presentation tool — captures chart config for the client.

```typescript
// Input
{
  type: 'bar' | 'line' | 'area' | 'pie';
  title: string;
  data: Array<{ label: string; value: number; series?: string }>;
  xLabel?: string;
  yLabel?: string;
}

// Output (returned to model)
{ rendered: true, widgetId: string }
// Side effect: chart widget added to response accumulator
```

### `render_table`

Presentation tool — captures table config for the client.

```typescript
// Input
{
  title: string;
  columns: Array<{ key: string; label: string }>;
  rows: Array<Record<string, unknown>>;
}

// Output (returned to model)
{ rendered: true, widgetId: string }
// Side effect: table widget added to response accumulator
```

## Modified Response Protocol

### SSE payload

```typescript
// Before (Phase 5)
data: { text: string }

// After (Phase 11)
data: { text: string; widgets?: Widget[] }
```

### Widget types

```typescript
type Widget =
  | ChartWidget
  | TableWidget
  | CitationWidget;

interface ChartWidget {
  id: string;
  type: 'chart';
  chartType: 'bar' | 'line' | 'area' | 'pie';
  title: string;
  data: Array<{ label: string; value: number; series?: string }>;
  xLabel?: string;
  yLabel?: string;
}

interface TableWidget {
  id: string;
  type: 'table';
  title: string;
  columns: Array<{ key: string; label: string }>;
  rows: Array<Record<string, unknown>>;
}

interface CitationWidget {
  id: string;
  type: 'citation';
  query: string;
  rowCount: number;
  title?: string;
}
```

## Components

### ChatWidget (`chat-widget.tsx`)
Switch on `widget.type` → delegates to chart, table, or citation component.

### ChatChart (`chat-chart.tsx`)
Recharts wrapper. Renders `ResponsiveContainer` → `BarChart` / `LineChart` /
`AreaChart` / `PieChart` based on `chartType`. Reuses color palette and
styling from `dashboard-charts.tsx`. Height: 200px. Width: 100% of bubble.

Multi-series support: when `series` field present in data, groups by series
name and renders multiple bars/lines with a legend.

### ChatTable (`chat-table.tsx`)
Styled table with horizontal scroll. Max 10 visible rows with "mostrar
más" expansion. Column headers from `columns[].label`.

### ChatCitation (`chat-citation.tsx`)
Collapsible pill showing "Datos de: {title} ({rowCount} filas)". Expanded
state shows the SQL query in a code block.

### ChatMessage (modified)
After the markdown text block, renders `widgets.map(w => <ChatWidget />)`
with vertical spacing.

## File Structure

```
src/features/ai-chat/
├── components/
│   ├── chat-panel.tsx          # (unchanged)
│   ├── chat-message.tsx        # MODIFIED — renders widgets after text
│   ├── chat-chart.tsx          # NEW — recharts inline chart
│   ├── chat-table.tsx          # NEW — data table
│   ├── chat-citation.tsx       # NEW — SQL source citation
│   ├── chat-widget.tsx         # NEW — widget type dispatcher
│   ├── markdown.tsx            # (unchanged)
│   └── morning-summary.tsx     # (unchanged)
├── hooks/
│   └── use-chat.ts             # MODIFIED — parse widgets from SSE
├── types.ts                    # NEW — Widget type definitions
└── lib/
    ├── tools/
    │   ├── sql-query.ts        # NEW — validate + execute SQL
    │   ├── sql-validator.ts    # NEW — SQL safety validation
    │   ├── presentation.ts     # NEW — render_chart, render_table
    │   ├── definitions.ts      # MODIFIED — 3 new declarations
    │   └── index.ts            # MODIFIED — 3 new dispatch cases
    └── prompts/
        ├── schema.ts           # MODIFIED — analytical instructions
        ├── vendedor.ts         # MODIFIED — visualization guidelines
        ├── direccion.ts        # MODIFIED — visualization guidelines
        └── admin.ts            # MODIFIED — visualization guidelines
```

## Security

| Layer | Mechanism |
|-------|-----------|
| SQL validation | SELECT-only, keyword blocklist, table blocklist |
| Row limit | 200 rows max (appended if missing) |
| Timeout | 5-second statement timeout |
| RLS | Executed via user's authenticated Supabase session |
| Role gates | RLS is primary; dispatcher adds defense-in-depth |
| XSS prevention | Widget data sanitized (no raw HTML in labels) |
| Zod validation | All tool inputs validated before execution |

## Tool-call budget

`MAX_TURNS` was raised from **5 → 8** in Phase 11 (`src/features/ai-chat/lib/tools/helpers.ts`). The previous budget assumed read-only flows (1 search + 1 follow-up + final text). Phase 11 prompts explicitly chain `get_kpis_* → query_database → render_chart → render_table → text` plus 1–3 SQL retries — that pattern needs ≥ 6 turns to land. 8 leaves headroom while staying conservative; HubSpot Breeze and Salesforce Agentforce use comparable budgets.

If the loop still exhausts the budget, `route.ts` fires one **closing call without `tools`** (`runClosingCall` in `src/features/ai-chat/lib/turn.ts`) so the model is forced to summarise what it gathered. Telemetry: `event: 'turn_budget_exhausted'` then `event: 'closing_call_used'`. The "límite de análisis" string only ships when even the closing call returns nothing.

## Acceptance Criteria

1. Vendedor: "muéstrame mis deals por fase" → bar chart appears in chat
2. Dirección: "compara ventas por vendedor este trimestre" → chart + table
3. Admin: "muéstrame actividades por tipo esta semana" → pie chart
4. Any role: SQL with INSERT/DROP → clean error message (not executed)
5. Vendedor SQL querying deals → only sees own deals (RLS filters)
6. Citation shows the SQL query used and row count
7. Charts render correctly within the 420px chat panel width
8. Tables scroll horizontally if wider than the panel
9. Existing 12 CRUD tools continue to work unchanged
10. `npx tsc --noEmit` passes with no errors
