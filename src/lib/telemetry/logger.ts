type LogLevel = "debug" | "info" | "warn" | "error";

const PII_KEYS = new Set(["email", "password", "token", "ip", "phone", "address"]);

function redact(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (PII_KEYS.has(k.toLowerCase())) {
      out[k] = "[REDACTED]";
    } else if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      out[k] = redact(v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(meta ? redact(meta) : {}),
  };

  if (process.env["NODE_ENV"] === "production") {
    // In prod, structured JSON — picked up by next-axiom's withAxiom wrapper
    // next-axiom intercepts console.log and ships to Axiom
    console.log(JSON.stringify(entry));
  } else {
    const fn =
      level === "error"
        ? console.error
        : level === "warn"
          ? console.warn
          : console.log;
    fn(`[${level.toUpperCase()}] ${message}`, meta ? redact(meta) : "");
  }
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => log("debug", message, meta),
  info: (message: string, meta?: Record<string, unknown>) => log("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log("error", message, meta),
};
