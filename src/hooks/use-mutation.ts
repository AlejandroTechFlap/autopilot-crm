'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

/**
 * Generic client mutation hook.
 *
 * Handles the boilerplate every form/button currently repeats:
 *   - loading flag
 *   - error capture
 *   - sonner toast on success / error
 *   - router.refresh() to invalidate RSC caches
 *
 * Usage:
 *   const save = useMutation(
 *     async (input: { id: string; nombre: string }) => {
 *       const res = await fetch(`/api/admin/usuarios/${input.id}`, {
 *         method: 'PATCH',
 *         headers: { 'Content-Type': 'application/json' },
 *         body: JSON.stringify({ nombre: input.nombre }),
 *       });
 *       if (!res.ok) {
 *         const body = await res.json().catch(() => ({}));
 *         throw new Error(body.error ?? 'No se ha podido guardar');
 *       }
 *       return res.json();
 *     },
 *     {
 *       successMessage: 'Usuario guardado',
 *       errorMessage: 'No se ha podido guardar el usuario',
 *       onSuccess: () => onSaved?.(),
 *     }
 *   );
 *
 *   <Button onClick={() => save.mutate({ id, nombre })} disabled={save.loading}>
 *     {save.loading ? 'Guardando…' : 'Guardar'}
 *   </Button>
 */

export interface UseMutationOptions<TInput, TOutput> {
  /** Toast on success. Pass `false` to disable. */
  successMessage?: string | false;
  /** Fallback toast on failure (the thrown Error message wins if present). */
  errorMessage?: string;
  /** Called after success, before router.refresh(). */
  onSuccess?: (output: TOutput, input: TInput) => void | Promise<void>;
  /** Called after failure. */
  onError?: (error: Error, input: TInput) => void;
  /** Skip router.refresh() after success. */
  skipRefresh?: boolean;
}

export interface UseMutationResult<TInput, TOutput> {
  mutate: (input: TInput) => Promise<TOutput | null>;
  loading: boolean;
  error: string | null;
  reset: () => void;
}

export function useMutation<TInput, TOutput>(
  fn: (input: TInput) => Promise<TOutput>,
  options: UseMutationOptions<TInput, TOutput> = {}
): UseMutationResult<TInput, TOutput> {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (input: TInput): Promise<TOutput | null> => {
      setLoading(true);
      setError(null);
      try {
        const output = await fn(input);
        if (options.successMessage !== false && options.successMessage) {
          toast.success(options.successMessage);
        }
        await options.onSuccess?.(output, input);
        if (!options.skipRefresh) {
          router.refresh();
        }
        return output;
      } catch (err) {
        const normalised =
          err instanceof Error
            ? err
            : new Error(typeof err === 'string' ? err : 'Error desconocido');
        const message =
          normalised.message || options.errorMessage || 'Ha ocurrido un error';
        setError(message);
        toast.error(message);
        options.onError?.(normalised, input);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fn, options, router]
  );

  const reset = useCallback(() => {
    setError(null);
    setLoading(false);
  }, []);

  return { mutate, loading, error, reset };
}
