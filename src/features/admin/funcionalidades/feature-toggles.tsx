'use client';

/**
 * Phase 10 — admin feature toggles form.
 *
 * Checkbox-style list (one Switch per `feat_*` boolean) with a short Spanish
 * description under each label. Saves via PATCH /api/admin/tenant; on success
 * calls router.refresh() so the dashboard layout re-fetches the tenant config
 * and the sidebar nav / command palette / mounts update without a hard reload.
 *
 * Mirrors the diff pattern from `branding-form.tsx` — only the flags that
 * actually changed are PATCHed.
 */

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  FEATURE_FLAGS,
  type FeatureFlag,
  type TenantConfig,
  type TenantFlags,
} from '@/features/tenant/types';

interface FeatureTogglesProps {
  initial: TenantConfig;
}

interface FlagRow {
  key: FeatureFlag;
  label: string;
  description: string;
}

/** Spanish copy for each feature flag, in the same order as §10.7 of the spec. */
const FLAG_ROWS: FlagRow[] = [
  {
    key: 'feat_ai_chat',
    label: 'Chat IA',
    description: 'Panel lateral con asistente IA para consultas en lenguaje natural.',
  },
  {
    key: 'feat_morning_summary',
    label: 'Resumen matinal IA',
    description: 'Tarjeta con el resumen diario generado por IA en el cockpit.',
  },
  {
    key: 'feat_command_palette',
    label: 'Paleta de comandos (Cmd+K)',
    description: 'Búsqueda global y acciones rápidas con Cmd+K / Ctrl+K.',
  },
  {
    key: 'feat_dashboard_historico',
    label: 'Histórico del panel',
    description: 'Gráficos de evolución temporal y sparklines en el panel de dirección.',
  },
  {
    key: 'feat_admin_kpis',
    label: 'KPIs configurables (admin)',
    description: 'Pantalla de administración para ajustar umbrales de KPIs.',
  },
  {
    key: 'feat_admin_scripts',
    label: 'Scripts (admin)',
    description: 'Pantalla de administración para crear y editar scripts de venta.',
  },
  {
    key: 'feat_notifications',
    label: 'Motor de notificaciones',
    description: 'Reglas de disparo automáticas para recordatorios y alertas.',
  },
  {
    key: 'feat_empresa_task_cal',
    label: 'Calendario de tareas por empresa',
    description: 'Widget de calendario con las tareas de cada empresa en su ficha.',
  },
  {
    key: 'feat_ai_lead_capture',
    label: 'Captura inteligente de leads (IA)',
    description: 'Pegar texto en el formulario de creación y la IA extrae los campos.',
  },
  {
    key: 'feat_ai_next_action',
    label: 'Próxima mejor acción (IA)',
    description: 'Tarjeta con la siguiente acción recomendada en empresas y oportunidades.',
  },
  {
    key: 'feat_ai_command_palette',
    label: 'Cmd+K conversacional (IA)',
    description: 'Ejecutar acciones (crear tarea, registrar actividad…) con lenguaje natural.',
  },
];

async function readError(res: Response): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  return body.error ?? `HTTP ${res.status}`;
}

/** Returns only the flag entries that differ from the initial server snapshot. */
function diffFlags(
  initial: TenantFlags,
  current: TenantFlags
): Partial<TenantFlags> {
  const out: Partial<TenantFlags> = {};
  for (const flag of FEATURE_FLAGS) {
    if (initial[flag] !== current[flag]) {
      out[flag] = current[flag];
    }
  }
  return out;
}

export function FeatureToggles({ initial }: FeatureTogglesProps) {
  const router = useRouter();
  const [flags, setFlags] = useState<TenantFlags>(initial.flags);
  const [saving, setSaving] = useState(false);

  const dirty = Object.keys(diffFlags(initial.flags, flags)).length > 0;

  const update = useCallback((key: FeatureFlag, value: boolean) => {
    setFlags((prev) => ({ ...prev, [key]: value }));
  }, []);

  const save = useCallback(async () => {
    const patch = diffFlags(initial.flags, flags);
    if (Object.keys(patch).length === 0) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/tenant', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(await readError(res));
      toast.success('Funcionalidades actualizadas');
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'No se ha podido guardar'
      );
    } finally {
      setSaving(false);
    }
  }, [flags, initial.flags, router]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Funcionalidades activas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {FLAG_ROWS.map((row) => (
            <div
              key={row.key}
              className="flex items-start justify-between gap-4 border-b border-border pb-4 last:border-b-0 last:pb-0"
            >
              <div className="flex-1 space-y-1">
                <Label htmlFor={row.key} className="text-sm font-medium">
                  {row.label}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {row.description}
                </p>
              </div>
              <Switch
                id={row.key}
                checked={flags[row.key]}
                onCheckedChange={(v) => update(row.key, v)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={!dirty || saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
            </>
          ) : (
            'Guardar cambios'
          )}
        </Button>
      </div>
    </div>
  );
}
