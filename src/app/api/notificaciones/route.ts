import { createClient } from '@/lib/supabase/server';
import { requireApiAuth, jsonError } from '@/lib/api-utils';
import type { ApiUser } from '@/lib/api-utils';
import { z } from 'zod';

export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof Response) return auth;
  const user = auth as ApiUser;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('notificaciones')
    .select('id, titulo, contenido, tipo, leido, referencia_id, created_at')
    .eq('usuario_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return jsonError('Failed to load notifications: ' + error.message);
  }

  // Resolve a clickable `link` per notification:
  //   follow_up_overdue → referencia_id is already an empresa id
  //   deal_stalled      → referencia_id is a deal id; resolve to its empresa
  // Other types currently have no target page.
  const dealIds = (data ?? [])
    .filter((n) => n.tipo === 'deal_stalled' && n.referencia_id)
    .map((n) => n.referencia_id as string);

  const dealToEmpresa = new Map<string, string>();
  if (dealIds.length > 0) {
    const { data: deals } = await supabase
      .from('deals')
      .select('id, empresa_id')
      .in('id', dealIds);
    for (const d of deals ?? []) {
      if (d.empresa_id) dealToEmpresa.set(d.id, d.empresa_id);
    }
  }

  const enriched = (data ?? []).map((n) => {
    let link: string | null = null;
    if (n.referencia_id) {
      if (n.tipo === 'follow_up_overdue') {
        link = `/empresa/${n.referencia_id}`;
      } else if (n.tipo === 'deal_stalled') {
        const empresaId = dealToEmpresa.get(n.referencia_id);
        if (empresaId) link = `/empresa/${empresaId}`;
      }
    }
    return { ...n, link };
  });

  return Response.json({ notificaciones: enriched });
}

const MarkReadSchema = z.object({
  ids: z.array(z.string().uuid()),
});

export async function PATCH(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof Response) return auth;
  const user = auth as ApiUser;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  const parsed = MarkReadSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues.map((i) => i.message).join(', '));
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('notificaciones')
    .update({ leido: true })
    .eq('usuario_id', user.id)
    .in('id', parsed.data.ids);

  if (error) {
    return jsonError('Failed to mark as read: ' + error.message);
  }

  return Response.json({ ok: true });
}
