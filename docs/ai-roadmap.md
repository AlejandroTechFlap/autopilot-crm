# AI Roadmap — HubSpot Breeze + Salesforce Agentforce playbook

Prioritised follow-up work for the AI assistant. Items 1–5 shipped 2026-04-16 (see [`phase-5-ai-chat.md` §Quick-wins](./phase-5-ai-chat.md)). Items 6–11 are deferred; ship opportunistically.

## Shipped (2026-04-16)

| # | Pattern | Source | Status |
|---|---------|--------|--------|
| 0 | `thought_signature` preservation | Gemini multi-turn contract | IMPLEMENTED |
| 1 | Inline citations on every tool row | Agentforce `GenAiCitationOutput` | IMPLEMENTED |
| 2 | Per-role tool declaration scoping | Agentforce PoLP (Permission Sets) | IMPLEMENTED |
| 3 | Suggested prompts per role (3 each) | HubSpot Breeze Assistant onboarding chips | IMPLEMENTED |
| 4 | Confirm-before-write scaffolding | Salesforce Einstein Trust Layer | IMPLEMENTED |

## Deferred

| # | Pattern | Source | Effort | Value | Notes |
|---|---------|--------|--------|-------|-------|
| 6 | Agent observability log | Agentforce Observability (GA Nov 2025) | M | High | Persist every tool call (who, when, args, result size, ms). Surface in `/admin/ai-logs`. |
| 7 | Inline tool-call transparency | Agentforce trace view | M | High | Render a collapsible "🔍 consulté search_deals(…) → 12 filas" panel under each answer. |
| 8 | Weekly digest + stuck-deal alerts | HubSpot Sales Daily Digest | M | Medium | Daily briefing already exists — add Monday weekly digest + scheduled stuck-deal nudge. |
| 9 | Resolution-rate metric | HubSpot 72h chat evaluation | M | Medium | Thumbs up/down on every answer; track ratio by role / tool / prompt cluster. |
| 10 | Guardrails (toxicity, PII) | Einstein Trust Layer | M | Production | Run Gemini safety settings + a PII redactor over tool outputs before the model sees them. |
| 11 | Topic classifier per prompt | Agentforce Topic routing | L | Future | Classify incoming user prompt into {analytics, operations, coaching} and route to a specialist agent. Unblocks multi-agent. |

## Design principles (invariant)

1. **RLS is always the source of truth.** No roadmap item bypasses Supabase row-level security.
2. **Read tools stay read tools.** Any new write tool must adopt the `pendingConfirmation` envelope — no direct mutations.
3. **Citations everywhere.** Any new read tool must return `cite: { kind, id, href, label }` on every row.
4. **Role-scoped declarations.** Any new tool that is dirección/admin-only must be hidden from the vendedor declaration list, not just guarded at dispatch.
5. **Spanish UX, English code.** Prompts, chip labels, confirmation summaries are Spanish; identifiers, comments, and this doc are English.
