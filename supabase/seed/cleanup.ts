import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Wipe leaf tables managed by the seed before reinserting.
 *
 * Some seed modules (comisiones, kpi_snapshots, kpi_config,
 * notificacion_config, scripts) do NOT set explicit UUIDs on their rows,
 * so `.upsert({ onConflict: 'id' })` silently falls back to INSERT and the
 * tables grow unbounded with every run. tareas/notificaciones DO set fixed
 * UUIDs, but earlier versions of the seed did not — a cleanup pass removes
 * those historical ghost rows too.
 *
 * `actividades` is intentionally absent: migration 007 installs a
 * BEFORE UPDATE OR DELETE trigger that raises on any modification (audit
 * log immutability). The activities seed handles re-runs by using fixed
 * UUIDs + `ignoreDuplicates: true` so duplicates are skipped via
 * ON CONFLICT DO NOTHING (which never fires the trigger).
 *
 * Only leaf tables are touched. empresas/contactos/deals/pipelines/fases
 * are upsert-safe on their own (fixed UUIDs in `ids.ts`) and have FKs from
 * many places; leaving them alone keeps FK order trivial.
 */
export async function seedCleanup(supabase: SupabaseClient) {
  console.log('  Cleaning previous seed rows...');

  const tables = [
    'tareas',
    'notificaciones',
    'comisiones',
    'kpi_snapshots',
    'kpi_config',
    'notificacion_config',
    'scripts',
  ] as const;

  for (const table of tables) {
    // Supabase requires a filter on DELETE — `not id is null` matches every
    // row without needing to know a sentinel UUID.
    const { error } = await supabase.from(table).delete().not('id', 'is', null);
    if (error) throw new Error(`Cleanup ${table}: ${error.message}`);
  }
}
