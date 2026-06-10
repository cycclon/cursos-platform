/**
 * In-memory capture of console errors/warnings and uncaught runtime errors,
 * so a bug report can ship the breadcrumbs that led up to it.
 *
 * The browser gives no way to read DevTools history after the fact, so this
 * must be installed at startup (see main.tsx) — it only records what happens
 * *after* installLogCapture() runs. It wraps the native console methods
 * (always calling through to them) and listens for global error events.
 */

type CapturedLevel = 'error' | 'warn' | 'exception' | 'unhandledrejection' | 'network';

interface CapturedLog {
  level: CapturedLevel;
  ts: number;
  text: string;
}

const MAX_ENTRIES = 60;
const MAX_TEXT_LEN = 1000;
const MAX_OUTPUT_LEN = 9000;

const buffer: CapturedLog[] = [];
let installed = false;

/** Light redaction so we don't ship obvious secrets in the logs. */
function redact(s: string): string {
  return s
    .replace(/eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g, '[jwt]')
    .replace(/\b[A-Fa-f0-9]{32,}\b/g, '[hex]')
    .replace(/(authorization|bearer|token|password|secret)([=:\s]+)[^\s,;"']+/gi, '$1$2[redacted]');
}

function push(level: CapturedLevel, text: string): void {
  if (!text) return;
  buffer.push({ level, ts: Date.now(), text: redact(text).slice(0, MAX_TEXT_LEN) });
  if (buffer.length > MAX_ENTRIES) buffer.splice(0, buffer.length - MAX_ENTRIES);
}

function stringifyArg(arg: unknown): string {
  if (typeof arg === 'string') return arg;
  if (arg instanceof Error) return `${arg.name}: ${arg.message}${arg.stack ? `\n${arg.stack}` : ''}`;
  try {
    return JSON.stringify(arg);
  } catch {
    return String(arg);
  }
}

const formatArgs = (args: unknown[]): string => args.map(stringifyArg).join(' ');

/** Manually record a breadcrumb (used by the API client for failed requests). */
export function recordClientLog(level: CapturedLevel, text: string): void {
  push(level, text);
}

export function installLogCapture(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  (['error', 'warn'] as const).forEach((level) => {
    const original = console[level].bind(console);
    console[level] = (...args: unknown[]) => {
      try {
        push(level, formatArgs(args));
      } catch {
        /* never let capture break the console */
      }
      original(...args);
    };
  });

  window.addEventListener('error', (e) => {
    const msg =
      e.error instanceof Error
        ? `${e.error.name}: ${e.error.message}\n${e.error.stack ?? ''}`
        : `${e.message} (${e.filename}:${e.lineno}:${e.colno})`;
    push('exception', msg);
  });

  window.addEventListener('unhandledrejection', (e) => {
    const r = (e as PromiseRejectionEvent).reason;
    const msg =
      r instanceof Error ? `${r.name}: ${r.message}\n${r.stack ?? ''}` : stringifyArg(r);
    push('unhandledrejection', `Promesa no manejada: ${msg}`);
  });
}

/** Number of entries currently buffered. */
export function getCapturedLogCount(): number {
  return buffer.length;
}

/**
 * The recent log entries as a single bounded, human-readable string
 * (newest kept), or undefined when nothing has been captured.
 */
export function getRecentLogs(): string | undefined {
  if (buffer.length === 0) return undefined;
  const text = buffer
    .map((l) => {
      const t = new Date(l.ts).toLocaleTimeString('es-AR', { hour12: false });
      return `[${t}] ${l.level.toUpperCase()}: ${l.text}`;
    })
    .join('\n');
  return text.length > MAX_OUTPUT_LEN ? text.slice(-MAX_OUTPUT_LEN) : text;
}
