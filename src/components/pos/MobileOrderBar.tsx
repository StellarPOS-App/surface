import { ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { useStoreSettings } from '@/hooks/queries';
import { useT } from '@/i18n';
import { computeTotals, useCartStore } from '@/stores/cartStore';
import type { PaymentMethod } from '@/types';
import Modal from '../ui/Modal';
import Money from '../ui/Money';
import ReceiptCart from './ReceiptCart';

/**
 * Phones and small tablets: the order lives in a sticky bar at the bottom of
 * the register instead of below the whole product grid. Tapping it opens the
 * full order as a bottom sheet, with the same tender buttons.
 */
export default function MobileOrderBar({
  onCharge,
}: {
  onCharge: (method: PaymentMethod) => void;
}) {
  const [open, setOpen] = useState(false);
  const t = useT();
  const taxRateBps = useStoreSettings().data?.taxRateBps ?? 0;
  const { lines, discountCents } = useCartStore();
  const totals = computeTotals(lines, discountCents, taxRateBps);

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-ink-line bg-paper/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-14 w-full items-center gap-3 rounded-xl bg-ink px-4 text-paper shadow-press active:translate-y-px"
          aria-label={t('cart.viewOrder', { items: t('cart.items', { count: totals.itemCount }) })}
        >
          <ShoppingBag className="h-5 w-5" />
          <span className="font-medium">
            {totals.itemCount === 0
              ? t('cart.noItems')
              : t('cart.items', { count: totals.itemCount })}
          </span>
          <span className="ml-auto flex items-center gap-2">
            <Money cents={totals.totalCents} className="text-lg font-semibold" />
            <span className="text-sm text-paper/70">{t('cart.view')}</span>
          </span>
        </button>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        eyebrow={t('nav.register')}
        title={t('cart.current')}
      >
        <div className="-mx-6 -my-5">
          <ReceiptCart
            onCharge={(method) => {
              setOpen(false);
              onCharge(method);
            }}
          />
        </div>
      </Modal>
    </>
  );
}
