import { api } from '@/lib/api';
import { fetchAllOrders } from '@/lib/exportOrders';
import type { Transaction } from '@/types';

export interface SettlementReportRow {
  reference: string;
  cashier: string;
  totalCents: number;
  taxCents: number;
  discountCents: number;
  tipCents: number;
  status: string;
  completedAt: string;
}

export interface SettlementReport {
  date: string; // YYYY-MM-DD in merchant timezone
  timezone: string;
  currency: string;
  transactionCount: number;
  grossRevenueCents: number;
  taxCents: number;
  discountCents: number;
  tipCents: number;
  netRevenueCents: number;
  rows: SettlementReportRow[];
}

/** Returns the YYYY-MM-DD date string for a UTC ISO timestamp in a given IANA timezone. */
export function toLocalDate(isoUtc: string, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, dateStyle: 'short' }).format(
    new Date(isoUtc),
  );
}

/** Returns midnight of `date` (YYYY-MM-DD) in `timezone` as a UTC ISO string. */
export function localMidnightUtc(date: string, timezone: string): string {
  const [year, month, day] = date.split('-').map(Number);
  // Intl doesn't expose inverse; use the fact that Date.UTC + offset gets midnight.
  // We construct the wall-clock midnight in the target timezone by trial adjustment.
  const approx = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const localDateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    dateStyle: 'short',
  }).format(approx);
  // If local date matches, search backwards/forwards to find actual midnight offset.
  let lo = -14 * 60,
    hi = 14 * 60;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const candidate = new Date(Date.UTC(year, month - 1, day, 0, -mid, 0));
    const local = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      dateStyle: 'short',
    }).format(candidate);
    if (local <= localDateStr) hi = mid;
    else lo = mid + 1;
  }
  void localDateStr; // suppress unused
  return new Date(Date.UTC(year, month - 1, day, 0, -lo, 0)).toISOString();
}

function txTipCents(tx: Transaction): number {
  return Math.max(0, tx.paidCents - tx.totalCents);
}

export function buildReport(
  transactions: Transaction[],
  date: string,
  timezone: string,
  currency: string,
): SettlementReport {
  const completed = transactions.filter(
    (tx) => tx.status === 'completed' && tx.completedAt !== null,
  );

  let grossRevenueCents = 0;
  let taxCents = 0;
  let discountCents = 0;
  let tipCents = 0;

  const rows: SettlementReportRow[] = completed.map((tx) => {
    const tip = txTipCents(tx);
    grossRevenueCents += tx.totalCents;
    taxCents += tx.taxCents;
    discountCents += tx.discountCents;
    tipCents += tip;
    return {
      reference: tx.reference,
      cashier: tx.cashierName ?? '—',
      totalCents: tx.totalCents,
      taxCents: tx.taxCents,
      discountCents: tx.discountCents,
      tipCents: tip,
      status: tx.status,
      completedAt: tx.completedAt!,
    };
  });

  return {
    date,
    timezone,
    currency,
    transactionCount: completed.length,
    grossRevenueCents,
    taxCents,
    discountCents,
    tipCents,
    netRevenueCents: grossRevenueCents - taxCents - discountCents,
    rows,
  };
}

/**
 * Fetches all completed transactions for `date` (YYYY-MM-DD, merchant timezone),
 * builds the settlement report, and posts it to the API, which emails it.
 */
export async function generateAndSendSettlementReport(
  date: string,
  timezone: string,
  currency: string,
  signal?: AbortSignal,
): Promise<SettlementReport> {
  const startUtc = localMidnightUtc(date, timezone);
  const nextDate = new Date(new Date(startUtc).getTime() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const endUtc = localMidnightUtc(nextDate, timezone);

  const transactions = await fetchAllOrders(
    { from: startUtc, to: endUtc, status: 'completed' },
    undefined,
    signal,
  );

  const report = buildReport(transactions, date, timezone, currency);

  await api.post('/store/settlement-report', report);

  return report;
}
