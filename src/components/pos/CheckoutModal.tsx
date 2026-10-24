import { Banknote, CreditCard, Printer, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useCreateSale, useRecordPayment, useTransaction, useVoidSale } from '@/hooks/queries';
import { useFormatMoney } from '@/hooks/useFormatMoney';
import { useT } from '@/i18n';
import { METHOD_LABEL, quickTenders } from '@/lib/pos';
import { useCartStore } from '@/stores/cartStore';
import type { PaymentMethod, Transaction } from '@/types';
import { cn, parseCents } from '@/utils/helpers';
import { MethodBadge } from '../ui/Badge';
import Button from '../ui/Button';
import { Input } from '../ui/Field';
import LoadingSpinner from '../ui/LoadingSpinner';
import Modal from '../ui/Modal';
import Money from '../ui/Money';
import ReceiptView from './ReceiptView';
import StellarCheckout from './StellarCheckout';

const TABS: { method: PaymentMethod; icon: typeof Banknote; tone: string }[] = [
  { method: 'cash', icon: Banknote, tone: 'data-[on=true]:border-cash data-[on=true]:text-cash' },
  { method: 'card', icon: CreditCard, tone: 'data-[on=true]:border-card data-[on=true]:text-card' },
  {
    method: 'stellar',
    icon: Sparkles,
    tone: 'data-[on=true]:border-lumen data-[on=true]:text-lumen',
  },
];

function CashTender({ sale, onDone }: { sale: Transaction; onDone: (t: Transaction) => void }) {
  const pay = useRecordPayment();
  const t = useT();
  const money = useFormatMoney();
  const [input, setInput] = useState('');
  const tendered = input ? parseCents(input) : sale.balanceCents;
  const valid = tendered !== null && tendered >= sale.balanceCents;

  const submit = (cents: number) =>
    pay.mutate(
      { transactionId: sale.id, method: 'cash', tenderedCents: cents },
      {
        onSuccess: ({ payment, transaction }) => {
          if (payment.changeCents)
            toast.success(t('checkout.changeDue', { amount: money(payment.changeCents) }), {
              duration: 8000,
            });
          onDone(transaction);
        },
        onError: (err) => toast.error(err.message),
      },
    );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {quickTenders(sale.balanceCents).map((cents) => (
          <Button
            key={cents}
            variant="secondary"
            size="lg"
            className="figures"
            onClick={() => submit(cents)}
            disabled={pay.isPending}
          >
            {cents === sale.balanceCents ? t('checkout.exact') : money(cents)}
          </Button>
        ))}
      </div>
      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) submit(tendered!);
        }}
      >
        <Input
          wrapperClassName="flex-1"
          label={t('checkout.cashReceived')}
          inputMode="decimal"
          placeholder={(sale.balanceCents / 100).toFixed(2)}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="figures text-lg"
          error={input && !valid ? t('checkout.lessThanDue') : undefined}
        />
        <Button type="submit" variant="cash" size="lg" disabled={!valid} loading={pay.isPending}>
          {t('checkout.takeCash')}
        </Button>
      </form>
      {valid && tendered! > sale.balanceCents && (
        <p className="rounded-lg bg-cash-soft px-4 py-3 text-cash-ink">
          {t('checkout.changeToGive')}{' '}
          <Money cents={tendered! - sale.balanceCents} className="text-lg font-semibold" />
        </p>
      )}
    </div>
  );
}

function CardTender({ sale, onDone }: { sale: Transaction; onDone: (t: Transaction) => void }) {
  const pay = useRecordPayment();
  const t = useT();
  const [input, setInput] = useState('');
  const amount = input ? parseCents(input) : sale.balanceCents;
  const valid = amount !== null && amount > 0 && amount <= sale.balanceCents;

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        pay.mutate(
          { transactionId: sale.id, method: 'card', amountCents: amount! },
          {
            onSuccess: ({ transaction }) => onDone(transaction),
            onError: (err) => toast.error(err.message),
          },
        );
      }}
    >
      <p className="text-sm text-ink-2">{t('checkout.cardHint')}</p>
      <Input
        label={t('checkout.amountApproved')}
        hint={t('checkout.splitHint')}
        inputMode="decimal"
        placeholder={(sale.balanceCents / 100).toFixed(2)}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="figures text-lg"
        error={input && !valid ? t('checkout.amountInvalid') : undefined}
      />
      <Button
        type="submit"
        variant="card"
        size="lg"
        fullWidth
        disabled={!valid}
        loading={pay.isPending}
      >
        {t('checkout.cardApproved')}
      </Button>
    </form>
  );
}

export interface CheckoutModalProps {
  open: boolean;
  initialMethod: PaymentMethod;
  onClose: () => void;
}

/**
 * Owns the sale lifecycle at the register: creates the pending sale (which
 * reserves stock), takes one or more payments, shows the receipt, and voids
 * the sale if the cashier backs out before any money is taken.
 */
export default function CheckoutModal({ open, initialMethod, onClose }: CheckoutModalProps) {
  const { lines, customer, discountCents, clear } = useCartStore();
  const createSale = useCreateSale();
  const tr = useT();
  const voidSale = useVoidSale();
  const [saleId, setSaleId] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>(initialMethod);
  const [done, setDone] = useState(false);
  const { data: sale, refetch } = useTransaction(saleId);
  const started = useRef(false);

  useEffect(() => {
    if (!open) {
      started.current = false;
      setSaleId(null);
      setDone(false);
      return;
    }
    setMethod(initialMethod);
    if (started.current) return;
    started.current = true;
    createSale.mutate(
      {
        items: lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
        customerId: customer?.id ?? null,
        discountCents,
      },
      {
        onSuccess: (s) => setSaleId(s.id),
        onError: (err) => {
          toast.error(err.message);
          onClose();
        },
      },
    );
    // Start one sale per opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handlePayment = useCallback(
    (t: Transaction) => {
      void refetch();
      if (t.status === 'completed') {
        setDone(true);
        clear();
        toast.success(tr('checkout.saleComplete', { reference: t.reference }));
      }
    },
    [refetch, clear, tr],
  );

  const cancel = () => {
    if (done || !sale) return onClose();
    if (sale.paidCents > 0) {
      toast.error(tr('checkout.partlyPaid'));
      return;
    }
    voidSale.mutate(sale.id, { onSettled: onClose });
  };

  const loading = !sale;
  const title = done ? (
    tr('checkout.paidInFull')
  ) : sale ? (
    <Money cents={sale.balanceCents} />
  ) : (
    tr('checkout.starting')
  );

  return (
    <Modal
      open={open}
      onClose={cancel}
      eyebrow={
        sale
          ? `${sale.reference} / ${done ? tr('checkout.complete') : tr('checkout.balanceDue')}`
          : 'Checkout'
      }
      title={title}
      size="lg"
      footer={
        done ? (
          <>
            <Button
              variant="secondary"
              icon={<Printer className="h-4 w-4" />}
              onClick={() => window.print()}
            >
              {tr('checkout.print')}
            </Button>
            <Button onClick={onClose} autoFocus>
              {tr('checkout.newSale')}
            </Button>
          </>
        ) : (
          <Button variant="ghost" onClick={cancel} loading={voidSale.isPending}>
            {sale && sale.paidCents > 0 ? tr('checkout.close') : tr('checkout.cancelSale')}
          </Button>
        )
      }
    >
      {loading && (
        <div className="grid place-items-center py-16">
          <LoadingSpinner size="lg" label="Reserving stock" />
        </div>
      )}

      {sale && done && <ReceiptView sale={sale} />}

      {sale && !done && (
        <div className="space-y-6">
          {sale.paidCents > 0 && (
            <div className="rounded-lg border border-ink-line bg-paper px-4 py-3 text-sm">
              <p className="eyebrow mb-2">{tr('checkout.paidSoFar')}</p>
              <ul className="space-y-1">
                {sale.payments
                  ?.filter((p) => p.status === 'completed')
                  .map((p) => (
                    <li key={p.id} className="flex items-center justify-between">
                      <MethodBadge method={p.method} />
                      <Money cents={p.amountCents} />
                    </li>
                  ))}
              </ul>
            </div>
          )}

          <div role="tablist" aria-label="Payment method" className="grid grid-cols-3 gap-2">
            {TABS.map(({ method: m, icon: Icon, tone }) => (
              <button
                key={m}
                role="tab"
                aria-selected={method === m}
                data-on={method === m}
                onClick={() => setMethod(m)}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-lg border-2 border-ink-line py-3 font-medium text-ink-3 transition-colors hover:text-ink',
                  tone,
                )}
              >
                <Icon className="h-4 w-4" /> {METHOD_LABEL[m]}
              </button>
            ))}
          </div>

          <div role="tabpanel">
            {method === 'cash' && <CashTender sale={sale} onDone={handlePayment} />}
            {method === 'card' && <CardTender sale={sale} onDone={handlePayment} />}
            {method === 'stellar' && <StellarCheckout sale={sale} onPaid={handlePayment} />}
          </div>
        </div>
      )}
    </Modal>
  );
}
