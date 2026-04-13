'use client';

import { useState } from 'react';
import { Database, ChevronDown, ChevronUp } from 'lucide-react';
import type { CitationWidget } from '../types';

interface ChatCitationProps {
  widget: CitationWidget;
}

export function ChatCitation({ widget }: ChatCitationProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <Database className="h-3 w-3" />
        <span>{widget.title ?? 'Datos'}</span>
        <span className="text-muted-foreground/60">
          ({widget.rowCount} {widget.rowCount === 1 ? 'fila' : 'filas'})
        </span>
        {open ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
      </button>
      {open && (
        <pre className="mt-1.5 overflow-x-auto rounded-md bg-background/60 border p-2 text-[11px] font-mono text-muted-foreground">
          {widget.query}
        </pre>
      )}
    </div>
  );
}
