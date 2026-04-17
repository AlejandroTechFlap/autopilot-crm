'use client';

import { startTransition, useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleSectionProps {
  /** Stable key for persisting open/closed state in localStorage. */
  storageKey: string;
  title: string;
  count?: number;
  defaultOpen?: boolean;
  /** Visual accent on the header — only used for the `Vencidas` bucket today. */
  tone?: 'default' | 'danger' | 'muted';
  children: React.ReactNode;
}

const TONE_CLASSES: Record<NonNullable<CollapsibleSectionProps['tone']>, string> = {
  default: 'text-foreground',
  danger: 'text-danger',
  muted: 'text-muted-foreground',
};

/**
 * Bucketed-list section with a chevron header that toggles the body. Used on
 * `/mis-tareas` to let vendedores collapse the `Vencidas` / `Sin fecha`
 * groups that otherwise dominate the viewport. Persisted per section so the
 * user's preference survives navigation.
 */
export function CollapsibleSection({
  storageKey,
  title,
  count,
  defaultOpen = true,
  tone = 'default',
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(`cockpit-section:${storageKey}`);
      if (raw === 'open' || raw === 'closed') {
        startTransition(() => setOpen(raw === 'open'));
      }
    } catch {
      // Ignore storage access errors (private mode, quota, etc.)
    }
    startTransition(() => setHydrated(true));
  }, [storageKey]);

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(
          `cockpit-section:${storageKey}`,
          next ? 'open' : 'closed'
        );
      } catch {
        // Ignore
      }
      return next;
    });
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className={cn(
          'flex w-full items-center gap-1.5 text-xs font-medium transition-colors hover:text-foreground',
          TONE_CLASSES[tone]
        )}
      >
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 shrink-0 transition-transform',
            !open && '-rotate-90'
          )}
        />
        <span>
          {title}
          {typeof count === 'number' && (
            <span className="ml-1 tabular-nums">({count})</span>
          )}
        </span>
      </button>
      {hydrated && open && <div className="space-y-1.5">{children}</div>}
    </div>
  );
}
