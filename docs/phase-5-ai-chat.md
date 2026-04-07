# Phase 5: AI Chat Assistant [IMPLEMENTED]

## Overview

Role-aware AI assistant for the CRM. Uses Google Gemini 3.1 Flash Lite with **function calling** so the model can query the database directly (RLS-scoped) instead of relying on a fixed pre-fetched context blob. Three personas: sales coach (vendedor), performance coach (dirección), operations analyst (admin).

Features:

1. **Chat Panel** — Slide-out conversational assistant accessible from any page. Markdown-rendered output. Reachable via floating button, keyboard shortcut, or as the Cmd+K palette empty-state fallback.
2. **Morning Summary** — Auto-generated daily briefing on the cockpit page, role-aware (vendedor sees personal pipeline, dirección/admin see team-level metrics).

## Tech Stack

- **Model**: `gemini-3.1-flash-lite-preview` via `@google/genai` SDK
- **Function calling**: `ai.models.generateContent({ tools: [{ functionDeclarations }] })` with a server-side dispatcher loop (max 5 turns per user message)
- **Markdown rendering**: `react-markdown` + `remark-gfm` for the chat bubbles
- **Auth**: `requireApiAuth()` plus role gates at the dispatcher level for direccion/admin-only tools
- **RLS as source of truth**: tools call Supabase with the user's authenticated session — a vendedor cannot exfiltrate other vendedores' data even if the model tries

## API Routes

### POST /api/chat

Tool-using chat endpoint. Wraps the final answer in the existing SSE envelope so the UI contract is unchanged.

**Request body** (Zod-validated):
```typescript
{
  message: string;           // Current user message
  history: Array<{           // Previous messages (max 20)
    role: 'user' | 'model';
    text: string;
  }>;
}
```

**Response**: SSE stream (`text/event-stream`) containing one chunk:
- `data: {"text": "<final answer>"}\n\n`
- `data: [DONE]\n\n`

**Tool-call loop** (server-side, up to `MAX_TURNS = 5` per user message):

1. Build `RoleContext` (`buildRoleContext(user)`) and the role-specific system prompt (`buildRolePrompt(ctx)`).
2. Call `generateContent` with the running `contents` history + `tools` config.
3. If the response has `functionCalls` → execute them in parallel through `dispatch(name, args)`, append the model's call parts and our response parts to `contents`, repeat.
4. Otherwise → take `res.text` as the final answer and exit the loop.
5. If the loop exhausts `MAX_TURNS` without producing text, return a graceful "límite de análisis" message.

### GET /api/chat/summary

Daily morning briefing. **Role-aware** — fixes the bug where dirección users were seeing `"tú gestionas 8 negocios"` derived from team-wide totals.

Strategy: skip the full tool-call loop (we know exactly which KPIs we need). Run the role-appropriate KPI fetch directly (`getKpisVendedor` or `getKpisDireccion`), inject the real numbers into a tight prompt, single `generateContent` call. Cached per `(user, fecha)` in `briefings_diarios`.

**Response**:
```typescript
{
  summary: string;       // Markdown-formatted briefing
  generated_at: string;
  cached: boolean;
}
```

## Components

### ChatPanel (`src/features/ai-chat/components/chat-panel.tsx`)
- Sheet (slide-out from right) triggered by floating button, keyboard shortcut, or Cmd+K fallback.
- Accepts an `initialMessage` prop — when set, it's auto-sent as the first user message (used by Cmd+K to forward unmatched queries to the AI).
- Message list with user/assistant bubbles. Assistant bubbles render markdown via `<ChatMarkdown>`.
- Max 20 messages in history (older messages trimmed).

### ChatMarkdown (`src/features/ai-chat/components/markdown.tsx`)
- Thin wrapper around `react-markdown` + `remark-gfm` with Tailwind-styled element overrides for the chat surface (headers, bullets, tables, inline code, blockquotes).
- Used only for assistant messages — user input stays plain `whitespace-pre-wrap`.

### MorningSummary (`src/features/ai-chat/components/morning-summary.tsx`)
- Card on the cockpit page with the AI-generated brief.
- Loading skeleton while generating, refresh button to regenerate.

### Command palette integration (`src/features/command-palette/components/command-palette.tsx`)
- The empty-state ("Sin resultados") is replaced with a "Preguntar a la IA: '<query>'" item.
- Selecting it closes the palette and opens the chat panel with the query as the seed `initialMessage`.

## File Structure

```
src/features/ai-chat/
├── components/
│   ├── chat-panel.tsx          # Slide-out chat UI (accepts initialMessage seed)
│   ├── chat-button.tsx         # Floating trigger button (legacy, currently unused)
│   ├── chat-message.tsx        # Bubble — assistant variant uses ChatMarkdown
│   ├── markdown.tsx            # Tailwind-styled react-markdown wrapper
│   └── morning-summary.tsx     # Cockpit briefing card
├── hooks/
│   └── use-chat.ts             # Chat state management + SSE consumption
└── lib/
    ├── gemini.ts               # Client singleton + re-exports (≈40 lines)
    ├── context/
    │   ├── index.ts            # buildRoleContext dispatcher → discriminated union
    │   ├── base.ts             # Shared: userId, userName, today, roleLabel
    │   ├── vendedor.ts         # VendedorContext
    │   ├── direccion.ts        # DireccionContext (+ teamSize)
    │   └── admin.ts            # AdminContext (+ teamSize, pipelinesCount, scriptsCount)
    ├── prompts/
    │   ├── index.ts            # buildRolePrompt dispatcher
    │   ├── schema.ts           # DB_SCHEMA_SUMMARY embedded in every role prompt
    │   ├── vendedor.ts         # Sales-coach prompt (SPIN/MEDDIC/BANT/closing)
    │   ├── direccion.ts        # Performance-coach prompt (pipeline velocity, GROW)
    │   └── admin.ts            # Operations-analyst prompt (data quality, config tuning)
    └── tools/
        ├── index.ts            # registerTools(user, supabase) → { declarations, dispatch }
        ├── definitions.ts      # FunctionDeclaration[] for Gemini's tools config
        ├── helpers.ts          # buildFuzzyOr, clampLimit, parseRelativeDate, constants
        ├── empresas.ts         # search_empresas + get_empresa
        ├── deals.ts            # search_deals + get_deal
        ├── contactos.ts        # search_contactos
        ├── tareas.ts           # search_tareas
        ├── scripts.ts          # search_scripts + get_script
        ├── actividades.ts      # get_actividades
        ├── kpis.ts             # get_kpis_vendedor + get_kpis_direccion
        └── pipelines.ts        # get_pipelines_fases
```

## Tools available to the AI

All tools take Zod-validated input, execute against the user's RLS-scoped Supabase client, and return JSON-serialisable results. Errors are returned as `{ error: string }` envelopes (never thrown) so the model can read and react to them.

| Tool | Purpose |
|------|---------|
| `search_empresas` | Fuzzy search empresas by name + filter by lifecycle stage, vendedor, prioridad. |
| `get_empresa` | Full empresa detail + open deals + recent activities + contactos. |
| `search_deals` | Filter deals by query, fase, resultado, vendedor, valor mínimo, días estancado. |
| `get_deal` | Full deal detail + empresa + last 10 activities. |
| `search_contactos` | Fuzzy search by `nombre_completo` and `email`, optional `empresa_id`. |
| `search_tareas` | Filter tareas by query, completada, vencidas_only, prioridad, vendedor, empresa, deal. |
| `search_scripts` | Fuzzy search scripts by title and tags; returns metadata + 500-char excerpt. |
| `get_script` | Full script content (capped at 5000 chars). |
| `get_actividades` | Activity log filtered by empresa, deal, tipo, since-date. |
| `get_kpis_vendedor` | Personal KPIs (pipeline, tasks, today's activities, won this month, commission). |
| `get_kpis_direccion` | Team-wide KPIs + per-vendedor breakdown. **Direccion/admin only** (dispatcher gates this). |
| `get_pipelines_fases` | Pipelines and their phases — used to map a phase name mentioned by the user to an ID. |

## System prompt architecture

There is no longer a single template. `buildRolePrompt(ctx)` dispatches on `ctx.kind` and returns one of three Spanish prompts. Each follows the same four-section shape but with different framing and methodologies:

- **Vendedor (sales coach)** — SPIN, MEDDIC, BANT, value-based selling, Feel-Felt-Found objection handling, closing techniques, follow-up cadence (8 contacts in 21 days), champion building.
- **Dirección (performance coach)** — Pipeline velocity, conversion funnel analysis, deal inspection (stuck/single-threaded), forecasting (commit/best/upside), performance quadrants, GROW/STAR/CARE 1:1 frameworks.
- **Admin (operations analyst)** — Data quality audits, process analytics, team structure optimization, config tuning, adoption metrics.

Every role prompt embeds the shared `DB_SCHEMA_SUMMARY` (`src/features/ai-chat/lib/prompts/schema.ts`) so the model knows what tables exist, which columns matter, and which tool to call for each question. Every prompt enforces: "Antes de responder con cualquier dato concreto, LLAMA A UNA HERRAMIENTA. Nunca inventes."

## Security

- **API key**: `GEMINI_API_KEY` server-side only.
- **RLS as the source of truth**: tools call Supabase with the user's authenticated session, so a vendedor querying `search_deals` only ever sees their own deals — no model trickery can bypass that.
- **Dispatcher-level role gate**: `get_kpis_direccion` returns `{ error: 'forbidden: ...' }` for `user.rol === 'vendedor'` BEFORE the underlying query runs. The model sees a clean error and responds gracefully ("ese dato es solo para dirección/admin").
- **Hard caps**: `MAX_LIMIT = 20`, `MAX_TURNS = 5`, `MAX_SCRIPT_CONTENT = 5000`.
- **Zod validation** on every tool input — no SQL injection via parameters.
- **Fixed tool list**: registered once at request start; the model cannot invoke arbitrary functions.
- **Rate limiting**: max 20 messages per conversation history (older trimmed).
