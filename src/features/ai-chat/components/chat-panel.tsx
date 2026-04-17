'use client';

import { useEffect, useRef, useState } from 'react';
import { Bot, Send, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useChat } from '../hooks/use-chat';
import { ChatMessage } from './chat-message';
import { getSuggestedPrompts } from '../lib/suggested-prompts';

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
  /**
   * If set when the panel opens, this message is auto-sent as the first user
   * turn. Used by the Cmd+K palette's "Preguntar a la IA" fallback.
   */
  initialMessage?: string;
  /** Role of the current user — drives the suggested-prompt set. */
  rol?: string;
}

export function ChatPanel({ open, onClose, initialMessage, rol }: ChatPanelProps) {
  const { messages, isStreaming, sendMessage, clearMessages } = useChat();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sentSeedRef = useRef<string | null>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Forward a seed message exactly once per open. Resetting on close lets a
  // future open with the same seed re-fire.
  useEffect(() => {
    if (!open) {
      sentSeedRef.current = null;
      return;
    }
    if (initialMessage && sentSeedRef.current !== initialMessage) {
      sentSeedRef.current = initialMessage;
      sendMessage(initialMessage);
    }
  }, [open, initialMessage, sendMessage]);

  if (!open) return null;

  const handleSubmit = () => {
    if (!input.trim() || isStreaming) return;
    sendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <aside
      aria-label="Asistente IA"
      className="flex h-full w-full shrink-0 flex-col border-l bg-background lg:w-[420px] xl:w-[460px]"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold leading-snug">Asistente IA</h2>
          <p className="text-xs text-muted-foreground">
            Pregúntame sobre tu embudo y tus tareas
          </p>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearMessages}
              className="h-8 gap-1 text-xs text-muted-foreground"
            >
              <Trash2 className="h-3 w-3" />
              Limpiar
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Cerrar asistente"
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto px-4 py-3"
      >
        {messages.length === 0 ? (
          <EmptyState rol={rol} onPick={(text) => sendMessage(text)} />
        ) : (
          messages.map((msg, i) => <ChatMessage key={i} message={msg} />)
        )}
        {isStreaming &&
          (messages[messages.length - 1]?.role === 'user' ||
            messages[messages.length - 1]?.text === '') && (
            <div
              className="flex gap-2.5"
              role="status"
              aria-label="El asistente está pensando"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                <Bot className="h-3.5 w-3.5 animate-pulse" />
              </div>
              <div className="flex-1 space-y-3 rounded-lg bg-muted px-3 py-2.5">
                <Skeleton className="h-3.5 w-2/5 bg-foreground/15" />
                <div className="space-y-1.5">
                  <Skeleton className="h-2.5 w-full bg-foreground/10" />
                  <Skeleton className="h-2.5 w-[95%] bg-foreground/10" />
                  <Skeleton className="h-2.5 w-[88%] bg-foreground/10" />
                  <Skeleton className="h-2.5 w-3/4 bg-foreground/10" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-2.5 w-full bg-foreground/10" />
                  <Skeleton className="h-2.5 w-[92%] bg-foreground/10" />
                  <Skeleton className="h-2.5 w-2/3 bg-foreground/10" />
                </div>
                <Skeleton className="h-2.5 w-1/3 bg-foreground/10" />
              </div>
              <span className="sr-only">Generando respuesta…</span>
            </div>
          )}
      </div>

      {/* Input area */}
      <div className="border-t p-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pregunta sobre tu embudo, tareas o negocios..."
            rows={4}
            className="min-h-[96px] max-h-[280px] flex-1 resize-y rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={!input.trim() || isStreaming}
            aria-label="Enviar mensaje"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">
          Enter para enviar · Shift + Enter para nueva línea · arrastra la
          esquina para redimensionar
        </p>
      </div>
    </aside>
  );
}

function EmptyState({
  rol,
  onPick,
}: {
  rol?: string;
  onPick: (text: string) => void;
}) {
  const prompts = getSuggestedPrompts(rol ?? 'vendedor');
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <Bot className="h-6 w-6 text-primary" />
      </div>
      <div>
        <p className="text-sm font-medium">¿En qué puedo ayudarte?</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Prueba con una de estas:
        </p>
      </div>
      <div className="flex flex-col items-stretch gap-1.5 px-2 w-full max-w-[320px]">
        {prompts.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => onPick(p.prompt)}
            className="rounded-md border border-input bg-background px-3 py-2 text-left text-xs hover:bg-muted transition-colors"
          >
            <span className="font-medium">{p.label}</span>
            <span className="block text-[11px] text-muted-foreground line-clamp-2">
              {p.prompt}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
