import { jsonError, requireApiAuth, type ApiUser } from '@/lib/api-utils';

/**
 * Admin-only guard for `/api/admin/*` route handlers.
 *
 * Returns the authenticated `ApiUser` on success, or a `Response` (401/403)
 * that the caller should return directly. Mirrors `requireApiAuth()` so
 * route handlers can use the same `instanceof Response` early-return pattern.
 *
 * The `usuarios` table + RLS already restricts config table writes to admin,
 * but routing through this helper gives a clearer 403 response and avoids
 * surfacing RLS errors to the client.
 */
export async function requireAdmin(): Promise<ApiUser | Response> {
  const auth = await requireApiAuth();
  if (auth instanceof Response) return auth;
  if (auth.rol !== 'admin') {
    return jsonError('Forbidden: admin role required', 403);
  }
  return auth;
}
