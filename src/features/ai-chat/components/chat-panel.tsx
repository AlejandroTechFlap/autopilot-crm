'use client';

import { useEffect, useRef, useState } from 'react';
import { Bot, Send, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChat } from '../hooks/use-chat';
import { ChatMessage } from './chat-message';

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
  /**
   * If set when the panel opens, this message is auto-sent as the first user
   * turn. Used by the Cmd+K palette's "Preguntar a la IA" fallback.
   */
  initialMessage?: string;
}

export function ChatPanel({ open, onClose, initialMessage }: ChatPanelProps) {
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
            Pregúntame sobre tu pipeline y tus tareas
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
          <EmptyState />
        ) : (
          messages.map((msg, i) => <ChatMessage key={i} message={msg} />)
        )}
        {isStreaming && messages[messages.length - 1]?.text === '' && (
          <div className="flex gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div className="rounded-lg bg-muted px-3 py-2">
              <span className="inline-flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/40 [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/40 [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/40 [animation-delay:300ms]" />
              </span>
            </div>
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
            placeholder="Pregunta sobre tu pipeline, tareas o negocios..."
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

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <Bot className="h-6 w-6 text-primary" />
      </div>
      <div>
        <p className="text-sm font-medium">¿En qué puedo ayudarte?</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Prueba a preguntar:
        </p>
      </div>
      <div className="space-y-1.5 text-xs text-muted-foreground">
        <p>&quot;¿A qué lead debería llamar primero?&quot;</p>
        <p>&quot;¿Cómo está mi pipeline?&quot;</p>
        <p>&quot;Resúmeme la semana&quot;</p>
      </div>
    </div>
  );
}
