/**
 * Lightweight client-side logger.
 * - Buffers recent events in memory (for debugging in dev tools).
 * - Forwards errors to console with structured context.
 * - Safe to call from anywhere; never throws.
 */

type Level = "info" | "warn" | "error";

interface LogEntry {
  level: Level;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

const BUFFER_LIMIT = 100;
const buffer: LogEntry[] = [];

function record(level: Level, message: string, context?: Record<string, unknown>) {
  const entry: LogEntry = {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
  };
  buffer.push(entry);
  if (buffer.length > BUFFER_LIMIT) buffer.shift();

  const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.info;
  try {
    fn(`[${level}] ${message}`, context ?? "");
  } catch {
    /* noop */
  }
}

export const logger = {
  info: (msg: string, ctx?: Record<string, unknown>) => record("info", msg, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>) => record("warn", msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => record("error", msg, ctx),
  recent: () => [...buffer],
};

// Global handlers — capture uncaught errors and unhandled promise rejections.
if (typeof window !== "undefined") {
  window.addEventListener("error", (e) => {
    logger.error("window.error", {
      message: e.message,
      filename: e.filename,
      lineno: e.lineno,
      colno: e.colno,
    });
  });
  window.addEventListener("unhandledrejection", (e) => {
    logger.error("unhandledrejection", {
      reason: e.reason instanceof Error ? e.reason.message : String(e.reason),
    });
  });
}
