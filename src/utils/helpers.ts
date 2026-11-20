import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

const currencyFormatters = new Map<string, Intl.NumberFormat>();

/** Formats integer cents as currency, e.g. 1250 -> "$12.50". */
export function formatCurrency(cents: number, currency = 'USD', locale?: string): string {
  const key = `${currency}|${locale ?? ''}`;
  let fmt = currencyFormatters.get(key);
  if (!fmt) {
    // narrowSymbol prints "$" rather than "US$" whatever the browser locale.
    fmt = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
    });
    currencyFormatters.set(key, fmt);
  }
  return fmt.format(cents / 100);
}

/** Parses user input like "12.5" or "12,50" into integer cents. Returns null if invalid. */
export function parseCents(input: string): number | null {
  const normalized = input.trim().replace(',', '.');
  if (!/^\d+(\.\d{0,2})?$/.test(normalized)) return null;
  const [whole, frac = ''] = normalized.split('.');
  return Number(whole) * 100 + Number(frac.padEnd(2, '0'));
}

/** "12.5000000" -> "12.50"; keeps up to 7 decimals but trims trailing zeros past 2. */
export function formatAssetAmount(amount: string): string {
  const [whole, frac = ''] = amount.split('.');
  const trimmed = frac.replace(/0+$/, '');
  return `${Number(whole).toLocaleString()}.${trimmed.padEnd(2, '0')}`;
}

/** SQLite timestamps are UTC without a zone ("2026-01-02 10:00:00"). */
export function parseTimestamp(value: string): Date {
  return new Date(value.includes('T') ? value : `${value.replace(' ', 'T')}Z`);
}

export function formatDateTime(value: string, opts?: Intl.DateTimeFormatOptions): string {
  return parseTimestamp(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
    ...opts,
  });
}

export function formatTime(value: string): string {
  return parseTimestamp(value).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function relativeTime(value: string, now = Date.now()): string {
  const seconds = Math.round((parseTimestamp(value).getTime() - now) / 1000);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  const abs = Math.abs(seconds);
  if (abs < 60) return rtf.format(seconds, 'second');
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), 'hour');
  return rtf.format(Math.round(seconds / 86400), 'day');
}

/** GABC...WXYZ for long Stellar keys and hashes. */
export function truncateMiddle(value: string, head = 4, tail = 4): string {
  return value.length <= head + tail + 1
    ? value
    : `${value.slice(0, head)}...${value.slice(-tail)}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
}

export const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

/** Tax on cents in basis points, rounded half up (mirrors the backend). */
export const taxCents = (amountCents: number, rateBps: number) =>
  Math.floor((amountCents * rateBps + 5_000) / 10_000);
