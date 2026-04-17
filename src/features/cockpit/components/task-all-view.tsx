'use client';

import { toast } from 'sonner';
import { TaskCard } from './task-card';
import { TaskFilters } from './task-filters';
import { useTaskFilters } from '../hooks/use-task-filters';
import type { Task } from '../types';

interface TaskAllViewProps {
  tasks: Task[];
  loading: boolean;
  onComplete: (taskId: string) => Promise<boolean>;
}

/**
 * Flat, fully filterable view of every task assigned to the current vendedor.
 * Exists alongside `Lista` / `Calendario` tabs on `/mis-tareas`. Pattern: HubSpot
 * "All tasks" + Linear filter bar — search + estado + prioridad + empresa.
 */
export function TaskAllView({ tasks, loading, onComplete }: TaskAllViewProps) {
  const {
    filters,
    setFilters,
    filtered,
    empresaOptions,
    reset,
    hasActiveFilters,
  } = useTaskFilters(tasks);

  const handleComplete = async (taskId: string) => {
    const ok = await onComplete(taskId);
    if (ok) toast.success('Tarea completada');
    else toast.error('No se ha podido completar la tarea');
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Cargando tareas...</p>;
  }

  return (
    <div className="space-y-4">
      <TaskFilters
        filters={filters}
        onChange={setFilters}
        empresaOptions={empresaOptions}
        hasActiveFilters={hasActiveFilters}
        onReset={reset}
      />

      <p className="text-xs text-muted-foreground tabular-nums">
        {filtered.length} de {tasks.length}{' '}
        {tasks.length === 1 ? 'tarea' : 'tareas'}
      </p>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm font-medium text-foreground">
            {tasks.length === 0 ? '¡Todo al día!' : 'Sin resultados'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {tasks.length === 0
              ? 'No tienes tareas pendientes ahora mismo.'
              : 'Ajusta los filtros para ver más tareas.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <TaskCard key={t.id} task={t} onComplete={handleComplete} />
          ))}
        </div>
      )}
    </div>
  );
}
