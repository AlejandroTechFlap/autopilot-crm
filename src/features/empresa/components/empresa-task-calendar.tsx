'use client';

import { useCallback, useEffect, useState } from 'react';
import { TaskCalendarPanel } from '@/features/cockpit/components/task-calendar-panel';
import type { Task } from '@/features/cockpit/types';

interface EmpresaTaskCalendarProps {
  empresaId: string;
  userId: string;
}

/**
 * Empresa-scoped task calendar. Fetches this empresa's pending tasks and
 * renders them inside the shared `TaskCalendarPanel`. The `empresaId` is
 * forwarded to the panel so the "Nueva tarea" modal pre-scopes the new task
 * to this company.
 */
export function EmpresaTaskCalendar({
  empresaId,
  userId,
}: EmpresaTaskCalendarProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <TaskCalendarPanel
      tasks={tasks}
      loading={loading}
      onComplete={completeTask}
      onCreated={load}
      userId={userId}
      empresaId={empresaId}
    />
  );
}
