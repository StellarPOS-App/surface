import { Check, ChevronDown, Copy, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { toast } from 'sonner';
import {
  useCreatePaymentRequest,
  usePaymentRequest,
  useStoreSettings,
  useVerifyPaymentRequest,
} from '@/hooks/queries';
import { usePathQuotes } from '@/hooks/usePathPayment';
import { useCountdown } from '@/hooks/useCountdown';
import { onRealtime } from '@/hooks/useRealtime';
import type { PaymentRequest, Transaction } from '@/types';
import { copyText } from '@/lib/clipboard';
import { buildPathPaymentUri } from '@/lib/pathPayment';
import type { PathQuote } from '@/lib/pathPayment';
import { publicErrorMessage } from '@/lib/safeErrors';
import { cn, formatAssetAmount, truncateMiddle } from '@/utils/helpers';
import Button from '../ui/Button';
import { Input } from '../ui/Field';
import LoadingSpinner from '../ui/LoadingSpinner';
import OperationReview, { type OperationDetailRow } from './OperationReview';

const explorer = (network: string, hash: string) =>
  `https://stellar.expert/explorer/${network === 'mainnet' ? 'public' : 'testnet'}/tx/${hash}`;

/**
 * Shows a SEP-7 QR for the sale's balance and waits for the chain. The
 * server's watcher settles the payment; this screen just listens (socket
 * first, polling as a fallback) and offers a manual hash check.
 */
export default function StellarCheckout({
  sale,
  onPaid,
  onCancel,
}: {
  sale: Transaction;
  onPaid: (t: Transaction) => void;
  onCancel?: () => void;
}) {
  const store = useStoreSettings().data;
  const create = useCreatePaymentRequest();
  const [requestId, setRequestId] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const { data: polled } = usePaymentRequest(requestId);
  const request: PaymentRequest | undefined = polled ?? create.data;
  const verify = useVerifyPaymentRequest();
  const [hash, setHash] = useState('');
  const secondsLeft = useCountdown(request?.status === 'pending' ? request.expiresAt : null);

  // Path payment: customer's account address + selected quote
  const [sourceAccount, setSourceAccount] = useState('');
  const [selectedQuote, setSelectedQuote] = useState<PathQuote | null>(null);
  const pathQuotes = usePathQuotes({
    store,
    sourceAccount,
    destinationAmount: request?.amount ?? '0',
    enabled: request?.status === 'pending',
  });

  // Active QR URI: path payment when a quote is chosen, otherwise the original SEP-7 URI
  const activeUri =
    selectedQuote && request
      ? buildPathPaymentUri({
          destination: request.destination,
          destinationAsset: {
            assetCode: request.assetCode,
            assetIssuer: request.assetIssuer,
          },
          destinationAmount: request.amount,
          sourceAsset: selectedQuote.sourceAsset,
          sendMax: selectedQuote.sendMax,
          path: selectedQuote.path,
          memo: request.memo,
        })
      : request?.uri ?? '';

  useEffect(() => {
    if (!store?.stellar.enabled) return;
    create.mutate(sale.id, {
      onSuccess: (r) => setRequestId(r.id),
      onError: (err) => toast.error(publicErrorMessage(err)),
    });
    // Create once per sale.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sale.id, store?.stellar.enabled]);

  // Changing the source account, quote or request produces a different URI —
  // the previous acknowledgement must not carry over to a different operation.
  useEffect(() => setConfirmed(false), [activeUri]);

  useEffect(
    () =>
      onRealtime((event, payload) => {
        const p = payload as { request?: PaymentRequest; transaction?: Transaction };
        if (event === 'payment:confirmed' && p.request?.id === requestId && p.transaction)
          onPaid(p.transaction);
      }),
    [requestId, onPaid],
  );

  // Polling fallback: if the socket missed it, the request still flips to paid.
  useEffect(() => {
    if (polled?.status === 'paid')
      onPaid({ ...sale, status: 'completed', paidCents: sale.totalCents, balanceCents: 0 });
  }, [polled?.status, onPaid, sale]);

  if (!store?.stellar.enabled) {
    return (
      <div className="rounded-lg border border-dashed border-ink-line p-5 text-sm text-ink-2">
        <p className="font-medium text-ink">Stellar checkout is not set up yet.</p>
        <p className="mt-1">
          Set <code className="font-mono">STELLAR_MERCHANT_PUBLIC_KEY</code> on the server to the
          account that should receive payments, then restart it.
        </p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="grid place-items-center py-16">
        {create.isError ? (
          <p className="text-signal">{publicErrorMessage(create.error)}</p>
        ) : (
          <LoadingSpinner size="lg" label="Preparing QR" />
        )}
      </div>
    );
  }

  const assetLabel = (asset: { assetCode: string; assetIssuer: string | null }) =>
    `${asset.assetCode}${asset.assetIssuer ? ` (${truncateMiddle(asset.assetIssuer, 6, 6)})` : ' (native)'}`;

  // Everything the customer's wallet is about to sign, in one reviewable list.
  const operationRows: OperationDetailRow[] = [
    { label: 'Operation', value: selectedQuote ? 'Path payment (strict receive)' : 'Payment (SEP-7)' },
    { label: 'Network', value: store.stellar.network },
    { label: 'Destination', value: request.destination },
    {
      label: 'Merchant receives',
      value: `${formatAssetAmount(request.amount)} ${assetLabel({
        assetCode: request.assetCode,
        assetIssuer: request.assetIssuer,
      })}`,
    },
    ...(selectedQuote
      ? [
          { label: "Customer's account", value: sourceAccount },
          {
            label: 'Customer sends up to',
            value: `${formatAssetAmount(selectedQuote.sendMax)} ${assetLabel(selectedQuote.sourceAsset)}`,
          },
          {
            label: 'Conversion path',
            value: selectedQuote.path.length
              ? `${selectedQuote.path.map((a) => a.assetCode).join(' → ')} → ${request.assetCode}`
              : `Direct → ${request.assetCode}`,
          },
        ]
      : []),
    { label: 'Memo', value: request.memo || '(none)' },
    { label: 'Expires', value: new Date(request.expiresAt).toLocaleString() },
  ];

  // No QR code, payment link or wallet URI is exposed until the operation has
  // been reviewed and explicitly acknowledged.
  if (!confirmed) {
    return (
      <OperationReview
        rows={operationRows}
        network={store.stellar.network}
        onConfirm={() => setConfirmed(true)}
        onCancel={onCancel}
      />
    );
  }

  const mins = Math.floor(secondsLeft / 60);
  const secs = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
      <div
        className={cn(
          'mx-auto rounded-xl bg-white p-4 shadow-slip',
          request.status === 'pending' && 'animate-pulse-ring',
        )}
      >
        <QRCode value={activeUri} size={208} level="M" aria-label="Stellar payment QR code" />
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <p className="eyebrow">Customer pays</p>
          <p className="figures text-3xl font-semibold text-lumen">
            {formatAssetAmount(request.amount)} <span className="text-lg">{request.assetCode}</span>
          </p>
          <p className="mt-1 font-mono text-xs text-ink-3">
            to {truncateMiddle(request.destination, 6, 6)} / memo{' '}
            <span className="text-ink">{request.memo}</span>
          </p>
        </div>

        {request.status === 'pending' && (
          <div className="flex items-center gap-3 rounded-lg bg-lumen-soft px-4 py-3 text-lumen-ink">
            <LoadingSpinner size="sm" className="text-lumen" />
            <p className="text-sm">
              Waiting for the network. Expires in{' '}
              <span className="figures font-semibold">
                {mins}:{secs}
              </span>
            </p>
          </div>
        )}
        {request.status === 'paid' && (
          <div className="flex items-center gap-3 rounded-lg bg-cash-soft px-4 py-3 text-cash-ink">
            <Check className="h-5 w-5" />
            <p className="text-sm font-medium">
              Paid.{' '}
              {request.txHash && (
                <a
                  className="underline"
                  href={explorer(store.stellar.network, request.txHash)}
                  target="_blank"
                  rel="noreferrer"
                >
                  View transaction <ExternalLink className="inline h-3 w-3" />
                </a>
              )}
            </p>
          </div>
        )}
        {(request.status === 'expired' || request.status === 'cancelled') && (
          <p className="rounded-lg bg-signal-soft px-4 py-3 text-sm text-signal">
            This QR {request.status}. Close checkout to start again.
          </p>
        )}

        {/* Path payment: customer enters their wallet address to get asset options */}
        {request.status === 'pending' && (
          <div className="rounded-lg border border-ink-line bg-paper-card px-4 py-3 space-y-3">
            <p className="text-xs font-medium text-ink-2">
              Pay in a different asset? Enter the customer's Stellar address to see options.
            </p>
            <Input
              label="Customer's Stellar address"
              placeholder="G…"
              value={sourceAccount}
              onChange={(e) => {
                setSourceAccount(e.target.value.trim());
                setSelectedQuote(null);
              }}
              className="font-mono text-xs"
            />
            {sourceAccount.length > 0 && (
              <>
                {pathQuotes.isLoading && (
                  <div className="flex items-center gap-2 text-xs text-ink-3">
                    <LoadingSpinner size="sm" />
                    Finding conversion paths…
                  </div>
                )}
                {pathQuotes.isError && (
                  <p className="text-xs text-signal">Could not find paths — check the address.</p>
                )}
                {pathQuotes.data && pathQuotes.data.length === 0 && (
                  <p className="text-xs text-ink-3">
                    No convertible assets found for this account.
                  </p>
                )}
                {pathQuotes.data && pathQuotes.data.length > 0 && (
                  <div className="relative">
                    <select
                      className="w-full appearance-none rounded-md border border-ink-line bg-paper px-3 py-2 pr-8 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-lumen"
                      value={
                        selectedQuote
                          ? `${selectedQuote.sourceAsset.assetCode}:${selectedQuote.sourceAsset.assetIssuer ?? 'native'}`
                          : ''
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) {
                          setSelectedQuote(null);
                          return;
                        }
                        const [code, issuer] = val.split(':');
                        const quote = pathQuotes.data?.find(
                          (q) =>
                            q.sourceAsset.assetCode === code &&
                            (q.sourceAsset.assetIssuer ?? 'native') === issuer,
                        );
                        setSelectedQuote(quote ?? null);
                      }}
                    >
                      <option value="">Use merchant's asset (default)</option>
                      {pathQuotes.data.map((q) => (
                        <option
                          key={`${q.sourceAsset.assetCode}:${q.sourceAsset.assetIssuer ?? 'native'}`}
                          value={`${q.sourceAsset.assetCode}:${q.sourceAsset.assetIssuer ?? 'native'}`}
                        >
                          {q.sourceAsset.assetCode} — send up to {formatAssetAmount(q.sendMax)}{' '}
                          {q.sourceAsset.assetCode}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
                  </div>
                )}
                {selectedQuote && (
                  <p className="text-xs text-ink-3">
                    QR updated — customer sends up to{' '}
                    <span className="font-semibold text-ink">
                      {formatAssetAmount(selectedQuote.sendMax)} {selectedQuote.sourceAsset.assetCode}
                    </span>{' '}
                    via {selectedQuote.path.length > 0
                      ? selectedQuote.path.map((a) => a.assetCode).join(' → ') + ' → '
                      : ''}
                    {request.assetCode}.
                  </p>
                )}
              </>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            icon={<Copy className="h-3.5 w-3.5" />}
            onClick={async () =>
              (await copyText(activeUri))
                ? toast.success('Payment link copied')
                : toast.error('Could not copy. Long-press the QR link instead.')
            }
          >
            Copy link
          </Button>
          <a
            href={activeUri}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-ink-line px-3 text-sm hover:bg-paper-2"
          >
            Open in wallet
          </a>
          <Button size="sm" variant="ghost" onClick={() => setConfirmed(false)}>
            Review details
          </Button>
        </div>

        {request.status === 'pending' && (
          <form
            className="flex items-end gap-2 border-t border-dashed border-ink-line pt-4"
            onSubmit={(e) => {
              e.preventDefault();
              verify.mutate(
                { id: request.id, txHash: hash.trim() },
                {
                  onSuccess: (r) => onPaid(r.transaction),
                  onError: (err) => toast.error(publicErrorMessage(err)),
                },
              );
            }}
          >
            <Input
              wrapperClassName="flex-1"
              label="Customer shows a transaction hash?"
              placeholder="64-character hash"
              value={hash}
              onChange={(e) => setHash(e.target.value)}
              className="font-mono text-xs"
            />
            <Button
              type="submit"
              variant="lumen"
              disabled={!/^[0-9a-fA-F]{64}$/.test(hash.trim())}
              loading={verify.isPending}
            >
              Verify
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
