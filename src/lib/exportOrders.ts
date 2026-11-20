import type { TransactionQuery } from '@/hooks/queries';
import { api } from '@/lib/api';
import { toCsv } from '@/lib/csv';
import type { Paginated, Transaction } from '@/types';

const PAGE = 100;

/**
 * Fetches every sale matching `filter`, one page at a time, so exports of
 * any size work without one huge response. Calls `onProgress` after each page.
 */
export async function fetchAllOrders(
  filter: TransactionQuery,
  onProgress?: (done: number, total: number) => void,
  signal?: AbortSignal,
): Promise<Transaction[]> {
  const all: Transaction[] = [];
  for (let page = 1; ; page++) {
    if (signal?.aborted) throw new DOMException('Export cancelled', 'AbortError');
    const res = await api.getPage<Paginated<Transaction>>(
      '/transactions',
      { ...filter, page, limit: PAGE },
      signal,
    );
    all.push(...res.data);
    onProgress?.(all.length, res.pagination.total);
    if (page >= res.pagination.pages || res.data.length === 0) return all;
  }
}

const money = (cents: number) => (cents / 100).toFixed(2);

export function ordersToCsv(orders: Transaction[]): string {
  return toCsv(orders, [
    { header: 'Reference', value: (t) => t.reference },
    { header: 'Created (UTC)', value: (t) => t.createdAt },
    { header: 'Status', value: (t) => t.status },
    { header: 'Cashier', value: (t) => t.cashierName },
    { header: 'Customer', value: (t) => t.customerName },
    { header: 'Subtotal', value: (t) => money(t.subtotalCents) },
    { header: 'Discount', value: (t) => money(t.discountCents) },
    { header: 'Tax', value: (t) => money(t.taxCents) },
    { header: 'Total', value: (t) => money(t.totalCents) },
    { header: 'Paid', value: (t) => money(t.paidCents) },
    { header: 'Note', value: (t) => t.note },
  ]);
}
