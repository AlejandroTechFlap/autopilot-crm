'use client';

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Calendar, CalendarDayButton } from '@/components/ui/calendar';
import { CollapsibleSection } from './collapsible-section';
import { CreateTaskModal } from './create-task-modal';
import { TaskCard } from './task-card';
import type { Task } from '../types';

interface TaskCalendarPanelProps {
  tasks: Task[];
  loading: boolean;
  onComplete: (taskId: string) => void | Promise<void> | Promise<boolean>;
  onCreated?: () => void;
  userId: string;
  /** Optional — when set, the Nueva tarea modal prefills the empresa. */
  empresaId?: string;
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

/**
 * Presentational calendar + task buckets panel. Takes already-fetched tasks
 * and renders a month calendar with dots on days that have tasks, a
 * selected-day list, and overdue + no-date buckets. Does not own the task
 * data — parents pass `tasks`, `loading`, and an `onComplete` handler.
 *
 * Used on `/empresa/[id]` (scoped to one empresa) and on the cockpit sidebar
 * (scoped to the current vendedor across all empresas).
 */
export function TaskCalendarPanel({
  tasks,
  loading,
  onComplete,
  onCreated,
  userId,
  empresaId,
}: TaskCalendarPanelProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const [showCreate, setShowCreate] = useState(false);

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

  // Adapt onComplete to TaskCard's void-returning signature.
  const handleComplete = (taskId: string) => {
    void onComplete(taskId);
  };

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
              <TaskCard key={t.id} task={t} onComplete={handleComplete} />
            ))}
          </div>
        )}
      </div>

      {overdueTasks.length > 0 && (
        <div className="border-t pt-3">
          <CollapsibleSection
            storageKey="calendar-vencidas"
            title="Vencidas"
            count={overdueTasks.length}
            tone="danger"
            defaultOpen={false}
          >
            {overdueTasks.map((t) => (
              <TaskCard key={t.id} task={t} onComplete={handleComplete} />
            ))}
          </CollapsibleSection>
        </div>
      )}

      {tasksWithoutDate.length > 0 && (
        <div className="border-t pt-3">
          <CollapsibleSection
            storageKey="calendar-sin-fecha"
            title="Sin fecha"
            count={tasksWithoutDate.length}
            tone="muted"
            defaultOpen={false}
          >
            {tasksWithoutDate.map((t) => (
              <TaskCard key={t.id} task={t} onComplete={handleComplete} />
            ))}
          </CollapsibleSection>
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
        onCreated={onCreated}
      />
    </div>
  );
}
