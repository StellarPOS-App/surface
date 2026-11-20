import type { ReactNode } from 'react';
import { METHOD_LABEL } from '@/lib/pos';
import type { PaymentMethod, TransactionStatus } from '@/types';
import { cn } from '@/utils/helpers';

const tones = {
  neutral: 'bg-paper-2 text-ink-2',
  ink: 'bg-ink text-paper',
  cash: 'bg-cash-soft text-cash-ink',
  card: 'bg-card-soft text-card-ink',
  lumen: 'bg-lumen-soft text-lumen-ink',
  signal: 'bg-signal-soft text-signal',
  amber: 'bg-amber-soft text-amber',
} as const;

export type BadgeTone = keyof typeof tones;

export default function Badge({
  tone = 'neutral',
  children,
  className,
  'aria-label': ariaLabel,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
  'aria-label'?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wide',
        tones[tone],
        className,
      )}
      aria-label={ariaLabel}
    >
      {children}
    </span>
  );
}

const statusTone: Record<TransactionStatus, BadgeTone> = {
  pending: 'amber',
  completed: 'cash',
  void: 'neutral',
  refunded: 'signal',
};

const statusLabel: Record<TransactionStatus, string> = {
  pending: 'Pending',
  completed: 'Completed',
  void: 'Void',
  refunded: 'Refunded',
};

export const StatusBadge = ({ status }: { status: TransactionStatus }) => (
  <Badge
    tone={statusTone[status]}
    aria-label={`Transaction status: ${statusLabel[status]}`}
  >
    {statusLabel[status]}
  </Badge>
);

const methodTone: Record<PaymentMethod, BadgeTone> = {
  cash: 'cash',
  card: 'card',
  stellar: 'lumen',
};

export const MethodBadge = ({ method }: { method: PaymentMethod }) => (
  <Badge tone={methodTone[method]}>{METHOD_LABEL[method]}</Badge>
);
