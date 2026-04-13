import { describe, it, expect } from 'vitest';
import {
  HEX_COLOR_RE,
  CAMPO_CLAVE_RE,
  mapTenantRow,
  isFeatureFlag,
  mapCampoRow,
} from './custom-fields';
import { FEATURE_FLAGS } from '../types';
import type { CampoPersonalizado } from '../types';

/* ===== Regex constants ===== */

describe('HEX_COLOR_RE', () => {
  it('matches valid 6-digit hex with hash', () => {
    expect(HEX_COLOR_RE.test('#ff00aa')).toBe(true);
    expect(HEX_COLOR_RE.test('#FFF000')).toBe(true);
    expect(HEX_COLOR_RE.test('#0D7377')).toBe(true);
  });

  it('rejects missing hash', () => {
    expect(HEX_COLOR_RE.test('ff00aa')).toBe(false);
  });

  it('rejects short hex (5 digits)', () => {
    expect(HEX_COLOR_RE.test('#ff00a')).toBe(false);
  });

  it('rejects 3-digit shorthand', () => {
    expect(HEX_COLOR_RE.test('#fff')).toBe(false);
  });

  it('rejects non-hex characters', () => {
    expect(HEX_COLOR_RE.test('#gggggg')).toBe(false);
  });
});

describe('CAMPO_CLAVE_RE', () => {
  it('matches lowercase slug with underscores', () => {
    expect(CAMPO_CLAVE_RE.test('campo_1')).toBe(true);
    expect(CAMPO_CLAVE_RE.test('a')).toBe(true);
    expect(CAMPO_CLAVE_RE.test('nombre_largo_campo')).toBe(true);
  });

  it('rejects starting with digit', () => {
    expect(CAMPO_CLAVE_RE.test('1campo')).toBe(false);
  });

  it('rejects uppercase', () => {
    expect(CAMPO_CLAVE_RE.test('Campo')).toBe(false);
  });

  it('rejects starting with underscore', () => {
    expect(CAMPO_CLAVE_RE.test('_campo')).toBe(false);
  });
});

/* ===== mapTenantRow ===== */

describe('mapTenantRow', () => {
  const baseRow = {
    id: 'uuid-1',
    nombre_empresa: 'Acme',
    logo_url: null,
    color_primario: '#0D7377',
    color_acento: '#E8943A',
    direccion: 'Calle 1',
    email_contacto: 'a@b.com',
    telefono: '123',
    feat_ai_chat: true,
    feat_morning_summary: false,
    feat_command_palette: true,
    feat_dashboard_historico: false,
    feat_admin_kpis: true,
    feat_admin_scripts: false,
    feat_notifications: true,
    feat_empresa_task_cal: false,
    updated_at: '2026-04-12T00:00:00Z',
    updated_by: 'user-1',
  };

  it('splits brand fields correctly', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config = mapTenantRow(baseRow as any);
    expect(config.brand).toEqual({
      nombre_empresa: 'Acme',
      logo_url: null,
      color_primario: '#0D7377',
      color_acento: '#E8943A',
      direccion: 'Calle 1',
      email_contacto: 'a@b.com',
      telefono: '123',
    });
  });

  it('splits flags correctly', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config = mapTenantRow(baseRow as any);
    expect(config.flags.feat_ai_chat).toBe(true);
    expect(config.flags.feat_morning_summary).toBe(false);
    expect(config.flags.feat_empresa_task_cal).toBe(false);
  });

  it('passes through id and updated_at', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config = mapTenantRow(baseRow as any);
    expect(config.id).toBe('uuid-1');
    expect(config.updated_at).toBe('2026-04-12T00:00:00Z');
  });
});

/* ===== isFeatureFlag ===== */

describe('isFeatureFlag', () => {
  it.each([...FEATURE_FLAGS])('recognizes known flag: %s', (flag) => {
    expect(isFeatureFlag(flag)).toBe(true);
  });

  it('rejects unknown flag', () => {
    expect(isFeatureFlag('feat_unknown')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isFeatureFlag('')).toBe(false);
  });
});

/* ===== mapCampoRow ===== */

describe('mapCampoRow', () => {
  const baseCampoRow = {
    id: 'c-1',
    entidad: 'empresa' as const,
    clave: 'sector',
    etiqueta: 'Sector',
    tipo: 'seleccion' as const,
    opciones: ['Tech', 'Finance', 42],
    orden: 1,
    obligatorio: false,
    created_at: '2026-04-01',
  };

  it('narrows opciones to string[] for seleccion type', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const campo = mapCampoRow(baseCampoRow as any);
    expect(campo.opciones).toEqual(['Tech', 'Finance']);
  });

  it('sets opciones to null for non-seleccion type', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const campo = mapCampoRow({ ...baseCampoRow, tipo: 'texto' } as any);
    expect(campo.opciones).toBeNull();
  });

  it('preserves basic fields', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const campo = mapCampoRow(baseCampoRow as any);
    expect(campo.id).toBe('c-1');
    expect(campo.entidad).toBe('empresa');
    expect(campo.clave).toBe('sector');
    expect(campo.etiqueta).toBe('Sector');
    expect(campo.orden).toBe(1);
    expect(campo.obligatorio).toBe(false);
  });
});

/* ===== Fixture helper ===== */

/** Minimal CampoPersonalizado for use in validator tests. */
export function makeCampo(
  overrides: Partial<CampoPersonalizado> = {}
): CampoPersonalizado {
  return {
    id: 'c-test',
    entidad: 'empresa' as CampoPersonalizado['entidad'],
    clave: 'test_field',
    etiqueta: 'Test Field',
    tipo: 'texto' as CampoPersonalizado['tipo'],
    opciones: null,
    orden: 0,
    obligatorio: false,
    created_at: '2026-01-01',
    ...overrides,
  };
}
