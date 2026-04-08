import { createClient } from '@/lib/supabase/server';
import { requireApiRole, jsonError } from '@/lib/api-utils';
import type { ApiUser } from '@/lib/api-utils';
import { z } from 'zod';
import { getCamposPersonalizados } from '@/features/tenant/lib/get-tenant-config';
import { validateCamposPersonalizados } from '@/features/tenant/lib/custom-fields';
import type { CustomFieldValue, CustomFieldsMap } from '@/features/tenant/types';
import type { Json } from '@/types/database';

// Phase 10 — accept the JSONB custom-field bag on each entity. The Zod
// schema only enforces the shape (string keys, primitive-or-null values);
// the *contents* are validated in a second pass against the live
// `campos_personalizados` definitions, so dropping or renaming a field is
// instantly reflected without redeploying the API.
const CampoValueSchema: z.ZodType<CustomFieldValue> = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);
const CamposMapSchema = z.record(z.string(), CampoValueSchema);

const CreateLeadSchema = z.object({
  empresa: z.object({
    nombre: z.string().min(1),
    fuente_lead: z.enum(['ads', 'organico', 'referido', 'bbdd', 'feria', 'cold_call', 'otro']),
    provincia: z.string().optional(),
    categoria: z.enum(['mascotas', 'veterinaria', 'agro', 'retail', 'servicios', 'otro']).optional(),
    descripcion: z.string().optional(),
    informador: z.string().optional(),
    campos_personalizados: CamposMapSchema.optional(),
  }),
  contacto: z.object({
    nombre_completo: z.string().min(1),
    cargo: z.string().optional(),
    telefono: z.string().optional(),
    email: z.string().email().optional(),
    campos_personalizados: CamposMapSchema.optional(),
  }),
  deal: z.object({
    pipeline_id: z.string().uuid(),
    fase_actual: z.string().uuid(),
    valor: z.number().min(0).default(0),
    // Required: the creator (admin/direccion) must explicitly assign the new
    // lead to a vendedor. There is no implicit self-assignment.
    vendedor_asignado: z.string().uuid(),
    campos_personalizados: CamposMapSchema.optional(),
  }),
});

export async function POST(request: Request) {
  // Lead creation is reserved to admin/direccion. Vendedores get 403.
  // See docs/phase-2-pipeline-company.md → "Lead creation — role gating".
  const auth = await requireApiRole('admin', 'direccion');
  if (auth instanceof Response) return auth;
  const user = auth as ApiUser;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  const parsed = CreateLeadSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues.map((i) => i.message).join(', '));
  }

  const { empresa, contacto, deal } = parsed.data;
  const assigneeId = deal.vendedor_asignado;

  // Phase 10 — re-validate custom fields against the current definitions
  // server-side. Client-side validation is for instant feedback only; this
  // is the source of truth and rejects unknown keys, type mismatches, and
  // missing required fields.
  const [empresaDefs, contactoDefs, dealDefs] = await Promise.all([
    getCamposPersonalizados('empresa'),
    getCamposPersonalizados('contacto'),
    getCamposPersonalizados('deal'),
  ]);
  const empresaCampos = validateCamposPersonalizados(
    empresaDefs,
    (empresa.campos_personalizados ?? {}) as CustomFieldsMap
  );
  const contactoCampos = validateCamposPersonalizados(
    contactoDefs,
    (contacto.campos_personalizados ?? {}) as CustomFieldsMap
  );
  const dealCampos = validateCamposPersonalizados(
    dealDefs,
    (deal.campos_personalizados ?? {}) as CustomFieldsMap
  );
  if (!empresaCampos.ok || !contactoCampos.ok || !dealCampos.ok) {
    const errors = {
      ...(empresaCampos.ok ? {} : { empresa: empresaCampos.errors }),
      ...(contactoCampos.ok ? {} : { contacto: contactoCampos.errors }),
      ...(dealCampos.ok ? {} : { deal: dealCampos.errors }),
    };
    return jsonError('Campos personalizados inválidos: ' + JSON.stringify(errors));
  }

  const supabase = await createClient();

  // Create empresa, assigned to the chosen vendedor (NOT the creator).
  const { data: newEmpresa, error: empError } = await supabase
    .from('empresas')
    .insert({
      nombre: empresa.nombre,
      fuente_lead: empresa.fuente_lead,
      lifecycle_stage: 'lead',
      vendedor_asignado: assigneeId,
      provincia: empresa.provincia ?? null,
      categoria: empresa.categoria ?? null,
      descripcion: empresa.descripcion ?? null,
      informador: empresa.informador ?? null,
      campos_personalizados: empresaCampos.sanitized as Json,
    })
    .select('id')
    .single();

  if (empError || !newEmpresa) {
    return jsonError('Failed to create company: ' + (empError?.message ?? 'unknown'));
  }

  // Create contact
  const { data: newContacto, error: contError } = await supabase
    .from('contactos')
    .insert({
      empresa_id: newEmpresa.id,
      nombre_completo: contacto.nombre_completo,
      cargo: contacto.cargo ?? null,
      telefono: contacto.telefono ?? null,
      email: contacto.email ?? null,
      es_principal: true,
      campos_personalizados: contactoCampos.sanitized as Json,
    })
    .select('id')
    .single();

  if (contError || !newContacto) {
    return jsonError('Failed to create contact: ' + (contError?.message ?? 'unknown'));
  }

  // Create deal, also assigned to the chosen vendedor.
  const { data: newDeal, error: dealError } = await supabase
    .from('deals')
    .insert({
      empresa_id: newEmpresa.id,
      pipeline_id: deal.pipeline_id,
      fase_actual: deal.fase_actual,
      valor: deal.valor,
      vendedor_asignado: assigneeId,
      campos_personalizados: dealCampos.sanitized as Json,
    })
    .select('id')
    .single();

  if (dealError || !newDeal) {
    return jsonError('Failed to create deal: ' + (dealError?.message ?? 'unknown'));
  }

  // Log activity
  await supabase.from('actividades').insert({
    empresa_id: newEmpresa.id,
    deal_id: newDeal.id,
    contacto_id: newContacto.id,
    tipo: 'sistema',
    contenido: `New lead created: ${empresa.nombre}`,
    usuario_id: user.id,
  });

  return Response.json(
    { empresa: newEmpresa, contacto: newContacto, deal: newDeal },
    { status: 201 }
  );
}
