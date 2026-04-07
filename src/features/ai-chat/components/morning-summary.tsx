'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Bot, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function MorningSummary() {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const fetched = useRef(false);

  const fetchSummary = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(false);
    try {
      const url = forceRefresh ? '/api/chat/summary?refresh=1' : '/api/chat/summary';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setSummary(data.summary);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // First mount: load (cache hit if today's briefing already exists)
  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    fetchSummary(false);
  }, [fetchSummary]);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
            <Bot className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-sm font-medium">Briefing de la mañana</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchSummary(true)}
          disabled={loading}
          className="h-7 gap-1 px-2 text-xs text-muted-foreground"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {loading && !summary && (
        <div className="space-y-2">
          <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-3 w-full animate-pulse rounded bg-muted" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
        </div>
      )}

      {error && !summary && (
        <p className="text-xs text-muted-foreground">
          No se ha podido generar el resumen. Pulsa «Actualizar» para reintentar.
        </p>
      )}

      {summary && (
        <div className="prose prose-sm max-w-none text-sm text-foreground [&_ul]:mt-1 [&_ul]:space-y-0.5 [&_li]:text-sm [&_p]:text-sm [&_strong]:text-foreground">
          <div dangerouslySetInnerHTML={{ __html: markdownToHtml(summary) }} />
        </div>
      )}
    </div>
  );
}

/** Minimal markdown → HTML for bullet points and bold text */
function markdownToHtml(md: string): string {
  return md
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return `<li>${inlineFormat(trimmed.slice(2))}</li>`;
      }
      if (trimmed.startsWith('# ')) {
        return `<strong>${inlineFormat(trimmed.slice(2))}</strong>`;
      }
      if (!trimmed) return '';
      return `<p>${inlineFormat(trimmed)}</p>`;
    })
    .join('\n')
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);
}

function inlineFormat(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}
