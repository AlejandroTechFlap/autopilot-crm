# Autopilot CRM — End-User Guide

> Audience: end users (sales reps, sales managers, admins) testing the application
> through the browser. **No APIs, no curl, no DevTools.** Everything below is clickable.
>
> Last updated: 2026-04-07.

## 1. Getting started

### 1.1 Sign in

1. Open the app at the URL provided by your admin (default: `http://localhost:3000`).
2. You will be redirected to **Login**.
3. Enter your email + password (seeded users below) and click **Sign in**.
4. After login you land on a screen that depends on your role.

### 1.2 Seeded test accounts

| Role | Email | Password | Lands on |
|------|-------|----------|----------|
| Admin | `admin@autopilotcrm.com` | `Admin123!` | `/admin` overview |
| Dirección | `rebeca@autopilotcrm.com` | `Rebeca123!` | `/dashboard` |
| Vendedor | `ignacio@autopilotcrm.com` | `Ignacio123!` | `/pipeline` |
| Vendedor | `laura@autopilotcrm.com` | `Laura123!` | `/pipeline` |

Source of truth: `supabase/seed/users.ts`.

### 1.3 Top navigation

The sidebar shows only the screens you have permission for. Roles see:

- **Vendedor:** Pipeline · Mis tareas · Empresas · Contactos
- **Dirección:** all of the above + Panel
- **Admin:** all of the above + Ajustes

The UI is **Spanish-only** (see [`docs/i18n.md`](./i18n.md) for the glossary).
The 🔔 bell shows unread notifications. **Cmd+K** (or **Ctrl+K**) opens the global
command palette from anywhere. The AI chat and morning summary are reachable from the
chat icon at the bottom-right of every page.

---

## 2. Feature catalogue and how to test each one

Each section below has: **What it does**, **Who can use it**, **Steps to test**, and
**Expected result**. Follow the steps in order — they are designed so a fresh tester can
verify the feature in under 2 minutes.

> Phase 8 UI polish (loading skeletons on every screen, an error boundary, and a
> Spanish `not-found` page) is shipped, so navigation should never crash. All visible
> labels are in Spanish per [`docs/i18n.md`](./i18n.md).

---

### 2.1 Pipeline kanban  *(Vendedor + Dirección + Admin)*

**What it does.** Shows every deal as a card grouped by phase. Cards are draggable.
A pulsing red dot means the deal has been stuck in its phase past `tiempo_esperado`.

**Steps to test.**
1. Click **Pipeline** in the sidebar.
2. You should see one column per phase (Inicio → … → Cerrado).
3. Drag a card from one phase to the next phase.
4. Confirm a green toast says "Oportunidad movida".
5. Refresh the page — the card should still be in the new column.
6. Open a second browser tab as a different user → drag a card → watch it move in the
   first tab without refreshing (**realtime collaboration**).

**Filters.** Above the board:
- **Search box** — type a deal title.
- **Owner filter** — pick a vendedor.
- **Value range** — drag the min/max slider.

**Pulsing red.** If you see a card with a pulsing red dot, hover it: the tooltip shows
how many days overdue it is.

---

### 2.2 Tarjeta de oportunidad → detalle de empresa  *(All roles)*

**Steps to test.**
1. On the pipeline, click any deal card (don't drag — just click).
2. The company detail page (`/empresa/[id]`) opens with header, contacts, deals, and
   timeline.
3. Click **Registrar actividad** → pick type (Llamada / Nota / Reunión) + content →
   submit. The new entry appears at the top of the **Historial** list.
4. From the company detail, open the deal and click **Cerrar oportunidad** → choose
   **Ganada** or **Perdida**.
   - **Perdida** requires a reason from the dropdown — try saving without one and
     verify it refuses (B4 invariant).
5. Confirm the card disappears from the active board (it moved to the closed list).

---

### 2.3 Cockpit  *(Vendedor)*

**Steps to test as `ignacio@autopilotcrm.com`.**
1. Sign in. You land on `/mis-tareas`.
2. You should see personal KPI tiles (oportunidades abiertas, comisión, etc.) plus the
   morning summary card and the task inbox.
3. Click a task title → it opens the linked empresa.
4. Tick a task → it disappears from the list and the counters drop.
5. Click **+ Nueva tarea** → fill the modal (título, prioridad, fecha de vencimiento)
   → save → it appears.

---

### 2.4 Mis tareas  *(Vendedor)*

**Steps to test.**
1. Sidebar → **Mis tareas**.
2. You see all your open tasks split across **Urgentes / Altas / Normales** plus an
   **Atrasadas** group.
3. Use the filter buttons (**Todas / Atrasadas / Hoy**) to narrow the list.
4. Check off a task → it strikes through and the inbox counters drop.

---

### 2.5 Panel (Dirección)  *(Dirección + Admin)*

**Steps to test as `rebeca@autopilotcrm.com`.**
1. Sidebar → **Panel**.
2. You should see exactly **5 KPI tiles** with green/amber/red semaphores.
3. Each tile shows the current value, the period delta (e.g. "+12% vs last month"),
   and a sparkline.
4. At the top, change the **period selector** between *7 days*, *Month*, *Quarter* —
   every tile recomputes.
5. Click a tile → a **drill-down panel** opens listing the rows that make up that KPI
   (e.g. clicking "Deals won" shows the won deals).
6. Click a row in the drill-down → it navigates to that company/deal.

---

### 2.6 Empresas  *(All roles)*

**Steps to test.**
1. Sidebar → **Empresas**.
2. You see a paginated table with columns: nombre, sector, estado, vendedor asignado,
   próxima acción, valor pipeline.
3. Use the search box to filter by name (debounced).
4. Click a row → the **Detalle de empresa** page opens.
5. Click **+ Nueva empresa** → fill the form → save → the new row appears at the top.
6. Click **Exportar CSV** → a file downloads.

---

### 2.7 Detalle de empresa  *(All roles)*

**Steps to test.**
1. From **Empresas**, click any row.
2. The page sections: **Cabecera · Datos generales · Contactos · Oportunidades ·
   Historial**.
3. **Datos generales:** edit a field inline (e.g. teléfono) → save → toast confirms.
4. **Contactos:** click **+ Añadir contacto** → fill the modal → it appears below.
   Mark one as **Principal** — the previous principal is automatically un-marked.
5. **Oportunidades:** every open deal for this company plus a **Cerradas** section.
6. **Historial:** read-only timeline (actividades). Try editing — you cannot
   (immutable by design, B1 invariant).

---

### 2.8 Contactos  *(All roles)*

Same pattern as **Empresas**: search, paginate, export CSV, click row to open the
parent empresa.

---

### 2.9 Scripts (read)  *(Vendedor)*

**Steps to test.**
1. Open `/mis-tareas` (cockpit).
2. The right sidebar shows the **Biblioteca de scripts** card.
3. Scripts whose `fase_asociada` matches an active deal phase are highlighted; generic
   ones (no phase) are always listed.
4. Click a script → it expands to show its full content for copy/read.

---

### 2.10 AI Chat  *(All roles)*

**Steps to test.**
1. Click the **chat icon** at the bottom-right of any screen.
2. The chat panel slides up.
3. Ask: *"¿Cuáles son mis deals con más valor?"* → answer streams token by token.
4. Ask: *"Resume el pipeline de la empresa Acme"* → the assistant uses tools to fetch
   data.
5. Click the trash icon to start a new conversation.

---

### 2.11 Resumen matinal  *(Vendedor)*

**Steps to test.**
1. Sign in as a vendedor (or click **Generar resumen** on the cockpit).
2. A card appears: "Buenos días, [name]. Hoy tienes X tareas, Y oportunidades al
   borde de…".
3. The text is generated by Claude based on your current pipeline + tasks.

---

### 2.12 Cmd+K command palette  *(All roles)*

**Steps to test.**
1. Press **Cmd+K** (Mac) or **Ctrl+K** (Win/Linux) anywhere.
2. A modal opens. Type three letters of a company name → results appear.
3. Use ↑/↓ to navigate, **Enter** to open.
4. The palette also lists pages (e.g. type "pipe" → "Go to Pipeline").

---

### 2.13 Notifications bell  *(All roles)*

**Steps to test.**
1. Click the 🔔 in the top bar.
2. A list of unread notifications appears (deal at risk, task overdue, KPI red, etc.).
3. Click one → it navigates to the relevant entity and marks itself as read.
4. The bell counter decreases.

---

## 3. Admin Suite (Phase 7)  *(Admin only)*

Sign in as `admin@autopilotcrm.com`. The sidebar gains an **Ajustes** entry. Click it — you
land on `/admin` with five tabs across the top: **Resumen · Pipelines · Scripts ·
Usuarios · Notificaciones · KPIs**.

### 3.1 Pipelines  *(`/admin/pipelines`)*

**Steps to test.**
1. Click the **Pipelines** tab.
2. Use the dropdown to pick a pipeline (default: "Retail mascotas").
3. Click **+ Nuevo pipeline** → name it "Pipeline de prueba" → **Crear**.
   - A toast confirms. The dropdown shows the new pipeline. It is auto-seeded with
     two phases (**Inicio** and **Cerrado**) so the B3 invariant holds.
4. Switch to "Pipeline de prueba".
5. Click **+ Añadir fase** → a new row "Nueva fase" appears at the bottom.
6. Edit its **Nombre** to "Negociación" and **Días** to "5". Click **Guardar**. Toast
   confirms.
7. Try to delete one of the two original phases → the system refuses if it would leave
   fewer than 2 phases (B3 invariant).
8. Delete the phase you just added → it disappears.

**What you are exercising:** spec rules **A1, A2, A5, B3**.

---

### 3.2 Scripts  *(`/admin/scripts`)*

**Steps to test.**
1. Click the **Scripts** tab. You see existing scripts as cards.
2. Click **+ Nuevo script**.
3. Fill the form:
   - Título: *"Llamada en frío — primera toma"*
   - Fase: pick **Inicio** from the dropdown (or leave blank for generic).
   - Tags: `frio, llamada` (comma-separated).
   - Contenido: paste any text.
4. Click **Guardar**. Toast confirms. The new card appears.
5. Click **Editar** on that card → change the title → save → card updates.
6. Click **Eliminar** → confirm prompt → card disappears.

Now sign in as a **vendedor**, open the cockpit (`/mis-tareas`) — your new script
should appear in the **Biblioteca de scripts** sidebar when an active deal is in
phase **Inicio**.

**What you are exercising:** spec rule **D1**.

---

### 3.3 Usuarios  *(`/admin/usuarios`)*

**Steps to test.**
1. Click the **Usuarios** tab. You see a table of every user.
2. Pick the **rebeca@autopilotcrm.com** row.
3. Edit the **Nombre** cell → click **Guardar** → toast confirms.
4. Change the **Rol** dropdown from *Dirección* to *Vendedor* → click **Guardar** →
   toast confirms.
5. **Last-admin guard test:** try to change `admin@autopilotcrm.com` from *Administrador*
   to *Vendedor*.
   - If there is only one admin remaining, you should see a red toast and HTTP 409.
   - Create a second admin first if you want to be able to demote the original.

**What you are exercising:** part of spec rule **D3** + the safety invariant on admins.

---

### 3.4 Notificaciones  *(`/admin/notificaciones`)*

**Steps to test.**
1. Click the **Notificaciones** tab. You see a table with one row per rule (e.g.
   *"deal_estancado"*, *"tarea_vencida"*, *"kpi_rojo"*).
2. For one rule, change **Canal** from *In-app* to *Email*.
3. For another, change **Umbral (h)** from 48 to 24.
4. Toggle the **Activo** switch on a third rule.
5. The **Guardar cambios** button at the bottom-right becomes enabled. Click it.
6. Toast confirms. Refresh the page → your changes persisted.

**What you are exercising:** spec rules **A11–A15**.

---

### 3.5 KPIs  *(`/admin/kpis`)*

**Steps to test.**
1. Click the **KPIs** tab. You see one row per KPI (e.g. *"deals_ganados"*,
   *"tiempo_medio_cierre"*, *"valor_pipeline"*).
2. Pick a KPI and change its **Objetivo** to a new number.
3. Change its **Verde ≥** and **Ámbar ≥** thresholds.
4. Repeat for another KPI.
5. Click **Guardar cambios**. Toast confirms.
6. Open `/dashboard` (Dirección view) → the semaphore colours on that KPI tile should
   reflect the new thresholds.

**What you are exercising:** spec rules **A7, A8, D4**.

---

## 4. End-to-end happy path  *(15 minutes, exercises every role)*

This is the recommended smoke test after any deploy.

1. **As admin:** create a new pipeline, add 3 phases, create one script tied to the
   first phase, raise the **deals_ganados** KPI target to a high number so it goes red.
2. **As dirección:** open the dashboard. Verify the KPI tile is now red. Click it →
   drill-down opens.
3. **As vendedor:** create a new empresa from BBDD → create a contact → create a deal
   on the new pipeline → drag the deal across all phases → close it as **Ganado**.
4. Refresh the dirección dashboard → the KPI should have moved (one more win).
5. Open the AI chat → ask *"¿Cuántos deals ganados llevamos este mes?"* → verify the
   answer matches what you just did.
6. Open the bell → check that notifications were generated for the relevant events.

If every step above passes, the system is healthy.

---

## 5. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Login screen redirects in a loop | Session cookie expired | Clear cookies for the domain and sign in again |
| Pipeline shows "Loading…" forever | Supabase Realtime offline | Reload the page; if still failing, check Supabase status |
| Drag-and-drop doesn't persist | Network blip during PATCH | The card snaps back; just retry the drag |
| Admin tabs are missing | You are signed in as non-admin | Switch to `admin@autopilotcrm.com` |
| "Cannot demote" toast on user save | Last-admin guard | Promote another user to admin first |
| Phase delete refused | B3 invariant (need ≥2 phases) | Add another phase before deleting |

For anything not listed here, screenshot the error toast (or browser console) and
share it with the dev team.
