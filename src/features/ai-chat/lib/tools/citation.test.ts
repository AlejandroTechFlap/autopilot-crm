import { describe, it, expect } from 'vitest';
import { buildCite } from './citation';

describe('buildCite', () => {
  it('empresa cites point at their own detail page', () => {
    const c = buildCite('empresa', 'emp-1', 'Acme SA');
    expect(c).toEqual({
      kind: 'empresa',
      id: 'emp-1',
      label: 'Acme SA',
      href: '/empresa/emp-1',
    });
  });

  it('deal cites point at the parent empresa detail page', () => {
    const c = buildCite('deal', 'deal-9', 'Deal Acme renovación', 'emp-1');
    expect(c.kind).toBe('deal');
    expect(c.id).toBe('deal-9');
    expect(c.href).toBe('/empresa/emp-1');
  });

  it('contacto cites point at the parent empresa detail page', () => {
    const c = buildCite('contacto', 'c-3', 'Juan Pérez', 'emp-7');
    expect(c.href).toBe('/empresa/emp-7');
  });

  it('falls back to /empresas when no empresa id is available', () => {
    const c = buildCite('tarea', 't-2', 'Llamar al cliente', null);
    expect(c.href).toBe('/empresas');
  });

  it('falls back to /empresas when empresaId is omitted for a non-empresa', () => {
    const c = buildCite('deal', 'deal-solo', 'Deal huérfano');
    expect(c.href).toBe('/empresas');
  });
});
