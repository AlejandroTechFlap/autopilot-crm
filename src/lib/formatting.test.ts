import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatCurrency,
  formatNumber,
  formatDate,
  isOverdueDate,
  formatDateTime,
  formatRelativeTime,
  daysBetween,
} from './formatting';

describe('formatCurrency', () => {
  it('formats integer without decimals', () => {
    const r = formatCurrency(1000);
    expect(r).toContain('1000');
    expect(r).toContain('€');
  });

  it('formats large integer with thousands separator', () => {
    const r = formatCurrency(1000000);
    expect(r).toContain('1.000.000');
    expect(r).toContain('€');
  });

  it('formats with decimals when requested', () => {
    const r = formatCurrency(1000.5, true);
    expect(r).toContain('1000');
    expect(r).toContain('50');
    expect(r).toContain('€');
  });

  it('formats zero', () => {
    const r = formatCurrency(0);
    expect(r).toContain('0');
    expect(r).toContain('€');
  });

  it('formats negative value', () => {
    const r = formatCurrency(-500);
    expect(r).toContain('500');
    expect(r).toContain('€');
  });
});

describe('formatNumber', () => {
  it('formats large number with es-ES separators', () => {
    expect(formatNumber(1000000)).toContain('1.000.000');
  });

  it('formats decimal number', () => {
    const r = formatNumber(1234.56);
    expect(r).toContain('1234');
    expect(r).toContain('56');
  });
});

describe('formatDate', () => {
  it('formats YYYY-MM-DD string as local date', () => {
    const r = formatDate('2026-04-08');
    // es-ES format: "08 abr 2026" or similar
    expect(r).toContain('2026');
    expect(r).toContain('08');
  });

  it('formats Date object', () => {
    const r = formatDate(new Date(2026, 3, 8)); // April 8
    expect(r).toContain('2026');
  });

  it('handles ISO datetime string', () => {
    const r = formatDate('2026-04-08T15:30:00Z');
    expect(r).toContain('2026');
  });
});

describe('isOverdueDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 12, 12, 0, 0)); // 2026-04-12
  });
  afterEach(() => vi.useRealTimers());

  it('returns false for null', () => {
    expect(isOverdueDate(null)).toBe(false);
  });

  it('returns false for today', () => {
    expect(isOverdueDate('2026-04-12')).toBe(false);
  });

  it('returns true for yesterday', () => {
    expect(isOverdueDate('2026-04-11')).toBe(true);
  });

  it('returns false for tomorrow', () => {
    expect(isOverdueDate('2026-04-13')).toBe(false);
  });

  it('returns true for past date', () => {
    expect(isOverdueDate('2025-12-31')).toBe(true);
  });
});

describe('formatDateTime', () => {
  it('formats ISO string with date and time', () => {
    const r = formatDateTime('2026-04-08T15:30:00');
    expect(r).toContain('2026');
    expect(r).toContain('08');
  });

  it('formats Date object', () => {
    const r = formatDateTime(new Date(2026, 3, 8, 15, 30));
    expect(r).toContain('2026');
  });
});

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 12, 12, 0, 0)); // 2026-04-12 12:00
  });
  afterEach(() => vi.useRealTimers());

  it('returns "ahora mismo" for < 1 min ago', () => {
    const d = new Date(2026, 3, 12, 11, 59, 30); // 30s ago
    expect(formatRelativeTime(d)).toBe('ahora mismo');
  });

  it('returns "hace Xm" for minutes ago', () => {
    const d = new Date(2026, 3, 12, 11, 30, 0); // 30min ago
    expect(formatRelativeTime(d)).toBe('hace 30m');
  });

  it('returns "hace Xh" for hours ago', () => {
    const d = new Date(2026, 3, 12, 7, 0, 0); // 5h ago
    expect(formatRelativeTime(d)).toBe('hace 5h');
  });

  it('returns "hace Xd" for days ago', () => {
    const d = new Date(2026, 3, 9, 12, 0, 0); // 3 days ago
    expect(formatRelativeTime(d)).toBe('hace 3d');
  });

  it('falls back to formatDate for > 7 days', () => {
    const d = new Date(2026, 2, 1, 12, 0, 0); // March 1 (42 days ago)
    const r = formatRelativeTime(d);
    expect(r).toContain('2026');
  });
});

describe('daysBetween', () => {
  it('returns positive for forward range', () => {
    expect(daysBetween('2026-04-01', '2026-04-08')).toBe(7);
  });

  it('returns 0 for same date', () => {
    expect(daysBetween(new Date(2026, 3, 1), new Date(2026, 3, 1))).toBe(0);
  });

  it('returns negative when to < from', () => {
    expect(daysBetween('2026-04-08', '2026-04-01')).toBe(-7);
  });

  it('works with Date objects', () => {
    const f = new Date(2026, 0, 1);
    const t = new Date(2026, 0, 11);
    expect(daysBetween(f, t)).toBe(10);
  });
});
