import { useStoreSettings } from '@/hooks/queries';
import type { Transaction } from '@/types';
import { cn, formatDateTime, truncateMiddle } from '@/utils/helpers';
import { useFormatMoney } from '@/hooks/useFormatMoney';
import { useReceiptStore } from '@/stores/receiptStore';
import { METHOD_LABEL } from '@/lib/pos';

/** A printable 80mm receipt for a sale with its items and payments loaded. */
export default function ReceiptView({
  sale,
  className,
}: {
  sale: Transaction;
  className?: string;
}) {
  const store = useStoreSettings().data;
  const money = useFormatMoney();
  const payments = (sale.payments ?? []).filter((p) => p.status === 'completed');
  const change = payments.reduce((sum, p) => sum + (p.changeCents ?? 0), 0);

  const receipt = useReceiptStore();

  return (
    <div
      className={cn(
        'printable receipt-edge mx-auto w-full max-w-[340px] bg-paper-card px-6 pb-8 pt-6 font-mono text-[13px] shadow-slip',
        className,
      )}
    >
      <p className="text-center font-display text-lg font-bold uppercase">
        {store?.name ?? 'StellarPOS'}
      </p>
      {receipt.header && (
        <p className="whitespace-pre-line text-center text-xs text-ink-2">{receipt.header}</p>
      )}
      <p className="text-center text-xs text-ink-3">
        {sale.reference} / {formatDateTime(sale.createdAt)}
      </p>
      {receipt.showCashier && sale.cashierName && (
        <p className="text-center text-xs text-ink-3">Served by {sale.cashierName}</p>
      )}
      {receipt.showCustomer && sale.customerName && (
        <p className="text-center text-xs text-ink-3">Customer: {sale.customerName}</p>
      )}

      <div className="rule-dashed my-3" />
      {sale.items?.map((item) => (
        <div key={item.id} className="mb-1">
          <div className="flex justify-between gap-2">
            <span className="truncate">{item.name}</span>
            <span className="tabular-nums">{money(item.lineTotalCents)}</span>
          </div>
          {item.quantity > 1 && (
            <p className="text-xs text-ink-3">
              {item.quantity} x {money(item.unitPriceCents)}
            </p>
          )}
        </div>
      ))}
      <div className="rule-dashed my-3" />

      <Row label="Subtotal" value={money(sale.subtotalCents)} />
      {sale.discountCents > 0 && <Row label="Discount" value={`-${money(sale.discountCents)}`} />}
      {sale.taxCents > 0 && <Row label="Tax" value={money(sale.taxCents)} />}
      <Row label={`TOTAL ${store?.currency ?? ''}`} value={money(sale.totalCents)} strong />

      <div className="rule-dashed my-3" />
      {payments.map((p) => (
        <div key={p.id}>
          <Row
            label={METHOD_LABEL[p.method].toUpperCase()}
            value={money(p.tenderedCents ?? p.amountCents)}
          />
          {receipt.showTxHash && p.stellarTxHash && (
            <p className="break-all text-[10px] text-ink-3">
              tx {truncateMiddle(p.stellarTxHash, 10, 10)}
            </p>
          )}
        </div>
      ))}
      {change > 0 && <Row label="CHANGE" value={money(change)} strong />}
      {sale.status !== 'completed' && (
        <p className="mt-2 text-center font-semibold uppercase text-signal">{sale.status}</p>
      )}
      {receipt.footer && (
        <p className="mt-4 whitespace-pre-line text-center text-xs text-ink-3">{receipt.footer}</p>
      )}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn('flex justify-between gap-2', strong && 'text-[15px] font-semibold')}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
