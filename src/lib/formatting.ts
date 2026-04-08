/**
 * Currency, date, and display formatting utilities.
 */

const currencyFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const currencyFormatterDecimals = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(value: number, decimals = false): string {
  return decimals
    ? currencyFormatterDecimals.format(value)
    : currencyFormatter.format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-ES').format(value);
}

/**
 * Parse a plain `YYYY-MM-DD` date string as LOCAL midnight.
 *
 * JS `new Date("2026-04-08")` parses as UTC midnight, which in negative-offset
 * timezones (e.g. America/Bogota, UTC-5) lands on the previous day when
 * rendered or compared against `new Date()`. This helper avoids that shift for
 * plain-date columns like `tareas.fecha_vencimiento`.
 */
function parsePlainDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function formatDate(date: string | Date): string {
  let d: Date;
  if (typeof date === 'string') {
    d = parsePlainDate(date) ?? new Date(date);
  } else {
    d = date;
  }
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Is a plain-date string strictly before today (local)?
 *
 * Used by the task list to flag `fecha_vencimiento < today` without the
 * UTC-parse shift described above. Returns `false` for null or same-day dates.
 */
export function isOverdueDate(date: string | null): boolean {
  if (!date) return false;
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return date < today;
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return 'ahora mismo';
  if (diffMins < 60) return `hace ${diffMins}m`;
  if (diffHours < 24) return `hace ${diffHours}h`;
  if (diffDays < 7) return `hace ${diffDays}d`;
  return formatDate(d);
}

export function daysBetween(from: string | Date, to: string | Date): number {
  const f = typeof from === 'string' ? new Date(from) : from;
  const t = typeof to === 'string' ? new Date(to) : to;
  return Math.floor((t.getTime() - f.getTime()) / 86_400_000);
}
