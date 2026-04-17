'use client';

import { toast } from 'sonner';
import { isOverdueDate } from '@/lib/formatting';
import { CollapsibleSection } from './collapsible-section';
import { TaskCard } from './task-card';
import type { Task } from '../types';

interface TaskListProps {
  tasks: Task[];
  loading: boolean;
  onComplete: (taskId: string) => Promise<boolean>;
}

export function TaskList({ tasks, loading, onComplete }: TaskListProps) {
  if (loading) {
    return <p className="text-sm text-muted-foreground">Cargando tareas...</p>;
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm font-medium text-foreground">¡Todo al día!</p>
        <p className="mt-1 text-xs text-muted-foreground">
          No tienes tareas pendientes ahora mismo.
        </p>
      </div>
    );
  }

  const overdue = tasks.filter((t) => isOverdueDate(t.fecha_vencimiento));
  const alta = tasks.filter(
    (t) => t.prioridad === 'alta' && !isOverdueDate(t.fecha_vencimiento)
  );
  const normal = tasks.filter(
    (t) => t.prioridad !== 'alta' && !isOverdueDate(t.fecha_vencimiento)
  );

  const handleComplete = async (taskId: string) => {
    const ok = await onComplete(taskId);
    if (ok) {
      toast.success('Tarea completada');
    } else {
      toast.error('No se ha podido completar la tarea');
    }
  };

  return (
    <div className="space-y-6">
      {overdue.length > 0 && (
        <CollapsibleSection
          storageKey="list-vencidas"
          title="Vencidas"
          count={overdue.length}
          tone="danger"
          defaultOpen={false}
        >
          {overdue.map((t) => (
            <TaskCard key={t.id} task={t} onComplete={handleComplete} />
          ))}
        </CollapsibleSection>
      )}
      {alta.length > 0 && (
        <CollapsibleSection
          storageKey="list-alta"
          title="Prioridad alta"
          count={alta.length}
          defaultOpen
        >
          {alta.map((t) => (
            <TaskCard key={t.id} task={t} onComplete={handleComplete} />
          ))}
        </CollapsibleSection>
      )}
      {normal.length > 0 && (
        <CollapsibleSection
          storageKey="list-otras"
          title="Otras"
          count={normal.length}
          tone="muted"
          defaultOpen
        >
          {normal.map((t) => (
            <TaskCard key={t.id} task={t} onComplete={handleComplete} />
          ))}
        </CollapsibleSection>
      )}
    </div>
  );
}
