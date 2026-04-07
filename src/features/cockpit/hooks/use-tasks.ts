import { useCallback, useEffect, useState } from 'react';
import type { Task } from '../types';

interface UseTasksOptions {
  completada?: boolean;
}

export function useTasks(options: UseTasksOptions = {}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (options.completada !== undefined) {
        params.set('completada', String(options.completada));
      }

      const res = await fetch(`/api/tareas?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tareas ?? []);
        setCount(data.count ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [options.completada]);

  useEffect(() => {
    load();
  }, [load]);

  const completeTask = useCallback(
    async (taskId: string) => {
      const res = await fetch(`/api/tareas/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completada: true }),
      });

      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        setCount((c) => Math.max(0, c - 1));
        return true;
      }
      return false;
    },
    []
  );

  return { tasks, loading, count, refresh: load, completeTask };
}
