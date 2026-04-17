import { describe, it, expect } from 'vitest';
import {
  buildLeadExtractPrompt,
  parseLeadExtractResponse,
  LeadExtractResponseSchema,
} from './lead-extract';

describe('buildLeadExtractPrompt', () => {
  it('includes the user text inside fenced quotes', () => {
    const prompt = buildLeadExtractPrompt('Juan @ Acme · juan@acme.com');
    expect(prompt).toContain('Juan @ Acme · juan@acme.com');
    expect(prompt).toContain('"""');
  });

  it('lists every extractable field', () => {
    const prompt = buildLeadExtractPrompt('foo');
    for (const f of [
      'empresa_nombre',
      'fuente_lead',
      'provincia',
      'categoria',
      'contacto_nombre',
      'cargo',
      'telefono',
      'email',
      'valor',
    ]) {
      expect(prompt).toContain(f);
    }
  });

  it('inlines currentData so the model does not re-ask known fields', () => {
    const prompt = buildLeadExtractPrompt('texto', {
      empresa_nombre: 'Acme',
      email: 'juan@acme.com',
    });
    expect(prompt).toContain('Datos ya conocidos');
    expect(prompt).toContain('"empresa_nombre": "Acme"');
    expect(prompt).toContain('"email": "juan@acme.com"');
  });

  it('omits the known-data block when currentData is empty', () => {
    expect(buildLeadExtractPrompt('texto')).not.toContain('Datos ya conocidos');
    expect(buildLeadExtractPrompt('texto', {})).not.toContain('Datos ya conocidos');
  });

  it('asks the model to respond in Spanish JSON only', () => {
    const prompt = buildLeadExtractPrompt('foo');
    expect(prompt).toMatch(/Devuelve SOLO el JSON/);
    expect(prompt).toMatch(/español/i);
  });
});

describe('parseLeadExtractResponse', () => {
  it('parses a clean JSON payload', () => {
    const raw = JSON.stringify({
      extracted: { empresa_nombre: 'Acme', email: 'juan@acme.com' },
      confidence: { empresa_nombre: 'high', email: 'high' },
      missing: ['valor'],
      questions: ['¿Qué valor estimado le ponemos?'],
    });
    const out = parseLeadExtractResponse(raw);
    expect(out.extracted.empresa_nombre).toBe('Acme');
    expect(out.confidence.email).toBe('high');
    expect(out.missing).toEqual(['valor']);
    expect(out.questions).toHaveLength(1);
  });

  it('strips a ```json fence if Gemini sneaks one in', () => {
    const raw = '```json\n{"extracted":{"empresa_nombre":"Acme"},"confidence":{},"missing":[],"questions":[]}\n```';
    const out = parseLeadExtractResponse(raw);
    expect(out.extracted.empresa_nombre).toBe('Acme');
  });

  it('applies defaults for omitted optional arrays', () => {
    const raw = '{"extracted":{}}';
    const out = parseLeadExtractResponse(raw);
    expect(out.missing).toEqual([]);
    expect(out.questions).toEqual([]);
    expect(out.confidence).toEqual({});
  });

  it('throws on invalid JSON', () => {
    expect(() => parseLeadExtractResponse('not json at all')).toThrow(/no parseable/i);
  });

  it('throws when the schema does not match', () => {
    const raw = JSON.stringify({ extracted: { email: 'not-an-email' } });
    expect(() => parseLeadExtractResponse(raw)).toThrow(/esquema inesperado/i);
  });

  it('rejects negative valor', () => {
    const raw = JSON.stringify({ extracted: { valor: -5 } });
    expect(() => parseLeadExtractResponse(raw)).toThrow();
  });

  it('caps questions at 5 entries (schema)', () => {
    const result = LeadExtractResponseSchema.safeParse({
      extracted: {},
      questions: ['1', '2', '3', '4', '5', '6'],
    });
    expect(result.success).toBe(false);
  });
});
