/**
 * Inline citation helpers for AI tool outputs.
 *
 * Pattern inspired by Salesforce Agentforce `GenAiCitationOutput`: every row
 * returned to the model carries a `cite` field pointing back to the record in
 * the app UI. Prompts instruct the model to render these as markdown links
 * (`[label](href)`) so the user can jump directly to the source.
 *
 * Only empresas have a dedicated detail page in the current app. Deals,
 * contactos, tareas and actividades cite their parent empresa — that is
 * still useful and keeps the surface consistent.
 */

export type CiteKind =
  | 'empresa'
  | 'deal'
  | 'contacto'
  | 'tarea'
  | 'actividad';

export interface Cite {
  kind: CiteKind;
  id: string;
  href: string;
  label: string;
}

export function buildCite(
  kind: CiteKind,
  id: string,
  label: string,
  empresaId?: string | null,
): Cite {
  const target = kind === 'empresa' ? id : empresaId;
  return {
    kind,
    id,
    label,
    href: target ? `/empresa/${target}` : '/empresas',
  };
}
