import { Download, FileText, Printer, RotateCcw, Search, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import InvoiceView from '@/components/pos/InvoiceView';
import ReceiptView from '@/components/pos/ReceiptView';
import { MethodBadge, StatusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { Input, Textarea } from '@/components/ui/Field';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import Money from '@/components/ui/Money';
import PageHeader from '@/components/ui/PageHeader';
import {
  useRefundSale,
  useTransaction,
  useTransactions,
  useVoidSale,
  type TransactionQuery,
} from '@/hooks/queries';
import { useAuth } from '@/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';
import { downloadFile } from '@/lib/csv';
import { fetchAllOrders, ordersToCsv } from '@/lib/exportOrders';
import { publicErrorMessage } from '@/lib/safeErrors';
import type { Transaction, TransactionStatus } from '@/types';
import { cn, formatDateTime, formatTime } from '@/utils/helpers';

const FILTERS: { value?: TransactionStatus; label: string }[] = [
  { label: 'All' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Open' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'void', label: 'Void' },
];

function RefundDialog({ sale, onClose }: { sale: Transaction; onClose: () => void }) {
  const refund = useRefundSale();
  const [reason, setReason] = useState('');
  const [restock, setRestock] = useState(true);
  return (
    <Modal
      open
      onClose={onClose}
      eyebrow={sale.reference}
      title={
        <>
          Refund <Money cents={sale.totalCents} />
        </>
      }
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Keep sale
          </Button>
          <Button
            variant="danger"
            loading={refund.isPending}
            onClick={() =>
              refund.mutate(
                { id: sale.id, restock, reason },
                {
                  onSuccess: () => {
                    toast.success('Refunded');
                    onClose();
                  },
                  onError: (e) => toast.error(publicErrorMessage(e)),
                },
              )
            }
          >
            Refund
          </Button>
        </>
      }
    >
      <p className="mb-4 text-sm text-ink-2">
        Return the money the way it was paid. Stellar refunds are sent from the merchant wallet;
        this records the refund and, optionally, puts the items back on the shelf.
      </p>
      <Textarea
        label="Reason"
        rows={2}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="e.g. wrong order"
      />
      <label className="mt-4 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={restock}
          onChange={(e) => setRestock(e.target.checked)}
          className="rounded border-ink-line text-ink"
        />
        Return items to stock
      </label>
    </Modal>
  );
}

function Detail({ id }: { id: string }) {
  const { data: sale, isLoading } = useTransaction(id);
  const voidSale = useVoidSale();
  const { can } = useAuth();
  const [refunding, setRefunding] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  if (isLoading || !sale)
    return (
      <div className="grid place-items-center py-24">
        <LoadingSpinner size="lg" />
      </div>
    );

  return (
    <div className="space-y-5">
      <div className="no-print flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          icon={<Printer className="h-4 w-4" />}
          onClick={() => window.print()}
        >
          Print
        </Button>
        <Button
          variant="secondary"
          size="sm"
          icon={<FileText className="h-4 w-4" />}
          onClick={() => setShowInvoice(true)}
        >
          Invoice
        </Button>
        {sale.status === 'pending' && sale.paidCents === 0 && (
          <Button
            variant="secondary"
            size="sm"
            icon={<XCircle className="h-4 w-4" />}
            loading={voidSale.isPending}
            onClick={() =>
              voidSale.mutate(sale.id, {
                onSuccess: () => toast.success('Sale voided, stock released'),
                onError: (e) => toast.error(publicErrorMessage(e)),
              })
            }
          >
            Void
          </Button>
        )}
        {sale.status === 'completed' && can('manager') && (
          <Button
            variant="secondary"
            size="sm"
            icon={<RotateCcw className="h-4 w-4" />}
            onClick={() => setRefunding(true)}
          >
            Refund
          </Button>
        )}
      </div>
      <ReceiptView sale={sale} />
      {sale.payments && sale.payments.some((p) => p.status === 'failed') && (
        <div className="no-print rounded-lg border border-ink-line p-4 text-sm">
          <p className="eyebrow mb-2">Payment attempts</p>
          {sale.payments.map((p) => (
            <p key={p.id} className="flex items-center justify-between py-0.5">
              <span className="flex items-center gap-2">
                <MethodBadge method={p.method} /> {p.status}
              </span>
              <span className="font-mono text-xs text-ink-3">{formatDateTime(p.createdAt)}</span>
            </p>
          ))}
        </div>
      )}
      {sale.note && (
        <p className="no-print whitespace-pre-line rounded-lg bg-paper-2 p-3 text-sm">
          {sale.note}
        </p>
      )}
      {refunding && <RefundDialog sale={sale} onClose={() => setRefunding(false)} />}
      {showInvoice && (
        <Modal
          open
          onClose={() => setShowInvoice(false)}
          title="Invoice"
          size="lg"
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowInvoice(false)}>
                Close
              </Button>
              <Button
                icon={<Printer className="h-4 w-4" />}
                onClick={() => window.print()}
              >
                Print / Save PDF
              </Button>
            </>
          }
        >
          <InvoiceView sale={sale} />
        </Modal>
      )}
    </div>
  );
}

export default function Transactions() {
  const [filter, setFilter] = useState<TransactionQuery>({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const query = { ...filter, search: useDebounce(search), page };
  const [exporting, setExporting] = useState<{ done: number; total: number } | null>(null);
  const abort = useRef<AbortController | null>(null);

  // Leaving Orders mid-export cancels it: no background paging, no rows held
  // in memory, and no download popping up on another screen.
  useEffect(() => () => abort.current?.abort(), []);

  const exportCsv = async () => {
    abort.current = new AbortController();
    setExporting({ done: 0, total: 0 });
    try {
      // fetchAllOrders walks every page itself.
      const orders = await fetchAllOrders(
        query,
        (done, total) => setExporting({ done, total }),
        abort.current.signal,
      );
      if (abort.current.signal.aborted) return;
      downloadFile(
        `stellarpos-orders-${new Date().toISOString().slice(0, 10)}.csv`,
        ordersToCsv(orders),
      );
      toast.success(`Exported ${orders.length} sales`);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') toast.error(publicErrorMessage(err));
    } finally {
      if (!abort.current?.signal.aborted) setExporting(null);
    }
  };
  const { data, isLoading } = useTransactions(query);
  const sales = data?.data ?? [];

  return (
    <div className="mx-auto max-w-[1300px]">
      <PageHeader eyebrow="Orders" title="Every sale, on record">
        {exporting ? (
          <Button variant="secondary" onClick={() => abort.current?.abort()}>
            Exporting {exporting.done}
            {exporting.total ? ` of ${exporting.total}` : ''}, cancel
          </Button>
        ) : (
          <Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={exportCsv}>
            Export CSV
          </Button>
        )}
      </PageHeader>
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="flex rounded-lg border border-ink-line bg-paper-card p-1">
              {FILTERS.map((f) => (
                <button
                  key={f.label}
                  onClick={() => {
                    setFilter({ ...filter, status: f.value });
                    setPage(1);
                  }}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm',
                    filter.status === f.value ? 'bg-ink text-paper' : 'text-ink-2 hover:text-ink',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <Input
              wrapperClassName="w-44"
              placeholder="S-000123"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              leading={<Search className="h-4 w-4" />}
              aria-label="Search by reference"
            />
            <Input
              type="date"
              wrapperClassName="w-40"
              aria-label="On date"
              onChange={(e) => {
                const day = e.target.value;
                const next = day ? new Date(`${day}T00:00:00Z`) : null;
                if (next) next.setUTCDate(next.getUTCDate() + 1);
                setFilter({
                  ...filter,
                  from: day || undefined,
                  to: next ? next.toISOString().slice(0, 10) : undefined,
                });
                setPage(1);
              }}
            />
          </div>

          <div className="overflow-hidden rounded-xl border border-ink-line bg-paper-card">
            <ul className="divide-y divide-ink-line">
              {sales.map((t) => (
                <li key={t.id}>
                  <button
                    onClick={() => setSelected(t.id)}
                    className={cn(
                      'grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-4 py-3 text-left hover:bg-paper/70 sm:grid-cols-[110px_1fr_auto_auto]',
                      selected === t.id && 'bg-paper-2',
                    )}
                  >
                    <span className="font-mono text-sm font-medium">{t.reference}</span>
                    <span className="order-last col-span-2 truncate text-sm text-ink-3 sm:order-none sm:col-span-1">
                      {formatTime(t.createdAt)} / {t.cashierName ?? 'unknown'}
                      {t.customerName ? ` / ${t.customerName}` : ''}
                    </span>
                    <StatusBadge status={t.status} />
                    <Money cents={t.totalCents} className="w-24 text-right font-semibold" />
                  </button>
                </li>
              ))}
            </ul>
            {isLoading && (
              <div className="grid place-items-center py-16">
                <LoadingSpinner size="lg" />
              </div>
            )}
            {!isLoading && sales.length === 0 && (
              <EmptyState title="No sales match">Ring something up at the register.</EmptyState>
            )}
          </div>

          {data && data.pagination.pages > 1 && (
            <div className="mt-4 flex items-center justify-between font-mono text-xs text-ink-3">
              <span>
                Page {data.pagination.page} of {data.pagination.pages} / {data.pagination.total}{' '}
                sales
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Newer
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={page >= data.pagination.pages}
                  onClick={() => setPage(page + 1)}
                >
                  Older
                </Button>
              </div>
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start" aria-label="Sale detail">
          {selected ? (
            <Detail id={selected} />
          ) : (
            <EmptyState title="Pick a sale">
              Its receipt, payments and actions show up here.
            </EmptyState>
          )}
        </aside>
      </div>
    </div>
  );
}
