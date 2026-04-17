import { describe, it, expect, vi } from 'vitest';
import type { Content, FunctionCall } from '@google/genai';
import {
  extractModelTurn,
  runClosingCall,
  CLOSING_INSTRUCTION,
} from './turn';

describe('extractModelTurn', () => {
  it('returns the candidate content verbatim, preserving thought_signature', () => {
    const candidate: Content = {
      role: 'model',
      parts: [
        {
          functionCall: { id: 'fc_1', name: 'search_empresas', args: {} },
          thoughtSignature: 'opaque-signature-bytes',
        } as unknown as NonNullable<Content['parts']>[number],
      ],
    };

    const { content, usedFallback } = extractModelTurn(candidate, []);

    expect(usedFallback).toBe(false);
    expect(content).toBe(candidate);
    expect(content.parts?.[0]).toHaveProperty('thoughtSignature', 'opaque-signature-bytes');
  });

  it('preserves mixed text + function-call parts in candidate order', () => {
    const candidate: Content = {
      role: 'model',
      parts: [
        { text: 'Voy a buscar empresas relevantes.' },
        {
          functionCall: { id: 'fc_1', name: 'search_empresas', args: { q: 'A' } },
          thoughtSignature: 'sig-A',
        } as unknown as NonNullable<Content['parts']>[number],
        {
          functionCall: { id: 'fc_2', name: 'search_deals', args: { limit: 5 } },
          thoughtSignature: 'sig-B',
        } as unknown as NonNullable<Content['parts']>[number],
      ],
    };

    const { content, usedFallback } = extractModelTurn(candidate, []);

    expect(usedFallback).toBe(false);
    expect(content.parts).toHaveLength(3);
    expect((content.parts?.[1] as { thoughtSignature: string }).thoughtSignature).toBe('sig-A');
    expect((content.parts?.[2] as { thoughtSignature: string }).thoughtSignature).toBe('sig-B');
  });

  it('falls back to reconstruction when the candidate is missing', () => {
    const calls: FunctionCall[] = [
      { id: 'fc_1', name: 'search_empresas', args: { q: 'X' } },
    ];

    const { content, usedFallback } = extractModelTurn(undefined, calls);

    expect(usedFallback).toBe(true);
    expect(content.role).toBe('model');
    expect(content.parts).toHaveLength(1);
    expect(content.parts?.[0]).toEqual({
      functionCall: { id: 'fc_1', name: 'search_empresas', args: { q: 'X' } },
    });
  });

  it('reconstructs every call when multiple are returned', () => {
    const calls: FunctionCall[] = [
      { id: 'fc_1', name: 'search_empresas', args: {} },
      { id: 'fc_2', name: 'get_kpis_vendedor', args: { mes: '2026-04' } },
    ];

    const { content, usedFallback } = extractModelTurn(undefined, calls);

    expect(usedFallback).toBe(true);
    expect(content.parts).toHaveLength(2);
    expect((content.parts?.[0] as { functionCall: FunctionCall }).functionCall.name).toBe(
      'search_empresas',
    );
    expect((content.parts?.[1] as { functionCall: FunctionCall }).functionCall.name).toBe(
      'get_kpis_vendedor',
    );
  });
});

describe('runClosingCall', () => {
  const baseContents: Content[] = [
    { role: 'user', parts: [{ text: '¿Qué vendedor tiene más oportunidades?' }] },
    { role: 'model', parts: [{ text: 'Voy a consultarlo.' }] },
  ];

  it('calls generateContent without `tools` so the model is forced to summarise', async () => {
    const call = vi.fn().mockResolvedValue({ text: 'Resumen final.' });

    await runClosingCall(call, {
      model: 'gemini-3.1-flash-lite-preview',
      systemPrompt: 'Eres un analista.',
      contents: baseContents,
    });

    expect(call).toHaveBeenCalledTimes(1);
    const req = call.mock.calls[0][0];
    expect(req.config).not.toHaveProperty('tools');
  });

  it('appends the closing instruction to the system prompt', async () => {
    const call = vi.fn().mockResolvedValue({ text: 'OK' });

    await runClosingCall(call, {
      model: 'gemini-3.1-flash-lite-preview',
      systemPrompt: 'Eres un analista.',
      contents: baseContents,
    });

    const req = call.mock.calls[0][0];
    expect(req.config.systemInstruction).toBe('Eres un analista.' + CLOSING_INSTRUCTION);
    expect(req.config.systemInstruction).toContain('NO llames más herramientas');
  });

  it('forwards the existing contents history verbatim', async () => {
    const call = vi.fn().mockResolvedValue({ text: 'OK' });

    await runClosingCall(call, {
      model: 'gemini-3.1-flash-lite-preview',
      systemPrompt: 'sys',
      contents: baseContents,
    });

    expect(call.mock.calls[0][0].contents).toBe(baseContents);
  });

  it('returns the closing text when the model produces one', async () => {
    const call = vi.fn().mockResolvedValue({ text: 'Resumen degradado pero útil.' });

    const result = await runClosingCall(call, {
      model: 'm',
      systemPrompt: 's',
      contents: baseContents,
    });

    expect(result).toBe('Resumen degradado pero útil.');
  });

  it('returns null when the model emits no text', async () => {
    const call = vi.fn().mockResolvedValue({ text: undefined });

    const result = await runClosingCall(call, {
      model: 'm',
      systemPrompt: 's',
      contents: baseContents,
    });

    expect(result).toBeNull();
  });

  it('uses default maxOutputTokens=2048 and temperature=0.7', async () => {
    const call = vi.fn().mockResolvedValue({ text: 'OK' });

    await runClosingCall(call, {
      model: 'm',
      systemPrompt: 's',
      contents: baseContents,
    });

    const cfg = call.mock.calls[0][0].config;
    expect(cfg.maxOutputTokens).toBe(2048);
    expect(cfg.temperature).toBe(0.7);
  });

  it('propagates errors from the underlying call', async () => {
    const call = vi.fn().mockRejectedValue(new Error('429 RESOURCE_EXHAUSTED'));

    await expect(
      runClosingCall(call, { model: 'm', systemPrompt: 's', contents: baseContents }),
    ).rejects.toThrow('429 RESOURCE_EXHAUSTED');
  });
});
