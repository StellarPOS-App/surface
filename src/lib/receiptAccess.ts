/**
 * Receipt access guard.
 *
 * Receipts must never be reachable through a guessable public URL such as
 * `/receipts/12345`. They are loaded only through the authenticated
 * transactions API, which the backend scopes to the signed-in merchant's
 * store. The checks here are defence in depth; the backend must still
 * authorise every request.
 */

import { useAuthStore } from '@/stores/authStore';
import type { Transaction } from '@/types';
import { api } from './api';
import { publicErrorMessage } from './safeErrors';

const RECEIPT_ID = /^[A-Za-z0-9_-]{1,64}$/;

export type ReceiptAccessFailure = 'unauthenticated' | 'invalid-id' | 'not-found';

export class ReceiptAccessError extends Error {
  constructor(readonly reason: ReceiptAccessFailure) {
    super(reason);
    this.name = 'ReceiptAccessError';
  }
}

export async function loadReceipt(id: string): Promise<Transaction> {
  const { isAuthenticated, token } = useAuthStore.getState();
  if (!isAuthenticated || !token) throw new ReceiptAccessError('unauthenticated');
  if (!RECEIPT_ID.test(id)) throw new ReceiptAccessError('invalid-id');

  const sale = await api.get<Transaction>(`/transactions/${encodeURIComponent(id)}`);
  if (!sale || typeof sale !== 'object' || sale.id !== id) {
    throw new ReceiptAccessError('not-found');
  }
  return sale;
}

export function receiptAccessMessage(error: unknown): string {
  if (error instanceof ReceiptAccessError) {
    switch (error.reason) {
      case 'unauthenticated':
        return 'Sign in to view this receipt.';
      case 'invalid-id':
        return 'This receipt link is not valid.';
      case 'not-found':
        return 'This receipt could not be found.';
    }
  }
  return publicErrorMessage(error, 'receipt');
}
