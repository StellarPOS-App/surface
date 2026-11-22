import { ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import Button from '../ui/Button';

export interface OperationDetailRow {
  label: string;
  value: string;
}

/**
 * Explicit review step shown before a payment request is handed to the
 * customer's wallet for signing. The operation is not exposed until the user
 * has read every field and ticked the acknowledgement.
 */
export default function OperationReview({
  rows,
  network,
  onConfirm,
  onCancel,
}: {
  rows: OperationDetailRow[];
  network: string;
  onConfirm: () => void;
  onCancel?: () => void;
}) {
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <section
      aria-label="Operation review"
      className="space-y-5 rounded-xl border border-ink-line bg-paper-card p-5"
    >
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-lumen" aria-hidden />
        <div>
          <h3 className="font-display text-xl font-bold">Review what you are signing</h3>
          <p className="mt-1 text-sm text-ink-2">
            The customer's wallet will sign these exact operations on {network}. Check every value
            before continuing — a signature cannot be undone.
          </p>
        </div>
      </div>

      <dl className="divide-y divide-ink-line rounded-lg border border-ink-line">
        {rows.map((row) => (
          <div key={row.label} className="grid gap-1 px-3 py-2 sm:grid-cols-[11rem_1fr]">
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-3">{row.label}</dt>
            <dd className="break-all font-mono text-xs text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>

      <label className="flex items-start gap-2 text-sm text-ink-2">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={acknowledged}
          onChange={(e) => setAcknowledged(e.target.checked)}
        />
        <span>I have checked these operation details and confirm they are correct.</span>
      </label>

      <div className="flex flex-wrap gap-2">
        <Button variant="lumen" disabled={!acknowledged} onClick={onConfirm}>
          Show payment request
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </section>
  );
}
