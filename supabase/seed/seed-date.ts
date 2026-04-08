/**
 * Single source of "now" for all seed files.
 *
 * Every date in the seed is derived from `SEED_TODAY` via the offset helpers
 * below. This keeps the demo state ("overdue", "today", "this month") aligned
 * with the real calendar no matter when `npm run seed` is run.
 *
 * For reproducible demos (e.g. screencasts), pin the anchor via env var:
 *   SEED_TODAY=2026-04-15 npm run seed
 */

const baseDate = process.env.SEED_TODAY
  ? new Date(process.env.SEED_TODAY)
  : new Date();

/** Anchored "today" — midnight local. All other dates are derived from this. */
export const SEED_TODAY = new Date(
  baseDate.getFullYear(),
  baseDate.getMonth(),
  baseDate.getDate(),
);

/** Returns an ISO timestamp `days` from SEED_TODAY at `hour:00:00` local. */
export function dayOffset(days: number, hour = 10): string {
  const d = new Date(SEED_TODAY);
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

/** Returns a `YYYY-MM-DD` date string `days` from SEED_TODAY (for date columns). */
export function dateOffset(days: number): string {
  const d = new Date(SEED_TODAY);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/** Returns a `YYYY-MM` period string `months` from SEED_TODAY (for comisiones). */
export function monthOffset(months: number): string {
  const d = new Date(SEED_TODAY);
  d.setMonth(d.getMonth() + months);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
