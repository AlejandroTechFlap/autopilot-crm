/**
 * Structured logger.
 *
 * Use this instead of `console.*` so logs carry consistent metadata
 * (scope, event, request ids, durations) and can be parsed by log
 * aggregators in production.
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.info({ scope: 'api.deals.move', event: 'success', dealId, durationMs });
 *   logger.error({ scope: 'api.deals.move', event: 'failed', dealId, err });
 *
 * In production this emits one-line JSON (easy to ingest). In dev it
 * prints a colorised, human-friendly line.
 */

type Level = 'debug' | 'info' | 'warn' | 'error';

interface LogPayload {
  /** Dotted path identifying the module/route, e.g. `api.deals.move` */
  scope: string;
  /** Short event name, e.g. `success`, `failed`, `validation_error` */
  event: string;
  /** Optional Error object — its message + stack are extracted */
  err?: unknown;
  /** Any additional structured fields */
  [key: string]: unknown;
}

const isProd = process.env.NODE_ENV === 'production';

const LEVEL_PRIORITY: Record<Level, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

// In production we drop debug noise.
const minLevel: Level = isProd ? 'info' : 'debug';

const COLORS: Record<Level, string> = {
  debug: '\x1b[90m', // gray
  info: '\x1b[36m',  // cyan
  warn: '\x1b[33m',  // yellow
  error: '\x1b[31m', // red
};
const RESET = '\x1b[0m';

function serialiseError(err: unknown): { message: string; stack?: string } {
  if (err instanceof Error) {
    return { message: err.message, stack: err.stack };
  }
  return { message: String(err) };
}

function log(level: Level, payload: LogPayload): void {
  if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[minLevel]) return;

  const { scope, event, err, ...meta } = payload;
  const errorFields = err !== undefined ? { error: serialiseError(err) } : {};

  const record = {
    level,
    timestamp: new Date().toISOString(),
    scope,
    event,
    ...meta,
    ...errorFields,
  };

  if (isProd) {
    // One-line JSON: easiest to ship to a log aggregator.
    const line = JSON.stringify(record);
    if (level === 'error') console.error(line);
    else if (level === 'warn') console.warn(line);
    else console.log(line);
    return;
  }

  // Dev: pretty colourised line.
  const color = COLORS[level];
  const tag = `${color}[${level.toUpperCase()}]${RESET}`;
  const head = `${tag} ${scope} · ${event}`;
  const rest = { ...meta, ...errorFields };
  const hasRest = Object.keys(rest).length > 0;

  if (level === 'error') {
    console.error(head, hasRest ? rest : '');
  } else if (level === 'warn') {
    console.warn(head, hasRest ? rest : '');
  } else {
    console.log(head, hasRest ? rest : '');
  }
}

export const logger = {
  debug: (payload: LogPayload) => log('debug', payload),
  info: (payload: LogPayload) => log('info', payload),
  warn: (payload: LogPayload) => log('warn', payload),
  error: (payload: LogPayload) => log('error', payload),
};
