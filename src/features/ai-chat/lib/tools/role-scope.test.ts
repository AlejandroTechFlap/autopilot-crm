import { describe, it, expect } from 'vitest';
import type { FunctionDeclaration } from '@google/genai';
import { filterToolsForRole } from './role-scope';
import { TOOL_DECLARATIONS } from './definitions';

const fakeDecl = (name: string): FunctionDeclaration => ({
  name,
  description: `desc ${name}`,
  parameters: { type: 'OBJECT' as never, properties: {} },
});

describe('filterToolsForRole', () => {
  it('hides get_kpis_direccion from vendedor', () => {
    const all = [
      fakeDecl('search_empresas'),
      fakeDecl('get_kpis_vendedor'),
      fakeDecl('get_kpis_direccion'),
    ];
    const result = filterToolsForRole(all, 'vendedor');
    const names = result.map((d) => d.name);
    expect(names).toContain('search_empresas');
    expect(names).toContain('get_kpis_vendedor');
    expect(names).not.toContain('get_kpis_direccion');
  });

  it('returns all tools for direccion', () => {
    const all = [fakeDecl('get_kpis_vendedor'), fakeDecl('get_kpis_direccion')];
    expect(filterToolsForRole(all, 'direccion')).toHaveLength(2);
  });

  it('returns all tools for admin', () => {
    const all = [fakeDecl('get_kpis_vendedor'), fakeDecl('get_kpis_direccion')];
    expect(filterToolsForRole(all, 'admin')).toHaveLength(2);
  });

  it('does not mutate the input array', () => {
    const all = [fakeDecl('get_kpis_direccion'), fakeDecl('search_empresas')];
    const before = all.length;
    filterToolsForRole(all, 'vendedor');
    expect(all).toHaveLength(before);
  });

  it('against the real TOOL_DECLARATIONS: vendedor sees N-1, direccion/admin see N', () => {
    const total = TOOL_DECLARATIONS.length;
    expect(filterToolsForRole(TOOL_DECLARATIONS, 'vendedor')).toHaveLength(total - 1);
    expect(filterToolsForRole(TOOL_DECLARATIONS, 'direccion')).toHaveLength(total);
    expect(filterToolsForRole(TOOL_DECLARATIONS, 'admin')).toHaveLength(total);
  });
});
