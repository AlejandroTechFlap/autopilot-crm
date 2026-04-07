'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Script } from '../types';

export function ScriptLibrary() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/scripts')
      .then((r) => r.json())
      .then((data) => setScripts(data.scripts ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  if (loading) {
    return <p className="text-xs text-muted-foreground">Cargando scripts...</p>;
  }

  if (scripts.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">No hay scripts disponibles.</p>
    );
  }

  return (
    <div className="space-y-1">
      {scripts.map((s) => {
        const expanded = expandedId === s.id;
        return (
          <div key={s.id} className="rounded-md border">
            <button
              type="button"
              onClick={() => toggle(s.id)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/50"
            >
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )}
              <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate font-medium">{s.titulo}</span>
              {s.fase && (
                <Badge variant="outline" className="ml-auto text-[10px]">
                  {s.fase.nombre}
                </Badge>
              )}
            </button>
            {expanded && (
              <div className="border-t px-3 py-2">
                <p className="whitespace-pre-wrap text-xs text-muted-foreground">
                  {s.contenido}
                </p>
                {s.tags && s.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {s.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
