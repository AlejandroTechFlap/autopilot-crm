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

**Tool-call loop** (server-side, up to `MAX_TURNS = 8` per user message — raised from 5 in Phase 11 to fit `kpis → query_database → render_chart → render_table → text` analytics flows with margin for SQL retries):

1. Build `RoleContext` (`buildRoleContext(user)`) and the role-specific system prompt (`buildRolePrompt(ctx)`).
2. Call `generateContent` with the running `contents` history + `tools` config.
3. Capture `res.text` if present (Gemini can emit text alongside function calls in the same turn — preserve it so we don't lose partial answers when the budget exhausts).
4. If the response has `functionCalls` → execute them in parallel through `dispatch(name, args)`, append the model's call parts and our response parts to `contents`, repeat.
5. Otherwise → take `res.text` as the final answer and exit the loop.
6. **Closing-call fallback** — if the loop exhausts `MAX_TURNS` without producing a final text turn, fire one extra `generateContent` call **without `tools`** (via `runClosingCall`) so the model is forced to summarise whatever it gathered. Logged as `event: 'closing_call_used'`. Only if that also returns nothing do we emit the "límite de análisis" message as a last resort.

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
- **Loading skeleton (2026-04-16)**: while `isStreaming` and the last message is the user's (or an empty assistant placeholder), renders a bot-avatar + text-shaped shimmer bubble using the shared `Skeleton` primitive. Shape mimics a real Gemini response: a short heading line, a 4-line paragraph block with varied widths, a 3-line paragraph block, and a short closing line — so the loading state matches what will replace it. `role="status" aria-label="El asistente está pensando"` for screen readers.
- **Typewriter reveal (2026-04-16)**: once the full SSE payload arrives, `use-chat.ts` animates the text character-by-character via `typewriterReveal` (~1600 chars/sec, 16 chars per 10ms tick) — ChatGPT-style progressive rendering. Widgets attach only after the text is fully revealed so charts/tables don't pop in mid-sentence. The reveal is abort-aware: clicking Limpiar snaps it to the end and exits. Trade-off: tool-loop architecture can't stream mid-loop (we need the full `functionCalls` list to decide whether to loop or to finish), so the perceived "typing" is client-side — total latency unchanged. Real token streaming via `generateContentStream` is a follow-up.
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
- **Hard caps**: `MAX_LIMIT = 20`, `MAX_TURNS = 8`, `MAX_SCRIPT_CONTENT = 5000`.
- **Zod validation** on every tool input — no SQL injection via parameters.
- **Fixed tool list**: registered once at request start; the model cannot invoke arbitrary functions.
- **Rate limiting**: max 20 messages per conversation history (older trimmed).

## Quick-win upgrades (2026-04-16)

Four HubSpot Breeze / Salesforce Agentforce-inspired upgrades shipped together. All are additive — no existing contract changed.

### 1. `thought_signature` preservation (bug fix)

Previously `src/app/api/chat/route.ts` reconstructed the model turn manually from `res.functionCalls`, which strips the Part wrapper and loses the `thought_signature` Gemini attaches when it reasons before calling a tool. On turn 2 the API rejected the history with `INVALID_ARGUMENT — Function call is missing a thought_signature`.

Fix: push `res.candidates?.[0]?.content` verbatim through the new `extractModelTurn` helper (`src/features/ai-chat/lib/turn.ts`). If the candidate is absent, the helper falls back to the old reconstruction and the route logs a warning.

### 2. Per-role declaration scoping (D3)

`src/features/ai-chat/lib/tools/role-scope.ts#filterToolsForRole` hides `get_kpis_direccion` from the vendedor's declaration list so the model never sees a tool it is not allowed to call. Defense in depth — the dispatcher guard and RLS are still authoritative.

### 3. Inline citations (D1)

Every row returned by `search_empresas`, `search_deals`, `search_contactos`, `search_tareas`, `get_actividades`, `get_empresa`, and `get_deal` now carries a `cite: { kind, id, href, label }` field. Only empresas have a dedicated detail page today, so deals/contactos/tareas/actividades cite their parent empresa (`/empresa/<empresa_id>`). Rows with no empresa fall back to `/empresas`.

Each role prompt now instructs the model to cite sources inline with markdown links, substituting the actual value of the row's `cite.href` as the URL (e.g. `[VetPartners](/empresa/abc-123)`). The prompt spells out an example and explicitly forbids writing the literal string `cite.href` — an earlier wording caused the model to emit `[label](cite.href)` verbatim, producing a 404 on click. `ChatMarkdown` routes internal hrefs (`/…`) through Next.js `<Link>` for client-side nav — the chat panel stays mounted, only the dashboard content swaps. External URLs (http/https) still open in a new tab via `<a target="_blank">`.

### 4. Suggested prompts per role (D2)

The empty state in `ChatPanel` previously rendered one static prompt. It now loads 3 role-specific chips from `src/features/ai-chat/lib/suggested-prompts.ts`:

- **Vendedor** — priorizar leads, próxima acción, resumen de hoy
- **Dirección** — KPIs del equipo, deals estancados, top vendedor
- **Admin** — salud global, consulta SQL, gráfico de fases

Clicking a chip sends the prompt through the normal `sendMessage` path.

### 5. Confirmation-before-write scaffolding (D4)

`src/features/ai-chat/lib/tools/write-tool.ts` defines `pendingConfirmation()` and `isPendingConfirmation()`. All 15 tools today are read-only; the scaffolding exists so future write tools (e.g. `create_tarea`, `update_deal`) inherit a `{ confirmation_required: true, summary, input }` envelope that the client UI will render as a confirm/cancel modal.
