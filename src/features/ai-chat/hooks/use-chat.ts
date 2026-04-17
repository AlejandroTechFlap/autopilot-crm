'use client';

import { useCallback, useRef, useState } from 'react';
import type { Widget } from '../types';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  /** Widgets attached to this message (charts, tables, citations). Phase 11. */
  widgets?: Widget[];
}

interface UseChatReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  sendMessage: (text: string) => Promise<void>;
  clearMessages: () => void;
}

// ChatGPT-style progressive reveal. The server sends the full text in a
// single SSE chunk (tool-loop architecture can't stream mid-loop), so we
// animate the reveal client-side at ~1600 chars/sec. Abort-aware: if the
// user clicks Limpiar mid-reveal, we snap to the end and exit.
function typewriterReveal(
  text: string,
  onTick: (partial: string) => void,
  signal: AbortSignal,
  charsPerTick = 16,
  tickMs = 10
): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted || text.length === 0) {
      onTick(text);
      resolve();
      return;
    }
    let i = 0;
    const id = setInterval(() => {
      if (signal.aborted) {
        clearInterval(id);
        resolve();
        return;
      }
      i = Math.min(i + charsPerTick, text.length);
      onTick(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(id);
        resolve();
      }
    }, tickMs);
  });
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMsg: ChatMessage = { role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);

    // Build history from existing messages (max 20)
    const history = [...messages, userMsg].slice(-20).map((m) => ({
      role: m.role,
      text: m.text,
    }));
    // Remove the last user message from history (it goes as `message`)
    history.pop();

    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res
          .json()
          .catch(() => ({ error: 'No he podido contactar con el servicio de IA.' }));
        setMessages((prev) => [
          ...prev,
          {
            role: 'model',
            text: err.error ?? 'Ha ocurrido un error inesperado. Vuelve a intentarlo.',
          },
        ]);
        setIsStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setIsStreaming(false);
        return;
      }

      const decoder = new TextDecoder();
      let assistantText = '';
      let assistantWidgets: Widget[] | undefined;

      // Push an empty assistant message — the skeleton renders while text === ''
      setMessages((prev) => [...prev, { role: 'model', text: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();

          if (payload === '[DONE]') continue;

          try {
            const parsed = JSON.parse(payload);
            if (parsed.error) {
              assistantText += `\n\n${parsed.error}`;
            } else if (parsed.text) {
              assistantText += parsed.text;
            }
            if (parsed.widgets && Array.isArray(parsed.widgets)) {
              assistantWidgets = parsed.widgets as Widget[];
            }
          } catch {
            // Skip malformed chunks
          }
        }
      }

      // Progressive reveal (ChatGPT-style typewriter) once the full payload
      // has arrived. Widgets attach only after the text is fully revealed so
      // charts/tables don't pop in before their introduction.
      await typewriterReveal(
        assistantText,
        (partial) => {
          setMessages((prev) => {
            if (prev.length === 0) return prev;
            const last = prev[prev.length - 1];
            if (last.role !== 'model') return prev;
            const updated = [...prev];
            updated[updated.length - 1] = { ...last, text: partial };
            return updated;
          });
        },
        abortRef.current.signal
      );

      setMessages((prev) => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        if (last.role !== 'model') return prev;
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...last,
          text: assistantText,
          widgets: assistantWidgets,
        };
        return updated;
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // User cancelled — do nothing
      } else {
        setMessages((prev) => [
          ...prev.filter((m) => m.text !== ''),
          { role: 'model', text: 'Error de conexión con el servicio de IA. Vuelve a intentarlo.' },
        ]);
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [messages, isStreaming]);

  const clearMessages = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setMessages([]);
    setIsStreaming(false);
  }, []);

  return { messages, isStreaming, sendMessage, clearMessages };
}
