import { describe, it, expect } from 'vitest';
import { CreateCampoSchema, UpdateCampoSchema } from './schemas';

/* ===== CreateCampoSchema ===== */

describe('CreateCampoSchema', () => {
  const validBase = {
    entidad: 'empresa',
    clave: 'sector',
    etiqueta: 'Sector',
    tipo: 'texto',
  };

  describe('valid inputs', () => {
    it('accepts minimal valid payload (non-seleccion)', () => {
      expect(CreateCampoSchema.safeParse(validBase).success).toBe(true);
    });

    it('accepts seleccion with opciones', () => {
      const r = CreateCampoSchema.safeParse({
        ...validBase,
        tipo: 'seleccion',
        opciones: ['A', 'B'],
      });
      expect(r.success).toBe(true);
    });

    it('accepts optional orden and obligatorio', () => {
      const r = CreateCampoSchema.safeParse({
        ...validBase,
        orden: 5,
        obligatorio: true,
      });
      expect(r.success).toBe(true);
    });

    it('accepts all valid entidad values', () => {
      for (const e of ['empresa', 'contacto', 'deal']) {
        expect(
          CreateCampoSchema.safeParse({ ...validBase, entidad: e }).success
        ).toBe(true);
      }
    });

    it('accepts all valid tipo values (non-seleccion)', () => {
      for (const t of ['texto', 'numero', 'fecha', 'booleano']) {
        expect(
          CreateCampoSchema.safeParse({ ...validBase, tipo: t }).success
        ).toBe(true);
      }
    });
  });

  describe('invalid inputs', () => {
    it('rejects missing entidad', () => {
      const { entidad: _, ...rest } = validBase;
      expect(CreateCampoSchema.safeParse(rest).success).toBe(false);
    });

    it('rejects clave starting with digit', () => {
      const r = CreateCampoSchema.safeParse({ ...validBase, clave: '1invalid' });
      expect(r.success).toBe(false);
    });

    it('rejects clave with uppercase', () => {
      const r = CreateCampoSchema.safeParse({ ...validBase, clave: 'Sector' });
      expect(r.success).toBe(false);
    });

    it('rejects clave > 40 chars', () => {
      const r = CreateCampoSchema.safeParse({
        ...validBase,
        clave: 'a'.repeat(41),
      });
      expect(r.success).toBe(false);
    });

    it('rejects seleccion without opciones (refine rule)', () => {
      const r = CreateCampoSchema.safeParse({
        ...validBase,
        tipo: 'seleccion',
      });
      expect(r.success).toBe(false);
    });

    it('rejects seleccion with empty opciones', () => {
      const r = CreateCampoSchema.safeParse({
        ...validBase,
        tipo: 'seleccion',
        opciones: [],
      });
      expect(r.success).toBe(false);
    });

    it('rejects extra unknown field (strict)', () => {
      const r = CreateCampoSchema.safeParse({
        ...validBase,
        unknown_field: 'x',
      });
      expect(r.success).toBe(false);
    });

    it('rejects empty string in opciones', () => {
      const r = CreateCampoSchema.safeParse({
        ...validBase,
        tipo: 'seleccion',
        opciones: [''],
      });
      expect(r.success).toBe(false);
    });

    it('rejects opciones > 50 items', () => {
      const r = CreateCampoSchema.safeParse({
        ...validBase,
        tipo: 'seleccion',
        opciones: Array.from({ length: 51 }, (_, i) => `opt${i}`),
      });
      expect(r.success).toBe(false);
    });

    it('rejects orden < 0', () => {
      const r = CreateCampoSchema.safeParse({ ...validBase, orden: -1 });
      expect(r.success).toBe(false);
    });

    it('rejects orden > 999', () => {
      const r = CreateCampoSchema.safeParse({ ...validBase, orden: 1000 });
      expect(r.success).toBe(false);
    });

    it('rejects invalid entidad', () => {
      const r = CreateCampoSchema.safeParse({ ...validBase, entidad: 'tarea' });
      expect(r.success).toBe(false);
    });
  });
});

/* ===== UpdateCampoSchema ===== */

describe('UpdateCampoSchema', () => {
  it('accepts empty object (all optional)', () => {
    expect(UpdateCampoSchema.safeParse({}).success).toBe(true);
  });

  it('accepts only etiqueta', () => {
    expect(
      UpdateCampoSchema.safeParse({ etiqueta: 'New Label' }).success
    ).toBe(true);
  });

  it('accepts opciones: null (nullable)', () => {
    expect(
      UpdateCampoSchema.safeParse({ opciones: null }).success
    ).toBe(true);
  });

  it('rejects opciones: [] (min 1 when non-null)', () => {
    expect(
      UpdateCampoSchema.safeParse({ opciones: [] }).success
    ).toBe(false);
  });

  it('rejects unknown tipo value', () => {
    expect(
      UpdateCampoSchema.safeParse({ tipo: 'unknown' }).success
    ).toBe(false);
  });

  it('rejects extra field like clave (strict)', () => {
    expect(
      UpdateCampoSchema.safeParse({ clave: 'test' }).success
    ).toBe(false);
  });

  it('rejects extra field like entidad (strict)', () => {
    expect(
      UpdateCampoSchema.safeParse({ entidad: 'empresa' }).success
    ).toBe(false);
  });
});
