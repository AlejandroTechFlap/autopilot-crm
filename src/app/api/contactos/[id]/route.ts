import { createClient } from '@/lib/supabase/server';
import { requireApiAuth, jsonError } from '@/lib/api-utils';
import { z } from 'zod';

const UpdateContactoSchema = z.object({
  nombre_completo: z.string().min(1).optional(),
  cargo: z.string().nullable().optional(),
  telefono: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth();
  if (auth instanceof Response) return auth;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  const parsed = UpdateContactoSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues.map((i) => i.message).join(', '));
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('contactos')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return jsonError('Failed to update contact: ' + error.message);
  }

  return Response.json({ contacto: data });
}
