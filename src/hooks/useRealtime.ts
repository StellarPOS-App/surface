import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import type { PaymentRequest, Product, Transaction } from '@/types';

export type Connection = 'connecting' | 'live' | 'offline';

type Listener = (event: string, payload: unknown) => void;
const listeners = new Set<Listener>();

/** Subscribe to raw realtime events from anywhere (e.g. the QR checkout). */
export function onRealtime(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Keeps one Socket.IO connection per signed-in session and turns server
 * events into cache invalidations and toasts, so every terminal stays in
 * sync without polling.
 */
export function useRealtime(): Connection {
  const token = useAuthStore((s) => s.token);
  const qc = useQueryClient();
  const [state, setState] = useState<Connection>('connecting');

  useEffect(() => {
    if (!token) return;
    const socket: Socket = io(import.meta.env.VITE_SOCKET_URL || undefined, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    const refresh = (...roots: string[]) =>
      roots.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
    const dispatch = (event: string) => (payload: unknown) => {
      listeners.forEach((l) => l(event, payload));
    };

    socket.on('connect', () => setState('live'));
    socket.on('disconnect', () => setState('offline'));
    socket.on('connect_error', () => setState('offline'));

    socket.on('payment:confirmed', (p: { request: PaymentRequest; transaction: Transaction }) => {
      dispatch('payment:confirmed')(p);
      refresh('transactions', 'analytics', 'products');
      qc.setQueryData(['payment-requests', p.request.id], p.request);
    });
    socket.on('payment:expired', (r: PaymentRequest) => {
      dispatch('payment:expired')(r);
      qc.setQueryData(['payment-requests', r.id], r);
      refresh('transactions', 'products');
    });
    socket.on('transaction:completed', (t: Transaction) => {
      dispatch('transaction:completed')(t);
      refresh('transactions', 'analytics', 'customers');
    });
    socket.on('inventory:low', (items: Pick<Product, 'name' | 'stock'>[]) => {
      refresh('products');
      for (const item of items) {
        toast.warning(`Low stock: ${item.name}`, {
          description: `${item.stock} left`,
          id: `low-${item.name}`,
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [token, qc]);

  return token ? state : 'offline';
}
