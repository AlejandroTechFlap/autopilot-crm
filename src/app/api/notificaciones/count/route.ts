import { createClient } from '@/lib/supabase/server';
import { requireApiAuth, jsonError } from '@/lib/api-utils';
import type { ApiUser } from '@/lib/api-utils';
import { runTriggers } from '@/features/notifications/lib/triggers';

export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof Response) return auth;
  const user = auth as ApiUser;

  // Run notification engine triggers (overdue follow-ups, stalled deals).
  // Runs on each count check; trigger logic dedupes per-day.
  await runTriggers(user);

  const supabase = await createClient();

  const { count, error } = await supabase
    .from('notificaciones')
    .select('id', { count: 'exact', head: true })
    .eq('usuario_id', user.id)
    .eq('leido', false);

  if (error) {
    return jsonError('Failed to count notifications: ' + error.message);
  }

  return Response.json({ count: count ?? 0 });
}
