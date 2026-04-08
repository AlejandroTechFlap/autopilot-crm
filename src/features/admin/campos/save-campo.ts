/**
 * Phase 10 — shared POST/PATCH for `/api/admin/campos`.
 *
 * Lives in its own module so the dialog stays under the 300-line cap and so
 * the same validation lives in one place. Throws `Error(message)` on
 * client-side validation failure or HTTP error — caller handles toast.
 */

import type {
  CampoPersonalizado,
  Entidad,
  TipoCampo,
} from '@/features/tenant/types';

export interface CampoFormValues {
  entidad: Entidad;
  clave: string;
  etiqueta: string;
  tipo: TipoCampo;
  opciones: string[];
  orden: number;
  obligatorio: boolean;
}

async function readError(res: Response): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  return body.error ?? `HTTP ${res.status}`;
}

export async function saveCampo(
  form: CampoFormValues,
  editing: CampoPersonalizado | null
): Promise<void> {
  const etiqueta = form.etiqueta.trim();
  if (!etiqueta || !form.clave) {
    throw new Error('Etiqueta y clave son obligatorias');
  }
  const opciones =
    form.tipo === 'seleccion'
      ? form.opciones.map((o) => o.trim()).filter(Boolean)
      : null;
  if (form.tipo === 'seleccion' && (!opciones || opciones.length === 0)) {
    throw new Error('Añade al menos una opción');
  }

  // POST schema rejects null; PATCH accepts it. Omit on create-non-seleccion,
  // send null on edit-non-seleccion so stale options are cleared in the DB.
  const common = {
    etiqueta,
    tipo: form.tipo,
    opciones:
      form.tipo === 'seleccion' ? opciones : editing ? null : undefined,
    orden: form.orden,
    obligatorio: form.obligatorio,
  };
  const res = await fetch(
    editing ? `/api/admin/campos/${editing.id}` : '/api/admin/campos',
    {
      method: editing ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        editing
          ? common
          : { ...common, entidad: form.entidad, clave: form.clave }
      ),
    }
  );
  if (!res.ok) throw new Error(await readError(res));
}
