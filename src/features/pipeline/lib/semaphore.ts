/**
 * Semaphore (traffic light) calculation for deal cards.
 *
 * green:  <= 70% of tiempo_esperado
 * amber:  70-100% of tiempo_esperado
 * red:    > 100% (pulsing CSS animation)
 *
 * If tiempo_esperado is null (e.g., final "Cerrado" phase),
 * semaphore is always green.
 */

export type SemaphoreColor = 'green' | 'amber' | 'red';

export interface SemaphoreResult {
  color: SemaphoreColor;
  percentage: number;
  daysInPhase: number;
}

export function calculateSemaphore(
  fechaEntradaFase: string,
  tiempoEsperado: number | null,
  now: Date = new Date()
): SemaphoreResult {
  const entrada = new Date(fechaEntradaFase);
  const diffMs = now.getTime() - entrada.getTime();
  const daysInPhase = Math.max(0, Math.floor(diffMs / 86_400_000));

  if (tiempoEsperado === null || tiempoEsperado <= 0) {
    return { color: 'green', percentage: 0, daysInPhase };
  }

  const percentage = (daysInPhase / tiempoEsperado) * 100;

  let color: SemaphoreColor;
  if (percentage <= 70) {
    color = 'green';
  } else if (percentage <= 100) {
    color = 'amber';
  } else {
    color = 'red';
  }

  return { color, percentage: Math.round(percentage), daysInPhase };
}

export const SEMAPHORE_CLASSES: Record<SemaphoreColor, string> = {
  green: 'bg-semaphore-green',
  amber: 'bg-semaphore-amber',
  red: 'bg-semaphore-red semaphore-pulse',
};

export const SEMAPHORE_DOT_CLASSES: Record<SemaphoreColor, string> = {
  green: 'bg-success',
  amber: 'bg-warning',
  red: 'bg-danger semaphore-pulse',
};
