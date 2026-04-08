'use client';

/**
 * Phase 10 — admin branding logo uploader.
 *
 * Drag-drop or click-to-pick a PNG file → POSTs multipart to
 * /api/admin/tenant/logo → calls onChange with the resulting public URL.
 *
 * Client-side validation mirrors the server route (PNG only, ≤ 2 MB) so
 * the user gets an instant error instead of a network round trip. The
 * server route remains the source of truth — see decision D1 in the spec.
 */

import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { Loader2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ALLOWED_MIME = 'image/png';
const MAX_BYTES = 2 * 1024 * 1024;

interface LogoUploaderProps {
  /** Current logo URL — null if no logo is set yet. */
  value: string | null;
  /** Called with the new public URL after a successful upload, or null on remove. */
  onChange: (url: string | null) => void;
}

async function readError(res: Response): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  return body.error ?? `HTTP ${res.status}`;
}

export function LogoUploader({ value, onChange }: LogoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const upload = useCallback(
    async (file: File) => {
      if (file.type !== ALLOWED_MIME) {
        toast.error('Solo se permite PNG');
        return;
      }
      if (file.size > MAX_BYTES) {
        toast.error('El archivo supera los 2 MB');
        return;
      }
      setUploading(true);
      try {
        const form = new FormData();
        form.append('file', file);
        const res = await fetch('/api/admin/tenant/logo', {
          method: 'POST',
          body: form,
        });
        if (!res.ok) throw new Error(await readError(res));
        const body = (await res.json()) as { logo_url: string };
        onChange(body.logo_url);
        toast.success('Logo subido');
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'No se ha podido subir el logo'
        );
      } finally {
        setUploading(false);
      }
    },
    [onChange]
  );

  const onPick = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void upload(file);
      // Reset so picking the same file twice still triggers change.
      e.target.value = '';
    },
    [upload]
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void upload(file);
    },
    [upload]
  );

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={cn(
          'flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed text-sm text-muted-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          dragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        )}
      >
        {uploading ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Subiendo...</span>
          </>
        ) : value ? (
          <Image
            src={value}
            alt="Logo actual"
            width={120}
            height={120}
            unoptimized
            className="h-28 w-28 object-contain"
          />
        ) : (
          <>
            <Upload className="h-6 w-6" />
            <span>Arrastra un PNG o haz clic para subirlo</span>
            <span className="text-xs">Máximo 2 MB</span>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_MIME}
        onChange={onPick}
        className="hidden"
      />
      {value && !uploading && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange(null)}
          className="gap-1"
        >
          <X className="h-3 w-3" /> Eliminar logo
        </Button>
      )}
    </div>
  );
}
