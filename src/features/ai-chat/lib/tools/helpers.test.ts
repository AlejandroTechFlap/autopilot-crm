import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  MAX_LIMIT,
  DEFAULT_LIMIT,
  MAX_TURNS,
  MAX_SCRIPT_CONTENT,
  clampLimit,
  buildFuzzyOr,
  buildFuzzyOrMulti,
  todayStartIso,
  monthStartIso,
  currentPeriodCode,
  parseRelativeDate,
  isToolError,
} from './helpers';

/* ===== Constants ===== */

describe('constants', () => {
  it('MAX_LIMIT is 20', () => expect(MAX_LIMIT).toBe(20));
  it('DEFAULT_LIMIT is 10', () => expect(DEFAULT_LIMIT).toBe(10));
  it('MAX_TURNS is 8', () => expect(MAX_TURNS).toBe(8));
  it('MAX_SCRIPT_CONTENT is 5000', () => expect(MAX_SCRIPT_CONTENT).toBe(5000));
});

/* ===== clampLimit ===== */

describe('clampLimit', () => {
  it.each([
    [undefined, DEFAULT_LIMIT],
    [0, DEFAULT_LIMIT],
    [-5, DEFAULT_LIMIT],
    [NaN, DEFAULT_LIMIT],
    [Infinity, DEFAULT_LIMIT],
    [1, 1],
    [10, 10],
    [20, 20],
    [25, 20],
    [7.9, 7],
  ] as const)('clampLimit(%s) → %d', (input, expected) => {
    expect(clampLimit(input as number | undefined)).toBe(expected);
  });
});

/* ===== buildFuzzyOr ===== */

describe('buildFuzzyOr', () => {
  it('builds single-term filter', () => {
    expect(buildFuzzyOr('nombre', 'Coca')).toBe('nombre.ilike.%Coca%');
  });

  it('builds multi-term filter', () => {
    const r = buildFuzzyOr('nombre', 'Coca Col');
    expect(r).toBe('nombre.ilike.%Coca%,nombre.ilike.%Col%');
  });

  it('drops single-char terms', () => {
    expect(buildFuzzyOr('nombre', 'a bb c dd')).toBe(
      'nombre.ilike.%bb%,nombre.ilike.%dd%'
    );
  });

  it('returns empty string for no usable terms', () => {
    expect(buildFuzzyOr('nombre', 'a b c')).toBe('');
  });

  it('returns empty string for empty input', () => {
    expect(buildFuzzyOr('nombre', '')).toBe('');
  });

  it('strips comma from terms', () => {
    const r = buildFuzzyOr('nombre', 'Coca,Cola');
    expect(r).not.toContain(',Cola');
    expect(r).toContain('CocaCola');
  });

  it('strips percent from terms', () => {
    const r = buildFuzzyOr('nombre', '100%done');
    expect(r).toContain('100done');
  });

  it('escapes single quotes', () => {
    const r = buildFuzzyOr('nombre', "O'Reilly");
    expect(r).toContain("O''Reilly");
  });
});

/* ===== buildFuzzyOrMulti ===== */

describe('buildFuzzyOrMulti', () => {
  it('matches across multiple columns', () => {
    const r = buildFuzzyOrMulti(['nombre', 'email'], 'test');
    expect(r).toBe('nombre.ilike.%test%,email.ilike.%test%');
  });

  it('returns empty string for empty query', () => {
    expect(buildFuzzyOrMulti(['a', 'b'], '')).toBe('');
  });
});

/* ===== Time-dependent functions ===== */

describe('time-dependent helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 12, 12, 0, 0)); // 2026-04-12 12:00
  });
  afterEach(() => vi.useRealTimers());

  it('todayStartIso starts with 2026-04-12', () => {
    expect(todayStartIso()).toContain('2026-04-12');
  });

  it('monthStartIso starts with 2026-04-01', () => {
    expect(monthStartIso()).toContain('2026-04-01');
  });

  it('currentPeriodCode returns "2026-04"', () => {
    expect(currentPeriodCode()).toBe('2026-04');
  });
});

/* ===== parseRelativeDate ===== */

describe('parseRelativeDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // 2026-04-12 is a Sunday
    vi.setSystemTime(new Date(2026, 3, 12, 12, 0, 0));
  });
  afterEach(() => vi.useRealTimers());

  it('"hoy" → today midnight', () => {
    const d = parseRelativeDate('hoy')!;
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(3); // April
    expect(d.getDate()).toBe(12);
    expect(d.getHours()).toBe(0);
  });

  it('"ayer" → yesterday midnight', () => {
    const d = parseRelativeDate('ayer')!;
    expect(d.getDate()).toBe(11);
  });

  it('"esta semana" on Sunday → previous Monday', () => {
    // Sunday offset = -6, so Monday = Apr 6
    const d = parseRelativeDate('esta semana')!;
    expect(d.getDate()).toBe(6);
    expect(d.getMonth()).toBe(3);
  });

  it('"esta semana" on Wednesday → current Monday', () => {
    vi.setSystemTime(new Date(2026, 3, 8, 12, 0, 0)); // Wednesday Apr 8
    const d = parseRelativeDate('esta semana')!;
    expect(d.getDate()).toBe(6); // Monday Apr 6
  });

  it('"este mes" → first of month', () => {
    const d = parseRelativeDate('este mes')!;
    expect(d.getDate()).toBe(1);
    expect(d.getMonth()).toBe(3);
  });

  it('"ultimo mes" → first of previous month', () => {
    const d = parseRelativeDate('ultimo mes')!;
    expect(d.getMonth()).toBe(2); // March
    expect(d.getDate()).toBe(1);
  });

  it('"mes pasado" → alias for ultimo mes', () => {
    const d = parseRelativeDate('mes pasado')!;
    expect(d.getMonth()).toBe(2);
  });

  it('"ultimos 7 dias" → 7 days before now', () => {
    const d = parseRelativeDate('ultimos 7 dias')!;
    const expected = new Date(2026, 3, 12, 12, 0, 0).getTime() - 7 * 86_400_000;
    expect(d.getTime()).toBe(expected);
  });

  it('"ultimos 30 dias"', () => {
    const d = parseRelativeDate('ultimos 30 dias')!;
    expect(d).not.toBeNull();
  });

  it('handles accented "último mes"', () => {
    const d = parseRelativeDate('último mes')!;
    expect(d.getMonth()).toBe(2);
  });

  it('returns null for unrecognised phrase', () => {
    expect(parseRelativeDate('next week')).toBeNull();
    expect(parseRelativeDate('random text')).toBeNull();
  });
});

/* ===== isToolError ===== */

describe('isToolError', () => {
  it('returns true for { error: string }', () => {
    expect(isToolError({ error: 'something failed' })).toBe(true);
  });

  it('returns false for { error: number }', () => {
    expect(isToolError({ error: 123 })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isToolError(null)).toBe(false);
  });

  it('returns false for plain string', () => {
    expect(isToolError('error')).toBe(false);
  });

  it('returns false for empty object', () => {
    expect(isToolError({})).toBe(false);
  });
});
