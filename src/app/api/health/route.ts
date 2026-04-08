/**
 * Liveness probe for Docker `HEALTHCHECK` and upstream load balancers.
 *
 * This is a **liveness** check, not a readiness check: it only confirms the
 * Next.js process is alive and able to render a response. It deliberately does
 * NOT query Supabase — a DB outage should surface in Grafana / Supabase status,
 * not cause the container to restart-loop. Restarting the container will not
 * fix an upstream DB problem, so tying liveness to the DB only makes outages
 * worse.
 *
 * No auth, no rate limit: the endpoint must be reachable from the Docker
 * daemon (local loopback) and any load balancer, and it returns no secrets.
 */
export const dynamic = 'force-dynamic';

export function GET(): Response {
  return Response.json({ status: 'ok', ts: Date.now() });
}
