import QRCode from 'react-qr-code';
import { useStoreSettings } from '@/hooks/queries';
import { useFormatMoney } from '@/hooks/useFormatMoney';
import type { Transaction } from '@/types';
import { cn, formatDateTime, truncateMiddle } from '@/utils/helpers';

export default function InvoiceView({
  sale,
  className,
}: {
  sale: Transaction;
  className?: string;
}) {
  const store = useStoreSettings().data;
  const money = useFormatMoney();

  const stellarPayment = sale.payments?.find((p) => p.method === 'stellar');
  const stellarMemo = stellarPayment?.stellarTxHash
    ? truncateMiddle(stellarPayment.stellarTxHash, 16, 16)
    : null;

  // Build a Stellar payment URI for the QR code when a completed Stellar
  // payment exists; fall back to the tx hash so there is always something
  // scannable on paid invoices.
  const qrValue = stellarPayment?.stellarTxHash
    ? `https://stellar.expert/explorer/public/tx/${stellarPayment.stellarTxHash}`
    : null;

  return (
    <div
      className={cn(
        'invoice-printable mx-auto w-full max-w-[720px] bg-white p-10 font-sans text-sm text-gray-800',
        className,
      )}
    >
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-2xl font-bold uppercase tracking-wide text-gray-900">
            {store?.name ?? 'StellarPOS'}
          </p>
          <p className="mt-1 text-xs text-gray-500">Powered by StellarPOS</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-semibold text-gray-700">Invoice</p>
          <p className="mt-1 font-mono text-xs text-gray-500">{sale.reference}</p>
          <p className="text-xs text-gray-500">{formatDateTime(sale.createdAt)}</p>
        </div>
      </div>

      {/* Bill to */}
      <div className="mb-8 grid grid-cols-2 gap-6">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
            Bill To
          </p>
          {sale.customerName ? (
            <p className="font-medium text-gray-800">{sale.customerName}</p>
          ) : (
            <p className="italic text-gray-400">Walk-in customer</p>
          )}
        </div>
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
            Served By
          </p>
          <p className="text-gray-800">{sale.cashierName ?? '—'}</p>
        </div>
      </div>

      {/* Line items */}
      <table className="mb-6 w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-300 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-400">
            <th className="pb-2 pr-4">Item</th>
            <th className="pb-2 pr-4 text-right">Qty</th>
            <th className="pb-2 pr-4 text-right">Unit price</th>
            <th className="pb-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {sale.items?.map((item) => (
            <tr key={item.id} className="border-b border-gray-100">
              <td className="py-2 pr-4 font-medium">{item.name}</td>
              <td className="py-2 pr-4 text-right tabular-nums text-gray-600">{item.quantity}</td>
              <td className="py-2 pr-4 text-right tabular-nums text-gray-600">
                {money(item.unitPriceCents)}
              </td>
              <td className="py-2 text-right tabular-nums">{money(item.lineTotalCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="ml-auto w-56 space-y-1">
        <TotalRow label="Subtotal" value={money(sale.subtotalCents)} />
        {sale.discountCents > 0 && (
          <TotalRow label="Discount" value={`-${money(sale.discountCents)}`} />
        )}
        {sale.taxCents > 0 && <TotalRow label="Tax" value={money(sale.taxCents)} />}
        <TotalRow
          label={`Total (${store?.currency ?? 'USD'})`}
          value={money(sale.totalCents)}
          strong
        />
      </div>

      {/* Stellar memo reference */}
      {stellarMemo && (
        <div className="mt-8 rounded-md border border-gray-200 bg-gray-50 p-4">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
            Stellar Transaction Reference
          </p>
          <p className="break-all font-mono text-xs text-gray-700">
            {stellarPayment?.stellarTxHash}
          </p>
        </div>
      )}

      {/* Payment QR code */}
      {qrValue && (
        <div className="mt-6 flex items-start gap-6">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
              Verify on Stellar Expert
            </p>
            <QRCode value={qrValue} size={96} level="M" aria-label="Stellar transaction QR code" />
          </div>
          <div className="pt-1 text-xs text-gray-500">
            <p>Scan to verify this transaction on the Stellar network.</p>
            <p className="mt-1 break-all font-mono text-[10px] text-gray-400">{qrValue}</p>
          </div>
        </div>
      )}

      {/* Footer note */}
      {sale.note && (
        <div className="mt-6 rounded-md border border-gray-200 p-4 text-xs text-gray-600">
          <p className="mb-1 font-semibold uppercase tracking-widest text-gray-400">Note</p>
          <p className="whitespace-pre-line">{sale.note}</p>
        </div>
      )}
    </div>
  );
}

function TotalRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div
      className={cn(
        'flex justify-between gap-4',
        strong && 'border-t border-gray-300 pt-1 font-bold text-gray-900',
      )}
    >
      <span className={strong ? undefined : 'text-gray-500'}>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
