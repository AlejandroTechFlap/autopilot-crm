import { describe, it, expect } from 'vitest';
import { pendingConfirmation, isPendingConfirmation } from './write-tool';

describe('pendingConfirmation', () => {
  it('returns a confirmation_required envelope with the original input attached', () => {
    const result = pendingConfirmation({
      summary: 'Crear tarea "Llamar a Acme"',
      input: { titulo: 'Llamar a Acme', empresa_id: 'emp-1' },
    });
    expect(result.confirmation_required).toBe(true);
    expect(result.summary).toBe('Crear tarea "Llamar a Acme"');
    expect(result.input).toEqual({ titulo: 'Llamar a Acme', empresa_id: 'emp-1' });
  });
});

describe('isPendingConfirmation', () => {
  it('true for a real pendingConfirmation result', () => {
    const result = pendingConfirmation({ summary: 's', input: {} });
    expect(isPendingConfirmation(result)).toBe(true);
  });

  it('false for a read-tool result (no confirmation flag)', () => {
    expect(isPendingConfirmation({ empresas: [], count: 0 })).toBe(false);
  });

  it('false for null / undefined / primitives', () => {
    expect(isPendingConfirmation(null)).toBe(false);
    expect(isPendingConfirmation(undefined)).toBe(false);
    expect(isPendingConfirmation('confirmation_required')).toBe(false);
  });

  it('false when confirmation_required is not literally true', () => {
    expect(isPendingConfirmation({ confirmation_required: 'yes' })).toBe(false);
    expect(isPendingConfirmation({ confirmation_required: 1 })).toBe(false);
  });
});
