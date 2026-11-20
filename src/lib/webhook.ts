/**
 * Webhook configuration helpers (FEAT-018).
 *
 * The backend fires an HTTPS POST to `url` on every transaction confirmation.
 * The frontend is responsible only for displaying and saving the configuration;
 * the actual dispatch happens server-side.
 */

export interface WebhookConfig {
  url: string;
  secret: string; // HMAC-SHA256 signing secret; shown once on creation
  events: WebhookEvent[];
  enabled: boolean;
}

export type WebhookEvent =
  | 'transaction.completed'
  | 'transaction.voided'
  | 'transaction.refunded';

export const WEBHOOK_EVENTS: { value: WebhookEvent; label: string }[] = [
  { value: 'transaction.completed', label: 'Transaction completed' },
  { value: 'transaction.voided', label: 'Transaction voided' },
  { value: 'transaction.refunded', label: 'Transaction refunded' },
];

/** Validate that a webhook URL is a reachable HTTPS endpoint. */
export function validateWebhookUrl(url: string): string | null {
  if (!url.trim()) return 'URL is required';
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return 'URL must use HTTPS';
    return null;
  } catch {
    return 'URL is not valid';
  }
}
