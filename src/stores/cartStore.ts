import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CatalogProduct, Customer } from '@/types';
import { taxCents } from '@/utils/helpers';

export interface CartLine {
  product: CatalogProduct;
  quantity: number;
}

interface CartState {
  lines: CartLine[];
  customer: Customer | null;
  discountCents: number;
  add: (product: CatalogProduct, quantity?: number) => boolean;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  setCustomer: (customer: Customer | null) => void;
  setDiscount: (cents: number) => void;
  clear: () => void;
}

/**
 * The order in progress survives a page reload (accidental refresh, browser
 * restart, reloading while offline). Saved per device in localStorage.
 */
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      customer: null,
      discountCents: 0,

      /** Adds to the cart. Returns false when that would exceed available stock. */
      add: (product, quantity = 1) => {
        const existing = get().lines.find((l) => l.product.id === product.id);
        const next = (existing?.quantity ?? 0) + quantity;
        if (next > product.stock) return false;
        set(({ lines }) => ({
          lines: existing
            ? lines.map((l) => (l.product.id === product.id ? { ...l, quantity: next } : l))
            : [...lines, { product, quantity }],
        }));
        return true;
      },

      setQuantity: (productId, quantity) =>
        set(({ lines }) => ({
          lines:
            quantity <= 0
              ? lines.filter((l) => l.product.id !== productId)
              : lines.map((l) =>
                  l.product.id === productId
                    ? { ...l, quantity: Math.min(quantity, l.product.stock) }
                    : l,
                ),
        })),

      remove: (productId) =>
        set(({ lines }) => ({ lines: lines.filter((l) => l.product.id !== productId) })),
      setCustomer: (customer) => set({ customer }),
      setDiscount: (cents) => set({ discountCents: Math.max(0, Math.round(cents)) }),
      clear: () => set({ lines: [], customer: null, discountCents: 0 }),
    }),
    {
      name: 'stellarpos.cart',
      partialize: ({ lines, customer, discountCents }) => ({ lines, customer, discountCents }),
    },
  ),
);

export interface CartTotals {
  itemCount: number;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
}

/** Same arithmetic as the backend, so the screen never disagrees with the receipt. */
export function computeTotals(
  lines: CartLine[],
  discountCents: number,
  taxRateBps: number,
): CartTotals {
  const subtotal = lines.reduce((sum, l) => sum + l.product.priceCents * l.quantity, 0);
  const discount = Math.min(discountCents, subtotal);
  const tax = taxCents(subtotal - discount, taxRateBps);
  return {
    itemCount: lines.reduce((n, l) => n + l.quantity, 0),
    subtotalCents: subtotal,
    discountCents: discount,
    taxCents: tax,
    totalCents: subtotal - discount + tax,
  };
}
