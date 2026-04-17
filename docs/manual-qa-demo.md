# Manual QA — Demo Readiness Checklist (Rebeca 2026-04-17)

> Audience: Alejandro running the app in a browser before the demo. No DevTools, no curl.
> Click, observe, check. Mark `[x]` as you go. Every test lists steps and the expected result.
> If anything fails, **STOP** and flag it before shipping more changes.

Seeded accounts (`supabase/seed/users.ts`):

| Role | Email | Password | Lands on |
|------|-------|----------|----------|
| Admin | `admin@autopilotcrm.com` | `Admin123!` | `/admin` |
| Dirección | `rebeca@autopilotcrm.com` | `Rebeca123!` | `/dashboard` |
| Vendedor A | `ignacio@autopilotcrm.com` | `Ignacio123!` | `/pipeline` |
| Vendedor B | `laura@autopilotcrm.com` | `Laura123!` | `/pipeline` |

Environment: `http://localhost:3000` (dev) and/or `https://crm.dev.flapconsulting.com` (VPS).

---

## 0. Pre-flight

- [ ] **0.1** `npm run dev` running; no terminal errors.
- [ ] **0.2** `npx tsc --noEmit` clean.
- [ ] **0.3** `npm run lint` clean.
- [ ] **0.4** `npm test` — 269+ tests green.
- [ ] **0.5** `pgrep -af "next dev"` returns exactly one process (no orphans).
- [ ] **0.6** Browser DevTools Network tab: no 404s on first page load.
- [ ] **0.7** Console: zero red errors on first page load.

---

## 1. Cross-cutting — works in any role

### 1.1 Login / redirects

- [ ] **1.1.1** Visit `/` while logged out → redirected to `/login`.
- [ ] **1.1.2** Login screen is Spanish (no English).
- [ ] **1.1.3** Submit empty form → Spanish error message, no crash.
- [ ] **1.1.4** Submit wrong password → Spanish error, no leak of valid emails.
- [ ] **1.1.5** Visit `/admin` while logged out → redirect to `/login`.
- [ ] **1.1.6** Visit `/pipeline` while logged out → redirect to `/login`.

### 1.2 Navigation / shared layout

- [ ] **1.2.1** Sidebar shows the right entries per role (see §2, §3, §4).
- [ ] **1.2.2** Clicking the user avatar (bottom-left) opens **Cerrar sesión**.
- [ ] **1.2.3** Logout → redirect to `/login`. Back button does NOT restore session.
- [ ] **1.2.4** Refresh any dashboard page → stays on the same page, no flash of login.

### 1.3 Loading states (Rule 11)

- [ ] **1.3.1** Navigate `/pipeline` from another route → kanban-shaped skeleton (not a spinner, not blank).
- [ ] **1.3.2** Navigate `/dashboard` → KPI-shaped skeleton.
- [ ] **1.3.3** Navigate `/empresas` → table skeleton.
- [ ] **1.3.4** Navigate `/contactos` → table skeleton.
- [ ] **1.3.5** Navigate `/mis-tareas` → table skeleton.
- [ ] **1.3.6** Click any empresa row → detail skeleton (header + 2-col grid).
- [ ] **1.3.7** Admin: navigate into any `/admin/*` → card-grid skeleton.
- [ ] **1.3.8** No skeleton says "Loading…" in English anywhere.
- [ ] **1.3.9** Network throttle to Slow 3G → skeletons stay visible; no layout shift when real content swaps in.

### 1.4 Error / not-found

- [ ] **1.4.1** Visit `/empresa/00000000-0000-0000-0000-000000000000` → friendly 404 in Spanish (not a Next.js dev overlay).
- [ ] **1.4.2** Visit a non-existent route like `/foo` → 404.
- [ ] **1.4.3** Force an error (e.g. stop Supabase, navigate) → friendly error page with **Reintentar**.

### 1.5 i18n

- [ ] **1.5.1** Pick 5 random pages → every visible string is Spanish.
- [ ] **1.5.2** Date formats are DD/MM/YYYY or "16 abr 2026", not "4/16/2026".
- [ ] **1.5.3** Currency formats are `258.000 €`, not `$258,000`.
- [ ] **1.5.4** Buttons say "Guardar", "Cancelar", "Nuevo"... never "Save" / "Cancel" / "New".

### 1.6 Responsive (quick pass)

- [ ] **1.6.1** Resize to ~900px wide → sidebar collapses gracefully; content readable.
- [ ] **1.6.2** Resize to ~600px → no horizontal scrollbar on main content.
- [ ] **1.6.3** Chat panel at ~900px → still usable (≥420px panel) or collapses per spec.

---

## 2. Vendedor — Ignacio (most critical for demo)

Login: `ignacio@autopilotcrm.com` / `Ignacio123!` → lands on `/pipeline`.

### 2.1 Pipeline (kanban)

- [ ] **2.1.1** Page shows 5 deals across columns.
- [ ] **2.1.2** All deals belong to Ignacio (no cards from Laura visible).
- [ ] **2.1.3** Drag a deal to another column → persists on refresh.
- [ ] **2.1.4** Click a deal card → opens company detail or deal panel.
- [ ] **2.1.5** **No "Nuevo lead" button** in sidebar / header (vendedores cannot create leads).
- [ ] **2.1.6** Cmd+K palette works (§6).
- [ ] **2.1.7** AI panel button (bot icon) visible and opens the chat (§5).

### 2.2 Mis tareas

- [ ] **2.2.1** Default tab is **Calendario** (not Lista).
- [ ] **2.2.2** **Briefing de la mañana** card renders (AI-generated, Spanish, mentions Ignacio by name).
- [ ] **2.2.3** Briefing lists 5 deals, 6 pending tasks, 2 overdue (seed expected).
- [ ] **2.2.4** KPI cards show: Oportunidades 5 · Valor 258.000 € · Tareas pendientes 6 · Vencidas 6 · Actividades hoy 0 · Ganados 1 · Comisión 7.500 €. (Values per `docs/seed.md` §Ignacio.)
- [ ] **2.2.5** Switch to **Lista** → shows all tasks with due dates.
- [ ] **2.2.6** Overdue tasks have the red danger icon.
- [ ] **2.2.7** Click calendar day with a task → tasks for that day visible.
- [ ] **2.2.8** Create new task via **+ Nueva tarea** → appears in both Lista and Calendario.
- [ ] **2.2.9** Mark a task complete → disappears from pending; count updates.
- [ ] **2.2.10** Scripts panel at bottom expands/collapses.

### 2.3 Empresas (BBDD)

- [ ] **2.3.1** List shows only empresas assigned to Ignacio (RLS).
- [ ] **2.3.2** Search box filters in real time.
- [ ] **2.3.3** No visible option to create a new empresa (vendedor cannot).
- [ ] **2.3.4** Click an empresa → detail page loads.

### 2.4 Empresa detail (e.g. `VetPartners`)

- [ ] **2.4.1** Header shows company name + status.
- [ ] **2.4.2** Actividades tab shows past interactions (timestamps, types).
- [ ] **2.4.3** Tareas tab shows linked tasks, correct due-date colors.
- [ ] **2.4.4** Contactos tab lists linked contacts (can add/edit).
- [ ] **2.4.5** Deals section shows 1+ deal with amount.
- [ ] **2.4.6** Custom fields render with the correct widget (text, number, date, select).
- [ ] **2.4.7** Add a nota → appears at top of Actividades.
- [ ] **2.4.8** Edit the fase → saves, kanban reflects it.

### 2.5 Contactos

- [ ] **2.5.1** List shows contacts linked to Ignacio's empresas only.
- [ ] **2.5.2** Click a contact → opens (or edit modal).
- [ ] **2.5.3** Search by name works.

### 2.6 Role gating (negative tests)

- [ ] **2.6.1** Manually visit `/admin` → redirected away or 403 friendly page.
- [ ] **2.6.2** Manually visit `/dashboard` → redirected away or not visible in sidebar.
- [ ] **2.6.3** Manually visit `/admin/pipelines` → blocked.
- [ ] **2.6.4** Manually visit `/empresa/<id-owned-by-Laura>` → 404 or access denied (RLS).
- [ ] **2.6.5** DevTools Network: hit any `/api/admin/*` endpoint → 401/403.

---

## 3. Dirección — Rebeca

Login: `rebeca@autopilotcrm.com` / `Rebeca123!` → lands on `/dashboard`.

### 3.1 Dashboard

- [ ] **3.1.1** Page shows team-wide KPIs (aggregate of Ignacio + Laura).
- [ ] **3.1.2** Briefing de la mañana uses the `direccion` prompt tone (performance/management, not sales coach).
- [ ] **3.1.3** Drill-down: click "Oportunidades abiertas" → list of all open deals across team.
- [ ] **3.1.4** Drill-down: "Top vendedores" → ranking widget.
- [ ] **3.1.5** Drill-down: "Deals estancados" → list with age in days.
- [ ] **3.1.6** Filters (vendedor, fase, fecha) work and combine.

### 3.2 Pipeline (all deals)

- [ ] **3.2.1** Kanban shows deals from Ignacio **and** Laura.
- [ ] **3.2.2** Owner avatar/label visible on each card.
- [ ] **3.2.3** Filter by vendedor narrows the view.
- [ ] **3.2.4** Drag a deal owned by Ignacio → saves (dirección can edit cross-team).

### 3.3 Empresas

- [ ] **3.3.1** List shows all empresas (not filtered by owner).
- [ ] **3.3.2** **+ Nuevo lead** / **Crear empresa** visible (dirección CAN create leads).
- [ ] **3.3.3** Create a lead → can assign to Ignacio or Laura from the owner dropdown.
- [ ] **3.3.4** Created lead appears in the kanban of the assignee.

### 3.4 Mis tareas (dirección's own view)

- [ ] **3.4.1** Shows only Rebeca's tasks (if any seeded) — not team-wide.
- [ ] **3.4.2** KPI tiles match direccion role (team metrics, not personal).

### 3.5 Role gating

- [ ] **3.5.1** `/admin` is NOT in the sidebar.
- [ ] **3.5.2** Manual visit to `/admin` → blocked.
- [ ] **3.5.3** Manual hit `/api/admin/usuarios` → 403.

---

## 4. Admin

Login: `admin@autopilotcrm.com` / `Admin123!` → lands on `/admin`.

### 4.1 Admin overview

- [ ] **4.1.1** `/admin` shows 5 tiles: Pipelines, Scripts, Usuarios, Notificaciones, KPIs.
- [ ] **4.1.2** Tenant branding (logo/name) reflects the seed tenant.

### 4.2 Admin/Pipelines

- [ ] **4.2.1** List of pipelines with phases.
- [ ] **4.2.2** Create pipeline → saves; reload shows it.
- [ ] **4.2.3** Add phase → reorder via drag → order persists.
- [ ] **4.2.4** Delete a phase with deals → blocked with a Spanish error ("no se puede eliminar…").
- [ ] **4.2.5** Rename pipeline → vendedor pipeline sidebar reflects change on next refresh.

### 4.3 Admin/Scripts

- [ ] **4.3.1** List of 3+ scripts (Bienvenida, Onboarding, Postventa per seed).
- [ ] **4.3.2** Create script → markdown editor saves.
- [ ] **4.3.3** Delete script used in a deal → blocked or warning.

### 4.4 Admin/Usuarios

- [ ] **4.4.1** List of 4 seeded users (admin + direccion + 2 vendedores).
- [ ] **4.4.2** Invite user → email sent (or invite link generated).
- [ ] **4.4.3** Change role → persists; user sees new sidebar on next login.
- [ ] **4.4.4** Cannot demote the last admin (safeguard).

### 4.5 Admin/Notificaciones

- [ ] **4.5.1** List of notification rules.
- [ ] **4.5.2** Create rule ("deal parado 7 días") → fires against seed data (manual trigger or wait).
- [ ] **4.5.3** Bell icon in header shows unread count for the current user.

### 4.6 Admin/KPIs

- [ ] **4.6.1** KPI thresholds editor loads current values.
- [ ] **4.6.2** Edit a threshold → saves → reflected in cockpit KPI color coding.

### 4.7 Tenant / feature flags (Phase 10)

- [ ] **4.7.1** Toggle `feat_ai_chat` OFF → AI panel button hidden across all roles.
- [ ] **4.7.2** Toggle back ON → AI panel reappears.
- [ ] **4.7.3** Custom field CRUD — add a field to empresa → visible on detail page for all roles.

### 4.8 Admin can do everything above-tier

- [ ] **4.8.1** `/dashboard` works (dirección powers).
- [ ] **4.8.2** `/pipeline` shows all deals.
- [ ] **4.8.3** Can open any empresa detail.

---

## 5. AI Chat — per-role (critical)

Open the AI panel on any dashboard page (bot icon bottom-right, or Cmd+K → "Preguntar a la IA").

### 5.1 UI mechanics

- [ ] **5.1.1** Panel opens as a right-side aside (~420–460px).
- [ ] **5.1.2** Empty state shows **3 suggested prompts** specific to the current role (vendedor/direccion/admin).
- [ ] **5.1.3** Click a suggested chip → it's sent as the first user message.
- [ ] **5.1.4** Type + Enter sends. Shift+Enter adds a newline.
- [ ] **5.1.5** **Skeleton de texto** appears immediately after sending (heading line + 2 paragraphs + closing short line). Bot avatar pulses next to it.
- [ ] **5.1.6** Once response arrives → **typewriter reveal** fills the bubble at ~1600 chars/sec (ChatGPT-style).
- [ ] **5.1.7** During reveal, send button is disabled.
- [ ] **5.1.8** Widgets (charts/tables) appear only AFTER text finishes typing.
- [ ] **5.1.9** **Limpiar** clears history AND cancels any in-progress stream/reveal.
- [ ] **5.1.10** Close panel → reopen → conversation is gone (per-session memory only).

### 5.2 Links (regression — 2026-04-16 fix)

- [ ] **5.2.1** Ask: `¿A qué lead le debo dar prioridad?` → response contains at least one `[VetPartners](/empresa/...)` link.
- [ ] **5.2.2** Links never contain the literal string `cite.href` (bug regression test).
- [ ] **5.2.3** Click an internal link → navigates in the SAME tab; chat panel STAYS open with conversation intact.
- [ ] **5.2.4** External `https://` link (if any) → opens in new tab.

### 5.3 Multi-turn loop (thought_signature — 2026-04-17 fix)

- [ ] **5.3.1** Send prompt #1: `A qué lead le debería dar prioridad y por qué?`.
- [ ] **5.3.2** Response arrives with a citation.
- [ ] **5.3.3** Send prompt #2 in same conversation: `¿Y qué acción recomiendas para ese lead?`.
- [ ] **5.3.4** Response arrives WITHOUT `INVALID_ARGUMENT — Function call is missing a thought_signature` error.
- [ ] **5.3.5** Send prompt #3 that forces another tool call (e.g. `Dame los KPIs`).
- [ ] **5.3.6** Still works through turn 3.

### 5.4 Role-specific behaviors

| Test | Vendedor (Ignacio) | Dirección (Rebeca) | Admin |
|------|---|---|---|
| **5.4.1** System-prompt tone | coach / tactical | executive / performance | operational |
| **5.4.2** `search_empresas` returns | only own | all | all |
| **5.4.3** `get_kpis_vendedor` with own user_id | ✅ | ✅ | ✅ |
| **5.4.4** `get_kpis_direccion` call | ❌ hidden from declarations + blocked at dispatcher | ✅ | ✅ |
| **5.4.5** `query_database` (SQL) | returns only visible rows (RLS) | team-wide | tenant-wide |
| **5.4.6** `render_chart` widget | renders | renders | renders |
| **5.4.7** `render_table` widget | renders | renders | renders |
| **5.4.8** Morning briefing tone | Ignacio, salescoach | Rebeca, performance | admin, ops |

### 5.5 Vendedor-specific AI tests (Ignacio)

- [ ] **5.5.1** Prompt: `¿Cuántas oportunidades tengo abiertas?` → answers `5` with citation(s).
- [ ] **5.5.2** Prompt: `Dame los KPIs de dirección` → model politely declines / doesn't expose team data.
- [ ] **5.5.3** Prompt: `¿Qué empresa tiene Laura asignada?` → RLS blocks; model says it doesn't see Laura's data.
- [ ] **5.5.4** Prompt: `Resumen de mi pipeline hoy` → response mentions 5 deals / 258.000 €.

### 5.6 Dirección-specific AI tests (Rebeca)

- [ ] **5.6.1** Prompt: `¿Qué vendedor tiene más oportunidades?` → names Ignacio or Laura based on seed.
- [ ] **5.6.2** Prompt: `KPIs del equipo esta semana` → renders chart or table widget.
- [ ] **5.6.3** Prompt: `Deals estancados` → lists 1+ stalled deals with age in days.

### 5.7 Admin-specific AI tests

- [ ] **5.7.1** Prompt: `Salud global del pipeline` → aggregated view across all vendedores.
- [ ] **5.7.2** Prompt: `Dame una consulta SQL: SELECT count(*) FROM empresas` → SQL query runs; result rendered as table.
- [ ] **5.7.3** Prompt: `Gráfico de deals por fase` → renders a bar/pie chart widget.

### 5.8 Edge cases

- [ ] **5.8.1** Send empty message → button stays disabled; no request fires.
- [ ] **5.8.2** Send 4000+ char message → Zod rejects with Spanish error.
- [ ] **5.8.3** Rapid-fire 21 messages in 60s → rate limit kicks in, friendly Spanish error.
- [ ] **5.8.4** Close panel mid-reveal → no console error, no dangling timer.
- [ ] **5.8.5** Logout mid-stream → redirects clean; no stale state on re-login.
- [ ] **5.8.6** Toggle `feat_ai_chat` OFF mid-conversation → next send returns feature-flag error.
- [ ] **5.8.7** Offline (disable network in DevTools) → send → friendly "Connection error. Please try again."
- [ ] **5.8.8** Send a prompt that generates 2000+ char response → typewriter handles gracefully, no lag.
- [ ] **5.8.9** SQL injection-style prompt: `'; DROP TABLE empresas;--` → validator refuses (only SELECT allowed).
- [ ] **5.8.10** Cmd+K + random query → "Preguntar a la IA" fallback → opens panel with query pre-sent.

---

## 6. Cmd+K command palette

- [ ] **6.1** `⌘K` (Mac) / `Ctrl+K` (Linux/Win) opens palette.
- [ ] **6.2** Type "pipe" → jumps to pipeline.
- [ ] **6.3** Type an empresa name → jumps to detail page.
- [ ] **6.4** Type a free-text question → **Preguntar a la IA** fallback appears → Enter forwards it to the AI panel.
- [ ] **6.5** Esc closes palette.
- [ ] **6.6** Results respect role (vendedor doesn't see admin shortcuts).

---

## 7. Notifications

- [ ] **7.1** Bell icon shows badge count (Ignacio seed: 2 unread, per `docs/seed.md`).
- [ ] **7.2** Open bell dropdown → 4 notifications listed with relative timestamps.
- [ ] **7.3** Click a notification → marks read + navigates to the relevant record.
- [ ] **7.4** Admin creates a rule → vendedor receives notification on next qualifying event.

---

## 8. Mutations / submit-button discipline

- [ ] **8.1** Every submit button disables and shows spinner + "Guardando…" / "Enviando…" during mutation.
- [ ] **8.2** No double-submit on rapid click.
- [ ] **8.3** Validation errors show in Spanish, inline.
- [ ] **8.4** Network failure during submit → toast "Error al guardar" with retry; no lost data in the form.

---

## 9. Security / privacy edge cases

- [ ] **9.1** Vendedor tries to access Laura's empresa detail URL → 404 or "no autorizado".
- [ ] **9.2** Vendedor's AI cannot see Laura's data in any tool response (RLS).
- [ ] **9.3** `/api/chat` requires auth → anonymous returns 401.
- [ ] **9.4** `/api/admin/*` requires admin → dirección returns 403.
- [ ] **9.5** CSP headers present (check `Content-Security-Policy` in response headers).
- [ ] **9.6** `/api/health` returns 200 and does not leak secrets.
- [ ] **9.7** `.env` values never appear in any response body.
- [ ] **9.8** Rate limit on `/api/chat` is per-user, not global (verify with 2 accounts in parallel).

---

## 10. Performance / polish

- [ ] **10.1** First meaningful paint on `/pipeline` < 1.5s (LAN) — skeleton fills the gap.
- [ ] **10.2** Kanban drag feels smooth (no jank).
- [ ] **10.3** Typewriter reveal feels fast (~1600 chars/sec); adjust `charsPerTick`/`tickMs` in `use-chat.ts` if needed.
- [ ] **10.4** Large empresa list (100+ rows) paginates or virtualizes — no 10s render stall.
- [ ] **10.5** No memory leak after 10 minutes of navigation + 20+ chat turns (Task Manager stable).

---

## 11. Regression targets — specific fixes that must still work

| Bug | Date fixed | Test |
|-----|-----------|------|
| `INVALID_ARGUMENT — missing thought_signature` on 2nd AI turn | 2026-04-17 | §5.3 |
| Citation links navigating to `/cite.href` (404) | 2026-04-16 | §5.2 |
| Chat skeleton invisible (same color as bubble) | 2026-04-16 | §5.1.5 |
| Typewriter too slow | 2026-04-17 | §5.1.6 |
| Internal links opening new tab | 2026-04-17 | §5.2.3 |
| `/mis-tareas` default tab was Lista | 2026-04-16 | §2.2.1 |
| `/empresa/[id]` had no skeleton | 2026-04-16 | §1.3.6 |
| Default dashboard loader said "Loading…" in English | 2026-04-16 | §1.3.8 |

---

## 12. Ship gates (green = deploy)

- [ ] **12.1** All §0 pre-flight items green.
- [ ] **12.2** All §2 Vendedor tests green (this is Rebeca's demo path).
- [ ] **12.3** All §3 Dirección tests green.
- [ ] **12.4** All §5.1–§5.3 AI UI + regression tests green.
- [ ] **12.5** §11 regression targets green.
- [ ] **12.6** At least one §5.8 edge case tested per role.
- [ ] **12.7** `npm run build` green.
- [ ] **12.8** VPS deploy (optional) — `GET /api/health` 200 from public URL.

If all boxes in §12 are checked, **demo-ready**. If any fail → fix before `git push`.
