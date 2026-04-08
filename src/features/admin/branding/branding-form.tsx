'use client';

/**
 * Phase 10 — admin branding form.
 *
 * Two-column layout: left = identity (logo, name, contact), right = colors
 * with a live preview. Saves via PATCH /api/admin/tenant; on success calls
 * router.refresh() so the dashboard layout re-fetches the tenant config and
 * the sidebar logo + CSS variables update without a hard reload.
 *
 * The form keeps a local mirror of `TenantBrand` and only PATCHes the
 * fields that changed — see `diffBrand()` below.
 */

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogoUploader } from './logo-uploader';
import { HEX_COLOR_RE } from '@/features/tenant/lib/custom-fields';
import type { TenantBrand, TenantConfig } from '@/features/tenant/types';

interface BrandingFormProps {
  initial: TenantConfig;
}

async function readError(res: Response): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  return body.error ?? `HTTP ${res.status}`;
}

/** Returns only the brand fields that differ from the initial server snapshot. */
function diffBrand(
  initial: TenantBrand,
  current: TenantBrand
): Partial<TenantBrand> {
  const out: Partial<TenantBrand> = {};
  if (initial.nombre_empresa !== current.nombre_empresa)
    out.nombre_empresa = current.nombre_empresa;
  if (initial.logo_url !== current.logo_url) out.logo_url = current.logo_url;
  if (initial.color_primario !== current.color_primario)
    out.color_primario = current.color_primario;
  if (initial.color_acento !== current.color_acento)
    out.color_acento = current.color_acento;
  if (initial.direccion !== current.direccion) out.direccion = current.direccion;
  if (initial.email_contacto !== current.email_contacto)
    out.email_contacto = current.email_contacto;
  if (initial.telefono !== current.telefono) out.telefono = current.telefono;
  return out;
}

export function BrandingForm({ initial }: BrandingFormProps) {
  const router = useRouter();
  const [brand, setBrand] = useState<TenantBrand>(initial.brand);
  const [saving, setSaving] = useState(false);

  const dirty = Object.keys(diffBrand(initial.brand, brand)).length > 0;
  const colorsValid =
    HEX_COLOR_RE.test(brand.color_primario) &&
    HEX_COLOR_RE.test(brand.color_acento);

  const update = useCallback((patch: Partial<TenantBrand>) => {
    setBrand((prev) => ({ ...prev, ...patch }));
  }, []);

  const save = useCallback(async () => {
    if (!colorsValid) {
      toast.error('Los colores deben tener formato #rrggbb');
      return;
    }
    if (!brand.nombre_empresa.trim()) {
      toast.error('El nombre de la empresa es obligatorio');
      return;
    }
    const patch = diffBrand(initial.brand, brand);
    if (Object.keys(patch).length === 0) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/tenant', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(await readError(res));
      toast.success('Marca actualizada');
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'No se ha podido guardar'
      );
    } finally {
      setSaving(false);
    }
  }, [brand, colorsValid, initial.brand, router]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Identidad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Logo (PNG)</Label>
            <LogoUploader
              value={brand.logo_url}
              onChange={(url) => update({ logo_url: url })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nombre_empresa">Nombre de la empresa</Label>
            <Input
              id="nombre_empresa"
              value={brand.nombre_empresa}
              onChange={(e) => update({ nombre_empresa: e.target.value })}
              maxLength={120}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Input
              id="direccion"
              value={brand.direccion ?? ''}
              onChange={(e) =>
                update({ direccion: e.target.value || null })
              }
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email_contacto">Email de contacto</Label>
            <Input
              id="email_contacto"
              type="email"
              value={brand.email_contacto ?? ''}
              onChange={(e) =>
                update({ email_contacto: e.target.value || null })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input
              id="telefono"
              value={brand.telefono ?? ''}
              onChange={(e) =>
                update({ telefono: e.target.value || null })
              }
              maxLength={200}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Colores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ColorField
            label="Color primario"
            id="color_primario"
            value={brand.color_primario}
            onChange={(v) => update({ color_primario: v })}
          />
          <ColorField
            label="Color de acento"
            id="color_acento"
            value={brand.color_acento}
            onChange={(v) => update({ color_acento: v })}
          />
          <BrandPreview brand={brand} />
        </CardContent>
      </Card>

      <div className="flex justify-end lg:col-span-2">
        <Button
          onClick={save}
          disabled={!dirty || saving || !colorsValid}
        >
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

interface ColorFieldProps {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
}

function ColorField({ label, id, value, onChange }: ColorFieldProps) {
  const valid = HEX_COLOR_RE.test(value);
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={label}
          value={valid ? value : '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded border border-border bg-transparent"
        />
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#0f172a"
          className="font-mono"
          aria-invalid={!valid}
        />
      </div>
      {!valid && (
        <p className="text-xs text-destructive">Formato esperado: #rrggbb</p>
      )}
    </div>
  );
}

function BrandPreview({ brand }: { brand: TenantBrand }) {
  return (
    <div className="rounded-md border border-border p-3">
      <p className="mb-2 text-xs font-medium text-muted-foreground">
        Vista previa
      </p>
      <div
        className="rounded-md p-3 text-sm font-medium text-white"
        style={{ backgroundColor: brand.color_primario }}
      >
        {brand.nombre_empresa || 'Tu empresa'}
      </div>
      <button
        type="button"
        className="mt-2 rounded-md px-3 py-2 text-sm font-medium text-white"
        style={{ backgroundColor: brand.color_acento }}
      >
        Botón de ejemplo
      </button>
    </div>
  );
}
