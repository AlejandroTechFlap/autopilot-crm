'use client';

import { useMemo, useState } from 'react';
import { isOverdueDate } from '@/lib/formatting';
import type { Task } from '../types';

export type TaskStateFilter =
  | 'todas'
  | 'vencidas'
  | 'hoy'
  | 'proximas'
  | 'sin-fecha';

export type TaskPrioridadFilter = 'todas' | 'alta' | 'media' | 'baja';

export interface TaskFilters {
  search: string;
  estado: TaskStateFilter;
  prioridad: TaskPrioridadFilter;
  empresaId: string | 'todas';
}

const INITIAL: TaskFilters = {
  search: '',
  estado: 'todas',
  prioridad: 'todas',
  empresaId: 'todas',
};

function isToday(isoDate: string): boolean {
  const d = new Date(isoDate);
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

function isUpcoming(isoDate: string): boolean {
  const d = new Date(isoDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next = new Date(today);
  next.setDate(next.getDate() + 1);
  return d >= next;
}

export function useTaskFilters(tasks: Task[]) {
  const [filters, setFilters] = useState<TaskFilters>(INITIAL);

  const empresaOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const t of tasks) {
      if (t.empresa && !seen.has(t.empresa.id)) {
        seen.set(t.empresa.id, t.empresa.nombre);
      }
    }
    return Array.from(seen, ([id, nombre]) => ({ id, nombre })).sort((a, b) =>
      a.nombre.localeCompare(b.nombre, 'es')
    );
  }, [tasks]);

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return tasks
      .filter((t) => {
        if (q) {
          const haystack = [
            t.titulo,
            t.descripcion ?? '',
            t.empresa?.nombre ?? '',
          ]
            .join(' ')
            .toLowerCase();
          if (!haystack.includes(q)) return false;
        }

        if (filters.prioridad !== 'todas' && t.prioridad !== filters.prioridad) {
          return false;
        }

        if (filters.empresaId !== 'todas' && t.empresa?.id !== filters.empresaId) {
          return false;
        }

        switch (filters.estado) {
          case 'vencidas':
            if (!isOverdueDate(t.fecha_vencimiento)) return false;
            break;
          case 'hoy':
            if (!t.fecha_vencimiento || !isToday(t.fecha_vencimiento)) return false;
            break;
          case 'proximas':
            if (!t.fecha_vencimiento || !isUpcoming(t.fecha_vencimiento)) return false;
            break;
          case 'sin-fecha':
            if (t.fecha_vencimiento) return false;
            break;
        }

        return true;
      })
      .sort((a, b) => {
        const aD = a.fecha_vencimiento;
        const bD = b.fecha_vencimiento;
        if (!aD && !bD) return 0;
        if (!aD) return 1;
        if (!bD) return -1;
        return aD.localeCompare(bD);
      });
  }, [tasks, filters]);

  const reset = () => setFilters(INITIAL);
  const hasActiveFilters =
    filters.search.trim() !== '' ||
    filters.estado !== 'todas' ||
    filters.prioridad !== 'todas' ||
    filters.empresaId !== 'todas';

  return {
    filters,
    setFilters,
    filtered,
    empresaOptions,
    reset,
    hasActiveFilters,
  };
}
