import { describe, it, expect } from 'vitest';
import {
  validateCampoValue,
  validateCamposPersonalizados,
  renderCampoValue,
} from './custom-fields';
import type { CampoPersonalizado } from '../types';
import { makeCampo } from './custom-fields.test';

/* ===== validateCampoValue ===== */

describe('validateCampoValue', () => {
  describe('required field, empty value', () => {
    const def = makeCampo({ obligatorio: true, etiqueta: 'Nombre' });

    it('returns error for null', () => {
      expect(validateCampoValue(def, null)).toContain('Nombre');
    });

    it('returns error for empty string', () => {
      expect(validateCampoValue(def, '')).toContain('obligatorio');
    });
  });

  describe('optional field, empty value', () => {
    const def = makeCampo({ obligatorio: false });

    it('returns null for null value', () => {
      expect(validateCampoValue(def, null)).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(validateCampoValue(def, '')).toBeNull();
    });
  });

  describe('tipo: texto', () => {
    const def = makeCampo({ tipo: 'texto' as CampoPersonalizado['tipo'] });

    it('accepts string', () => {
      expect(validateCampoValue(def, 'hello')).toBeNull();
    });

    it('rejects number', () => {
      expect(validateCampoValue(def, 42)).toContain('texto');
    });
  });

  describe('tipo: numero', () => {
    const def = makeCampo({ tipo: 'numero' as CampoPersonalizado['tipo'] });

    it('accepts number', () => {
      expect(validateCampoValue(def, 42.5)).toBeNull();
    });

    it('rejects NaN', () => {
      expect(validateCampoValue(def, NaN)).toContain('número');
    });

    it('rejects string', () => {
      expect(validateCampoValue(def, '42')).toContain('número');
    });
  });

  describe('tipo: booleano', () => {
    const def = makeCampo({ tipo: 'booleano' as CampoPersonalizado['tipo'] });

    it('accepts true', () => {
      expect(validateCampoValue(def, true)).toBeNull();
    });

    it('accepts false', () => {
      expect(validateCampoValue(def, false)).toBeNull();
    });

    it('rejects string "true"', () => {
      expect(validateCampoValue(def, 'true')).toContain('sí/no');
    });
  });

  describe('tipo: fecha', () => {
    const def = makeCampo({ tipo: 'fecha' as CampoPersonalizado['tipo'] });

    it('accepts valid ISO date string', () => {
      expect(validateCampoValue(def, '2026-04-12')).toBeNull();
    });

    it('rejects invalid date string', () => {
      expect(validateCampoValue(def, 'not-a-date')).toContain('fecha');
    });
  });

  describe('tipo: seleccion', () => {
    const def = makeCampo({
      tipo: 'seleccion' as CampoPersonalizado['tipo'],
      opciones: ['Tech', 'Finance', 'Health'],
    });

    it('accepts valid option', () => {
      expect(validateCampoValue(def, 'Tech')).toBeNull();
    });

    it('rejects invalid option', () => {
      expect(validateCampoValue(def, 'Other')).toContain('opción inválida');
    });

    it('rejects non-string', () => {
      expect(validateCampoValue(def, 42)).toContain('opción');
    });
  });
});

/* ===== validateCamposPersonalizados ===== */

describe('validateCamposPersonalizados', () => {
  const defs: CampoPersonalizado[] = [
    makeCampo({ clave: 'sector', tipo: 'texto' as CampoPersonalizado['tipo'], obligatorio: true }),
    makeCampo({ clave: 'score', tipo: 'numero' as CampoPersonalizado['tipo'], obligatorio: false }),
  ];

  it('returns ok with sanitized map for valid values', () => {
    const r = validateCamposPersonalizados(defs, { sector: 'Tech', score: 95 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.sanitized).toEqual({ sector: 'Tech', score: 95 });
    }
  });

  it('strips empty optional values from sanitized', () => {
    const r = validateCamposPersonalizados(defs, { sector: 'Tech', score: null });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.sanitized).toEqual({ sector: 'Tech' });
      expect('score' in r.sanitized).toBe(false);
    }
  });

  it('strips unknown keys (not in defs)', () => {
    const r = validateCamposPersonalizados(defs, {
      sector: 'Tech',
      score: 10,
      unknown_key: 'val',
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect('unknown_key' in r.sanitized).toBe(false);
    }
  });

  it('returns errors for required fields missing', () => {
    const r = validateCamposPersonalizados(defs, { score: 10 });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.sector).toBeDefined();
    }
  });

  it('accumulates multiple errors', () => {
    const allRequired: CampoPersonalizado[] = [
      makeCampo({ clave: 'a', obligatorio: true }),
      makeCampo({ clave: 'b', tipo: 'numero' as CampoPersonalizado['tipo'], obligatorio: true }),
    ];
    const r = validateCamposPersonalizados(allRequired, {});
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(Object.keys(r.errors).length).toBe(2);
    }
  });
});

/* ===== renderCampoValue ===== */

describe('renderCampoValue', () => {
  it('returns em-dash for null', () => {
    expect(renderCampoValue(makeCampo(), null)).toBe('—');
  });

  it('returns em-dash for empty string', () => {
    expect(renderCampoValue(makeCampo(), '')).toBe('—');
  });

  it('returns string for texto type', () => {
    const def = makeCampo({ tipo: 'texto' as CampoPersonalizado['tipo'] });
    expect(renderCampoValue(def, 'hello')).toBe('hello');
  });

  it('returns string for seleccion type', () => {
    const def = makeCampo({ tipo: 'seleccion' as CampoPersonalizado['tipo'] });
    expect(renderCampoValue(def, 'Tech')).toBe('Tech');
  });

  it('formats number with es-ES locale', () => {
    const def = makeCampo({ tipo: 'numero' as CampoPersonalizado['tipo'] });
    const r = renderCampoValue(def, 1234.5);
    expect(r).toContain('1234');
  });

  it('returns "Sí" for boolean true', () => {
    const def = makeCampo({ tipo: 'booleano' as CampoPersonalizado['tipo'] });
    expect(renderCampoValue(def, true)).toBe('Sí');
  });

  it('returns "No" for boolean false', () => {
    const def = makeCampo({ tipo: 'booleano' as CampoPersonalizado['tipo'] });
    expect(renderCampoValue(def, false)).toBe('No');
  });

  it('formats valid date with es-ES locale', () => {
    const def = makeCampo({ tipo: 'fecha' as CampoPersonalizado['tipo'] });
    const r = renderCampoValue(def, '2026-04-12');
    expect(r).toContain('2026');
  });

  it('returns "Invalid Date" for unparseable date string', () => {
    const def = makeCampo({ tipo: 'fecha' as CampoPersonalizado['tipo'] });
    // toLocaleDateString on an invalid Date doesn't throw — returns 'Invalid Date'
    expect(renderCampoValue(def, 'bad-date')).toBe('Invalid Date');
  });
});
