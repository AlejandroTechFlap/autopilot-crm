'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { EmpresaHeader } from '@/features/empresa/components/empresa-header';
import { EmpresaContacts } from '@/features/empresa/components/empresa-contacts';
import { EmpresaDeals } from '@/features/empresa/components/empresa-deals';
import { EmpresaTimeline } from '@/features/empresa/components/empresa-timeline';
import { EmpresaActions } from '@/features/empresa/components/empresa-actions';
import { EmpresaTaskCalendar } from '@/features/empresa/components/empresa-task-calendar';
import { useFeatureFlag } from '@/features/tenant/lib/tenant-context';
import { renderCampoValue } from '@/features/tenant/lib/custom-fields';
import type {
  CampoPersonalizado,
  CustomFieldsMap,
} from '@/features/tenant/types';
import type { Database } from '@/types/database';

type Empresa = Database['public']['Tables']['empresas']['Row'];

interface EmpresaData extends Empresa {
  vendedor: { id: string; nombre: string; email: string } | null;
  contactos: {
    id: string;
    nombre_completo: string;
    cargo: string | null;
    telefono: string | null;
    email: string | null;
    es_principal: boolean;
  }[];
  deals: {
    id: string;
    valor: number;
    fase_actual: string;
    resultado: 'ganado' | 'perdido' | null;
    cerrado_en: string | null;
    fecha_entrada_fase: string;
    created_at: string;
    fase: { nombre: string; tiempo_esperado: number | null } | null;
  }[];
}

interface EmpresaDetailClientProps {
  empresa: EmpresaData;
  userId: string;
  /** Phase 10 — custom field definitions for `entidad === 'empresa'`. */
  empresaCampos: CampoPersonalizado[];
}

export function EmpresaDetailClient({
  empresa,
  userId,
  empresaCampos,
}: EmpresaDetailClientProps) {
  const [timelineKey, setTimelineKey] = useState(0);
  const taskCalendarEnabled = useFeatureFlag('feat_empresa_task_cal');
  // The DB column is generic `Json`; narrow it once for the render loop.
  const camposValues = (empresa.campos_personalizados ?? {}) as CustomFieldsMap;

  const reloadTimeline = useCallback(() => {
    setTimelineKey((k) => k + 1);
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Back link */}
      <Link
        href="/pipeline"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al pipeline
      </Link>

      {/* Header */}
      <EmpresaHeader empresa={empresa} />

      <Separator />

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column — main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Quick actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Registrar actividad</CardTitle>
            </CardHeader>
            <CardContent>
              <EmpresaActions
                empresaId={empresa.id}
                onActivityCreated={reloadTimeline}
              />
            </CardContent>
          </Card>

          {/* Deals */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Oportunidades</CardTitle>
            </CardHeader>
            <CardContent>
              <EmpresaDeals deals={empresa.deals} />
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Historial</CardTitle>
            </CardHeader>
            <CardContent>
              <EmpresaTimeline
                key={timelineKey}
                empresaId={empresa.id}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right column — sidebar info */}
        <div className="space-y-6">
          {/* Tasks calendar */}
          {taskCalendarEnabled && (
            <Card className="gap-5 py-6">
              <CardHeader className="px-6 pb-3">
                <CardTitle className="text-sm">Tareas</CardTitle>
              </CardHeader>
              <CardContent className="px-6">
                <EmpresaTaskCalendar empresaId={empresa.id} userId={userId} />
              </CardContent>
            </Card>
          )}

          {/* Contacts */}
          <Card className="gap-5 py-6">
            <CardHeader className="px-6 pb-3">
              <CardTitle className="text-sm">Contactos</CardTitle>
            </CardHeader>
            <CardContent className="px-6">
              <EmpresaContacts contactos={empresa.contactos} />
            </CardContent>
          </Card>

          {/* Phase 10 — read-only custom fields. Skipped entirely when no
              definitions exist for `entidad === 'empresa'`. */}
          {empresaCampos.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Campos personalizados</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2 text-sm">
                  {empresaCampos.map((def) => (
                    <div key={def.id} className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">{def.etiqueta}</dt>
                      <dd className="text-right text-foreground">
                        {renderCampoValue(def, camposValues[def.clave] ?? null)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {empresa.notas_internas && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Notas internas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {empresa.notas_internas}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Description */}
          {empresa.descripcion && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Descripción</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {empresa.descripcion}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
