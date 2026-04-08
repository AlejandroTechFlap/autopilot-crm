'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Dashboard error boundary. In production we surface ONLY a generic copy
 * plus the Next.js `error.digest` (an opaque hash used for log correlation).
 * The raw `error.message` is never rendered to users outside dev builds —
 * it can leak stack frames, database errors, or internal file paths.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Server-side logging: Next.js writes this to stdout, never to the
    // browser console in production builds.
    console.error('Dashboard error:', error);
  }, [error]);

  const isDev = process.env.NODE_ENV !== 'production';

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <h2 className="text-lg font-semibold">Algo ha salido mal</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          No hemos podido cargar esta página. Puedes intentarlo de nuevo.
        </p>
        {isDev && error.message && (
          <p className="max-w-md text-xs font-mono text-destructive/80">
            {error.message}
          </p>
        )}
        {error.digest && (
          <p className="text-xs text-muted-foreground/60">
            Ref: {error.digest}
          </p>
        )}
        <Button onClick={reset} className="mt-2">
          Reintentar
        </Button>
      </CardContent>
    </Card>
  );
}
