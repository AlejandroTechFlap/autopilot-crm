import { createClient } from './client';

// Module-level singleton for the Supabase browser client.
// Reusing the same instance across hooks/components prevents the
// "new client per render" pattern that re-creates auth listeners and
// realtime channels on every render — which causes broken HMR cleanup
// and runaway WebSocket reconnects in dev.
let _client: ReturnType<typeof createClient> | null = null;

export function getBrowserClient(): ReturnType<typeof createClient> {
  if (!_client) {
    _client = createClient();
  }
  return _client;
}
