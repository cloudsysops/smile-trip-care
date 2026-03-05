type LogLevel = "info" | "warn" | "error" | "debug";

interface LogPayload {
  level: LogLevel;
  message: string;
  request_id?: string;
  [key: string]: unknown;
}

function write(payload: LogPayload) {
  const line = JSON.stringify({
    ...payload,
    timestamp: new Date().toISOString(),
  });
  if (payload.level === "error") {
    process.stderr.write(line + "\n");
  } else {
    process.stdout.write(line + "\n");
  }
}

/** Structured logger. Include request_id when available (e.g. from API route). */
export function createLogger(requestId?: string) {
  const meta = requestId ? { request_id: requestId } : {};
  return {
    info(message: string, extra?: Record<string, unknown>) {
      write({ level: "info", message, ...meta, ...extra });
    },
    warn(message: string, extra?: Record<string, unknown>) {
      write({ level: "warn", message, ...meta, ...extra });
    },
    error(message: string, extra?: Record<string, unknown>) {
      write({ level: "error", message, ...meta, ...extra });
    },
    debug(message: string, extra?: Record<string, unknown>) {
      if (process.env.NODE_ENV === "development") {
        write({ level: "debug", message, ...meta, ...extra });
      }
    },
  };
}

/** Default logger (no request_id). Use createLogger(request_id) in API routes. */
export const logger = createLogger();
