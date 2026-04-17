'use client';

import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  TaskFilters as Filters,
  TaskPrioridadFilter,
  TaskStateFilter,
} from '../hooks/use-task-filters';

interface TaskFiltersProps {
  filters: Filters;
  onChange: (next: Filters) => void;
  empresaOptions: Array<{ id: string; nombre: string }>;
  hasActiveFilters: boolean;
  onReset: () => void;
}

function handleSelectChange<T extends string>(
  onChoose: (v: T) => void,
  fallback: T
): (value: string | null) => void {
  return (value) => onChoose((value ?? fallback) as T);
}

export function TaskFilters({
  filters,
  onChange,
  empresaOptions,
  hasActiveFilters,
  onReset,
}: TaskFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[200px] flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Buscar tareas, empresas..."
          className="pl-8"
        />
      </div>

      <Select
        value={filters.estado}
        onValueChange={handleSelectChange<TaskStateFilter>(
          (v) => onChange({ ...filters, estado: v }),
          'todas'
        )}
      >
        <SelectTrigger size="sm" className="min-w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Estado: todas</SelectItem>
          <SelectItem value="vencidas">Vencidas</SelectItem>
          <SelectItem value="hoy">Hoy</SelectItem>
          <SelectItem value="proximas">Próximas</SelectItem>
          <SelectItem value="sin-fecha">Sin fecha</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.prioridad}
        onValueChange={handleSelectChange<TaskPrioridadFilter>(
          (v) => onChange({ ...filters, prioridad: v }),
          'todas'
        )}
      >
        <SelectTrigger size="sm" className="min-w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Prioridad: todas</SelectItem>
          <SelectItem value="alta">Alta</SelectItem>
          <SelectItem value="media">Media</SelectItem>
          <SelectItem value="baja">Baja</SelectItem>
        </SelectContent>
      </Select>

      {empresaOptions.length > 0 && (
        <Select
          value={filters.empresaId}
          onValueChange={handleSelectChange<string>(
            (v) => onChange({ ...filters, empresaId: v as Filters['empresaId'] }),
            'todas'
          )}
        >
          <SelectTrigger size="sm" className="min-w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Empresa: todas</SelectItem>
            {empresaOptions.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 text-xs text-muted-foreground"
          onClick={onReset}
        >
          <X className="h-3 w-3" />
          Limpiar filtros
        </Button>
      )}
    </div>
  );
}
