/**
 * Error reporting and redaction helpers.
 *
 * Two rules apply everywhere in this module:
 *  1. Form values (which contain passwords, one-time codes and tokens) are
 *     never passed to logging or telemetry verbatim. Sensitive keys are
 *     stripped before anything is serialised.
 *  2. Messages from the server are never echoed to the UI or the console.
 *     Only fixed strings from `errorMessages.ts` are user-facing.
 */

import { ApiError } from './api';
import { GENERIC_ERROR, staticErrorMessage, type ErrorContext } from './errorMessages';

const SENSITIVE_KEY =
  /(pass(word|phrase)?|secret|token|api[-_]?key|authorization|credential|otp|one[-_]?time|recovery|private[-_]?key)/i;
const REDACTED = '[REDACTED]';

/** Deep-clones a value for logging, replacing credentials with `[REDACTED]`. */
export function redactSensitive(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Error) {
    // An Error's message may come from an untrusted response; keep only its type.
    return { name: value.name, ...(value instanceof ApiError ? { status: value.status } : {}) };
  }
  if (seen.has(value)) return REDACTED;
  seen.add(value);
  if (Array.isArray(value)) return value.map((item) => redactSensitive(item, seen));
  const clean: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    clean[key] = SENSITIVE_KEY.test(key) ? REDACTED : redactSensitive(item, seen);
  }
  return clean;
}

/** console/telemetry-safe serialisation of diagnostic metadata. */
export function safeStringify(value: unknown): string {
  return JSON.stringify(redactSensitive(value)) ?? 'null';
}

/** Maps any thrown value to a fixed string that is safe to render in the UI. */
export function publicErrorMessage(error: unknown, context: ErrorContext = 'default'): string {
  if (error instanceof ApiError) return staticErrorMessage(error.status, context);
  return GENERIC_ERROR;
}

/**
 * The only logging entry point for failure paths. It records the error class,
 * HTTP status and redacted context — never a password or a server-supplied
 * message.
 */
export function reportError(
  context: string,
  error: unknown,
  details: Record<string, unknown> = {},
): void {
  const meta = {
    context,
    error:
      error instanceof Error
        ? { name: error.name, ...(error instanceof ApiError ? { status: error.status } : {}) }
        : { name: 'UnknownError' },
    details: redactSensitive(details),
  };
  console.error(`[surface] ${context}`, safeStringify(meta));
}
