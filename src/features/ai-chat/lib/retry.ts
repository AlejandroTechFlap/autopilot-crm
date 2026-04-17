/**
 * Retry + error mapping for Gemini `generateContent` calls.
 *
 * Gemini's preview tiers (`gemini-3.1-flash-lite-preview`) return 503
 * `UNAVAILABLE` under load. The raw error message is a JSON string that the
 * API routes previously surfaced verbatim to the UI — users see
 * `{"error":{"code":503,...}}` in the chat bubble.
 *
 * Two layers here:
 *   1. `generateWithRetry` — retries transient upstream failures with
 *      exponential backoff. Most 503s clear within 1-2 seconds on the
 *      Gemini side.
 *   2. `mapGeminiErrorToUserMessage` — turns any error (post-retry) into a
 *      short Spanish message the UI can render directly. Never leaks raw
 *      JSON / stack traces.
 *
 * Kept framework-agnostic: just takes a caller function + request object,
 * no coupling to any specific route.
 */

/** Transient error markers we retry on. */
const RETRYABLE_SUBSTRINGS = [
  'UNAVAILABLE',
  'RESOURCE_EXHAUSTED',
  'DEADLINE_EXCEEDED',
  'INTERNAL',
  'fetch failed',
  'network error',
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
  'EAI_AGAIN',
];

const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

/** Default retry parameters — 3 attempts over ~2.4s worst case. */
const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_BASE_DELAY_MS = 600;

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  /** Injected for tests. Real code uses `setTimeout`. */
  sleep?: (ms: number) => Promise<void>;
  /** Hook for logging each retry attempt. */
  onRetry?: (attempt: number, err: unknown) => void;
}

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * True when the error is a transient upstream failure worth retrying.
 * Handles both fetch-style errors (`status` number) and Gemini SDK errors
 * whose `message` embeds the JSON payload from the API.
 */
export function isRetryableError(err: unknown): boolean {
  if (err == null) return false;
  const e = err as { status?: unknown; code?: unknown; message?: unknown };

  if (typeof e.status === 'number' && RETRYABLE_STATUSES.has(e.status)) {
    return true;
  }
  if (typeof e.code === 'number' && RETRYABLE_STATUSES.has(e.code)) {
    return true;
  }
  const msg = typeof e.message === 'string' ? e.message : '';
  if (!msg) return false;
  return RETRYABLE_SUBSTRINGS.some((s) => msg.includes(s));
}

/**
 * Runs `fn` with exponential-backoff retries on transient errors.
 * Re-throws the last error if every attempt fails.
 */
export async function generateWithRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {},
): Promise<T> {
  const maxAttempts = opts.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const baseDelay = opts.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  const sleep = opts.sleep ?? defaultSleep;

  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const canRetry = attempt < maxAttempts && isRetryableError(err);
      if (!canRetry) throw err;
      opts.onRetry?.(attempt, err);
      // Exponential backoff: 600ms, 1200ms, 2400ms…
      await sleep(baseDelay * 2 ** (attempt - 1));
    }
  }
  throw lastErr;
}

/**
 * Extracts a numeric status code from a Gemini error, looking at the common
 * fields (`status`, `code`) and, as a last resort, parsing the `message`
 * body which Gemini embeds as stringified JSON.
 */
function extractStatus(err: unknown): number | null {
  if (err == null) return null;
  const e = err as { status?: unknown; code?: unknown; message?: unknown };
  if (typeof e.status === 'number') return e.status;
  if (typeof e.code === 'number') return e.code;
  const msg = typeof e.message === 'string' ? e.message : '';
  if (!msg) return null;
  const match = msg.match(/"code"\s*:\s*(\d+)/);
  if (match) return parseInt(match[1], 10);
  return null;
}

/**
 * Turns any Gemini/network error into a short Spanish message safe to show
 * to end users. Never leaks raw JSON, stack traces or internal identifiers.
 */
export function mapGeminiErrorToUserMessage(err: unknown): string {
  const status = extractStatus(err);
  const msg =
    err && typeof err === 'object' && 'message' in err
      ? String((err as { message: unknown }).message ?? '')
      : '';

  if (status === 503 || msg.includes('UNAVAILABLE')) {
    return 'El servicio de IA está saturado ahora mismo. Vuelve a intentarlo en unos segundos.';
  }
  if (status === 429 || msg.includes('RESOURCE_EXHAUSTED')) {
    return 'Se ha alcanzado el límite de peticiones al servicio de IA. Espera un momento y vuelve a probar.';
  }
  if (status === 504 || msg.includes('DEADLINE_EXCEEDED')) {
    return 'La IA ha tardado demasiado en responder. Prueba a acotar más la pregunta.';
  }
  if (status === 502 || status === 500 || msg.includes('INTERNAL')) {
    return 'El servicio de IA ha fallado temporalmente. Vuelve a intentarlo.';
  }
  if (status === 401 || status === 403) {
    return 'El servicio de IA ha rechazado la petición. Avisa al administrador.';
  }
  if (status === 400 || msg.includes('INVALID_ARGUMENT')) {
    return 'No he podido procesar la petición. Prueba a reformularla.';
  }
  if (
    msg.includes('fetch failed') ||
    msg.includes('ECONNRESET') ||
    msg.includes('ETIMEDOUT') ||
    msg.includes('ENOTFOUND')
  ) {
    return 'No he podido conectar con el servicio de IA. Revisa tu conexión y vuelve a intentarlo.';
  }
  return 'Ha ocurrido un error con el servicio de IA. Vuelve a intentarlo en unos segundos.';
}
