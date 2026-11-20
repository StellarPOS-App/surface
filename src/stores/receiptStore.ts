import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ReceiptOptions {
  /** Lines under the store name, e.g. address and phone. */
  header: string;
  /** Closing message, e.g. returns policy or wifi password. */
  footer: string;
  showCashier: boolean;
  showCustomer: boolean;
  /** Print the Stellar transaction hash so customers can look the payment up. */
  showTxHash: boolean;
}

export const DEFAULT_RECEIPT: ReceiptOptions = {
  header: '',
  footer: 'Thank you',
  showCashier: true,
  showCustomer: true,
  showTxHash: true,
};

export const MAX_HEADER = 120;
export const MAX_FOOTER = 200;

interface ReceiptState extends ReceiptOptions {
  update: (patch: Partial<ReceiptOptions>) => void;
  reset: () => void;
}

/** Saved per device, since each till usually has its own printer and counter. */
export const useReceiptStore = create<ReceiptState>()(
  persist(
    (set) => ({
      ...DEFAULT_RECEIPT,
      update: (patch) =>
        set({
          ...patch,
          ...(patch.header !== undefined && { header: patch.header.slice(0, MAX_HEADER) }),
          ...(patch.footer !== undefined && { footer: patch.footer.slice(0, MAX_FOOTER) }),
        }),
      reset: () => set(DEFAULT_RECEIPT),
    }),
    { name: 'stellarpos.receipt' },
  ),
);
