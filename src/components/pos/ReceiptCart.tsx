import {
  Banknote,
  CreditCard,
  Minus,
  Plus,
  Sparkles,
  Tag,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useStoreSettings } from '@/hooks/queries';
import { useT } from '@/i18n';
import { computeTotals, useCartStore } from '@/stores/cartStore';
import type { PaymentMethod } from '@/types';
import { parseCents } from '@/utils/helpers';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import Money from '../ui/Money';
import CustomerPicker from './CustomerPicker';

/** The order in progress, laid out like the receipt it will become. */
export default function ReceiptCart({ onCharge }: { onCharge: (method: PaymentMethod) => void }) {
  const store = useStoreSettings().data;
  const { lines, customer, discountCents, setQuantity, remove, setCustomer, setDiscount, clear } =
    useCartStore();
  const totals = computeTotals(lines, discountCents, store?.taxRateBps ?? 0);
  const [picking, setPicking] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [discountInput, setDiscountInput] = useState('');
  const empty = lines.length === 0;
  const t = useT();

  return (
    <section
      aria-label={t('cart.current')}
      className="receipt-edge flex h-full flex-col bg-paper-card shadow-slip"
    >
      <header className="px-5 pt-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="eyebrow">{t('cart.inProgress')}</p>
            <p className="font-display text-xl font-bold">
              {t('cart.items', { count: totals.itemCount })}
            </p>
          </div>
          {!empty && (
            <button
              onClick={clear}
              className="rounded-md p-2 text-ink-3 hover:bg-paper-2 hover:text-signal"
              aria-label={t('cart.clear')}
              title={t('cart.clear')}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => (customer ? setCustomer(null) : setPicking(true))}
          className="mt-3 flex w-full items-center gap-2 rounded-md border border-dashed border-ink-line px-3 py-2 text-left text-sm text-ink-2 hover:border-ink hover:text-ink"
        >
          <UserRound className="h-4 w-4" />
          {customer ? (
            <>
              <span className="flex-1 font-medium text-ink">{customer.name}</span>
              <X className="h-4 w-4" aria-label={t('cart.removeCustomer')} />
            </>
          ) : (
            <span className="flex-1">{t('cart.attachCustomer')}</span>
          )}
        </button>
      </header>

      <div className="rule-dashed mx-5 mt-4" />

      <ol className="scroll-thin flex-1 overflow-y-auto px-5 py-2">
        {empty && <EmptyState title={t('cart.emptyTitle')}>{t('cart.emptyHint')}</EmptyState>}
        {lines.map(({ product, quantity }) => (
          <li
            key={product.id}
            className="group flex animate-print-in items-center gap-3 py-2.5 font-mono text-sm"
          >
            <div className="flex items-center rounded-md border border-ink-line">
              <button
                className="p-2.5 hover:bg-paper-2 lg:p-1.5"
                onClick={() => setQuantity(product.id, quantity - 1)}
                aria-label={t('cart.oneLess', { name: product.name })}
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-7 text-center tabular-nums" aria-label="Quantity">
                {quantity}
              </span>
              <button
                className="p-2.5 hover:bg-paper-2 disabled:opacity-30 lg:p-1.5"
                onClick={() => setQuantity(product.id, quantity + 1)}
                disabled={quantity >= product.stock}
                aria-label={t('cart.oneMore', { name: product.name })}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <span className="min-w-0 flex-1 truncate font-sans">{product.name}</span>
            <Money cents={product.priceCents * quantity} />
            <button
              onClick={() => remove(product.id)}
              className="text-ink-3 transition-opacity hover:text-signal focus:opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
              aria-label={t('cart.remove', { name: product.name })}
            >
              <X className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ol>

      <div className="rule-dashed mx-5" />

      <dl className="space-y-1 px-5 py-4 font-mono text-sm">
        <div className="flex justify-between text-ink-2">
          <dt>{t('cart.subtotal')}</dt>
          <dd>
            <Money cents={totals.subtotalCents} />
          </dd>
        </div>
        <div className="flex items-center justify-between text-ink-2">
          <dt>
            <button
              className="inline-flex items-center gap-1 underline-offset-2 hover:text-ink hover:underline disabled:opacity-40"
              onClick={() => setDiscountOpen((v) => !v)}
              disabled={empty}
            >
              <Tag className="h-3.5 w-3.5" /> {t('cart.discount')}
            </button>
          </dt>
          <dd>{totals.discountCents ? <Money cents={-totals.discountCents} signed /> : '-'}</dd>
        </div>
        {discountOpen && (
          <form
            className="flex gap-2 py-1"
            onSubmit={(e) => {
              e.preventDefault();
              const cents = parseCents(discountInput);
              if (cents !== null) setDiscount(cents);
              setDiscountOpen(false);
            }}
          >
            <input
              autoFocus
              inputMode="decimal"
              placeholder="0.00"
              value={discountInput}
              onChange={(e) => setDiscountInput(e.target.value)}
              className="figures h-8 flex-1 rounded-md border-ink-line bg-paper text-sm"
              aria-label={t('cart.discountAmount')}
            />
            <Button size="sm" type="submit">
              {t('cart.apply')}
            </Button>
          </form>
        )}
        {(store?.taxRateBps ?? 0) > 0 && (
          <div className="flex justify-between text-ink-2">
            <dt>{t('cart.tax', { rate: (store!.taxRateBps / 100).toFixed(2) })}</dt>
            <dd>
              <Money cents={totals.taxCents} />
            </dd>
          </div>
        )}
        <div className="flex items-baseline justify-between pt-2 font-display">
          <dt className="text-lg font-bold">{t('cart.total')}</dt>
          <dd>
            <Money cents={totals.totalCents} className="text-3xl font-semibold" />
          </dd>
        </div>
      </dl>

      <div className="grid grid-cols-3 gap-2 px-5 pb-6">
        <Button
          variant="cash"
          size="xl"
          className="flex-col gap-0.5 px-2 text-base"
          disabled={empty}
          onClick={() => onCharge('cash')}
        >
          <Banknote className="h-5 w-5" /> {t('cart.cash')}
        </Button>
        <Button
          variant="card"
          size="xl"
          className="flex-col gap-0.5 px-2 text-base"
          disabled={empty}
          onClick={() => onCharge('card')}
        >
          <CreditCard className="h-5 w-5" /> {t('cart.card')}
        </Button>
        <Button
          variant="lumen"
          size="xl"
          className="flex-col gap-0.5 px-2 text-base"
          disabled={empty}
          onClick={() => onCharge('stellar')}
        >
          <Sparkles className="h-5 w-5" /> {t('cart.stellar')}
        </Button>
      </div>

      <CustomerPicker
        open={picking}
        onClose={() => setPicking(false)}
        onPick={(c) => {
          setCustomer(c);
          setPicking(false);
        }}
      />
    </section>
  );
}
