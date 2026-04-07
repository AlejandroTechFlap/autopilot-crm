'use client';

import Link from 'next/link';
import { CheckCircle2, AlertTriangle, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PRIORIDAD_LABELS, PRIORIDAD_COLORS } from '@/lib/constants';
import { formatCurrency, formatDate } from '@/lib/formatting';
import type { Task } from '../types';

interface TaskCardProps {
  task: Task;
  onComplete: (taskId: string) => void;
}

function isOverdue(date: string | null): boolean {
  if (!date) return false;
  return new Date(date) < new Date(new Date().toDateString());
}

export function TaskCard({ task, onComplete }: TaskCardProps) {
  const overdue = isOverdue(task.fecha_vencimiento);

  return (
    <Card className={overdue ? 'border-danger/30 bg-danger-light/30' : ''}>
      <CardContent className="flex items-start gap-3 py-3">
        {/* Checkbox */}
        <button
          type="button"
          onClick={() => onComplete(task.id)}
          className="mt-0.5 shrink-0 text-muted-foreground hover:text-success transition-colors"
          aria-label="Completar tarea"
        >
          <CheckCircle2 className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{task.titulo}</span>
            <Badge
              variant="secondary"
              className={`text-[10px] ${PRIORIDAD_COLORS[task.prioridad]}`}
            >
              {PRIORIDAD_LABELS[task.prioridad]}
            </Badge>
            {task.origen === 'sistema' && (
              <Badge variant="outline" className="text-[10px]">
                Auto
              </Badge>
            )}
          </div>

          {task.descripcion && (
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
              {task.descripcion}
            </p>
          )}

          <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
            {task.empresa && (
              <Link
                href={`/empresa/${task.empresa.id}`}
                className="hover:text-foreground"
              >
                {task.empresa.nombre}
              </Link>
            )}
            {task.deal && (
              <span>{formatCurrency(task.deal.valor)}</span>
            )}
            {task.fecha_vencimiento && (
              <span className={`flex items-center gap-1 ${overdue ? 'text-danger font-medium' : ''}`}>
                {overdue && <AlertTriangle className="h-3 w-3" />}
                <Calendar className="h-3 w-3" />
                {formatDate(task.fecha_vencimiento)}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
