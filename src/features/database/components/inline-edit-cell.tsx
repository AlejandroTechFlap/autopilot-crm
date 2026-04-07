'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface InlineEditCellProps {
  value: string | null;
  /** Called when the user commits a new value (Enter or blur with change). */
  onSave: (next: string | null) => Promise<void>;
  /** Placeholder shown when the value is empty. */
  placeholder?: string;
  /** When true, an empty submission saves null instead of an empty string. */
  nullable?: boolean;
  /** Optional className applied to the container. */
  className?: string;
  /** Disable editing entirely (e.g. RLS denies it for this row). */
  disabled?: boolean;
}

/**
 * A cell that swaps to a text input on click, commits on Enter / blur,
 * and reverts on Escape. Used in the database tables for in-place edits
 * of free-text fields like name, province, position, phone, email.
 */
export function InlineEditCell({
  value,
  onSave,
  placeholder = '—',
  nullable = true,
  className,
  disabled,
}: InlineEditCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value ?? '');
  }, [value]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = async () => {
    const trimmed = draft.trim();
    const original = value ?? '';
    if (trimmed === original) {
      setEditing(false);
      return;
    }
    const next = trimmed === '' && nullable ? null : trimmed;
    setSaving(true);
    try {
      await onSave(next);
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
      setDraft(original);
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setDraft(value ?? '');
    setEditing(false);
  };

  if (!editing) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setEditing(true)}
        className={cn(
          'w-full truncate rounded px-1.5 py-0.5 text-left text-sm',
          !disabled && 'hover:bg-muted',
          !value && 'text-muted-foreground',
          className
        )}
        title={disabled ? undefined : 'Click to edit'}
      >
        {value || placeholder}
      </button>
    );
  }

  return (
    <input
      ref={inputRef}
      value={draft}
      disabled={saving}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          commit();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          cancel();
        }
      }}
      className={cn(
        'w-full rounded border border-ring bg-background px-1.5 py-0.5 text-sm outline-none',
        className
      )}
    />
  );
}
