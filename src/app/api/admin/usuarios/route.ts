import { createClient } from '@/lib/supabase/server';
import { jsonError } from '@/lib/api-utils';
import { requireAdmin } from '@/features/admin/lib/admin-guard';

/** GET — list all users for the admin table. */
export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nombre, email, rol, avatar_url, created_at')
    .order('nombre', { ascending: true });

  if (error) {
    return jsonError('Failed to load users: ' + error.message);
  }

  return Response.json({ usuarios: data ?? [] });
}
