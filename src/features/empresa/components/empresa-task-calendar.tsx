'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Calendar, CalendarDayButton } from '@/components/ui/calendar';
import { CreateTaskModal } from '@/features/cockpit/components/create-task-modal';
import { TaskCard } from '@/features/cockpit/components/task-card';
import type { Task } from '@/features/cockpit/types';

interface EmpresaTaskCalendarProps {
  empresaId: string;
  userId: string;
}

/**
 * Local-time YYYY-MM-DD key. Avoids timezone shifts that would happen with
 * Date.prototype.toISOString() (which uses UTC).
 */
function toDateKey(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse 'YYYY-MM-DD' as a local-time date so day boundaries match the UI. */
function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function startOfToday(): Date {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}

export function EmpresaTaskCalendar({
  empresaId,
  userId,
}: EmpresaTaskCalendarProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/tareas?empresa_id=${empresaId}&completada=false&limit=100`
      );
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tareas ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    load();
  }, [load]);

  const completeTask = useCallback(async (taskId: string) => {
    const res = await fetch(`/api/tareas/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completada: true }),
    });
    if (res.ok) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    }
  }, []);

  // Group tasks by their due-date key for O(1) day lookups.
  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      if (!t.fecha_vencimiento) continue;
      const key = toDateKey(t.fecha_vencimiento);
      const arr = map.get(key) ?? [];
      arr.push(t);
      map.set(key, arr);
    }
    return map;
  }, [tasks]);

  const datesWithTasks = useMemo(
    () => Array.from(tasksByDay.keys()).map(parseLocalDate),
    [tasksByDay]
  );

  const selectedKey = toDateKey(selectedDate);
  const selectedDayTasks = tasksByDay.get(selectedKey) ?? [];

  // Overdue tasks not already shown in the selected-day list.
  const today = startOfToday();
  const overdueTasks = useMemo(
    () =>
      tasks.filter((t) => {
        if (!t.fecha_vencimiento) return false;
        const due = parseLocalDate(t.fecha_vencimiento);
        return due < today && toDateKey(t.fecha_vencimiento) !== selectedKey;
      }),
    [tasks, selectedKey, today]
  );

  const tasksWithoutDate = useMemo(
    () => tasks.filter((t) => !t.fecha_vencimiento),
    [tasks]
  );

  return (
    <div className="space-y-3">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={(d) => d && setSelectedDate(d)}
        locale={es}
        showOutsideDays
        modifiers={{ hasTasks: datesWithTasks }}
        components={{
          DayButton: (props) => {
            const hasTask = Boolean(
              (props.modifiers as Record<string, boolean> | undefined)?.hasTasks
            );
            return (
              <span className="relative inline-flex h-full w-full">
                <CalendarDayButton {...props} />
                {hasTask && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute bottom-0.5 left-1/2 z-20 h-1 w-1 -translate-x-1/2 rounded-full bg-primary group-data-[selected=true]/day:bg-primary-foreground"
                  />
                )}
              </span>
            );
          },
        }}
        className="!w-full"
      />

      <div className="space-y-2 border-t pt-3">
        <p className="text-xs font-medium">
          {selectedDate.toLocaleDateString('es-ES', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          })}{' '}
          <span className="text-muted-foreground">
            ({selectedDayTasks.length})
          </span>
        </p>

        {loading ? (
          <p className="text-xs text-muted-foreground">Cargando tareas...</p>
        ) : selectedDayTasks.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Sin tareas para este día.
          </p>
        ) : (
          <div className="space-y-1.5">
            {selectedDayTasks.map((t) => (
              <TaskCard key={t.id} task={t} onComplete={completeTask} />
            ))}
          </div>
        )}
      </div>

      {overdueTasks.length > 0 && (
        <div className="space-y-2 border-t pt-3">
          <p className="text-xs font-medium text-danger">
            Vencidas ({overdueTasks.length})
          </p>
          <div className="space-y-1.5">
            {overdueTasks.map((t) => (
              <TaskCard key={t.id} task={t} onComplete={completeTask} />
            ))}
          </div>
        </div>
      )}

      {tasksWithoutDate.length > 0 && (
        <div className="space-y-2 border-t pt-3">
          <p className="text-xs font-medium text-muted-foreground">
            Sin fecha ({tasksWithoutDate.length})
          </p>
          <div className="space-y-1.5">
            {tasksWithoutDate.map((t) => (
              <TaskCard key={t.id} task={t} onComplete={completeTask} />
            ))}
          </div>
        </div>
      )}

      <Button
        size="sm"
        variant="outline"
        className="w-full gap-1.5"
        onClick={() => setShowCreate(true)}
      >
        <Plus className="h-4 w-4" />
        Nueva tarea
      </Button>

      <CreateTaskModal
        userId={userId}
        empresaId={empresaId}
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={load}
      />
    </div>
  );
}
