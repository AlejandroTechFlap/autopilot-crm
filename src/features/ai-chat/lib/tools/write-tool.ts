/**
 * Confirmation-before-write scaffolding.
 *
 * Pattern inspired by Salesforce Einstein Trust Layer: any tool that mutates
 * state must surface a `confirmation_required` flag in its result so the
 * client UI can render a confirm/cancel modal before the write actually
 * executes. Today, every tool in this directory is read-only — this module
 * only defines the contract so future write tools (e.g. `create_tarea`,
 * `update_deal`) inherit it and the UI never ships an unconfirmed mutation.
 *
 * Usage sketch:
 *   export async function createTarea(input, supabase, opts) {
 *     if (!opts?.confirmed) {
 *       return pendingConfirmation({
 *         summary: `Crear tarea "${input.titulo}" para ${input.empresa_nombre}`,
 *         input,
 *       });
 *     }
 *     // ...actually perform the write...
 *     return { ok: true, tarea_id: ... };
 *   }
 */

export interface PendingConfirmation<TInput> {
  confirmation_required: true;
  summary: string;
  input: TInput;
}

export function pendingConfirmation<TInput>(args: {
  summary: string;
  input: TInput;
}): PendingConfirmation<TInput> {
  return {
    confirmation_required: true,
    summary: args.summary,
    input: args.input,
  };
}

export function isPendingConfirmation(
  value: unknown,
): value is PendingConfirmation<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { confirmation_required?: unknown }).confirmation_required === true
  );
}
