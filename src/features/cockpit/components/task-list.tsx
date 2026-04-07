'use client';

import { toast } from 'sonner';
import { TaskCard } from './task-card';
import type { Task } from '../types';

interface TaskListProps {
  tasks: Task[];
  loading: boolean;
  onComplete: (taskId: string) => Promise<boolean>;
}

function isOverdue(date: string | null): boolean {
  if (!date) return false;
  return new Date(date) < new Date(new Date().toDateString());
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

  const overdue = tasks.filter((t) => isOverdue(t.fecha_vencimiento));
  const alta = tasks.filter(
    (t) => t.prioridad === 'alta' && !isOverdue(t.fecha_vencimiento)
  );
  const normal = tasks.filter(
    (t) => t.prioridad !== 'alta' && !isOverdue(t.fecha_vencimiento)
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
        <TaskSection title="Vencidas" count={overdue.length} tasks={overdue} onComplete={handleComplete} />
      )}
      {alta.length > 0 && (
        <TaskSection title="Prioridad alta" count={alta.length} tasks={alta} onComplete={handleComplete} />
      )}
      {normal.length > 0 && (
        <TaskSection title="Otras" count={normal.length} tasks={normal} onComplete={handleComplete} />
      )}
    </div>
  );
}

function TaskSection({
  title,
  count,
  tasks,
  onComplete,
}: {
  title: string;
  count: number;
  tasks: Task[];
  onComplete: (taskId: string) => void;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium uppercase text-muted-foreground">
        {title} ({count})
      </h3>
      <div className="space-y-2">
        {tasks.map((t) => (
          <TaskCard key={t.id} task={t} onComplete={onComplete} />
        ))}
      </div>
    </div>
  );
}
