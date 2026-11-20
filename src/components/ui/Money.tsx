import { useStoreSettings } from '@/hooks/queries';
import { cn, formatCurrency } from '@/utils/helpers';

/** Store-currency amount in tabular mono figures. */
export default function Money({
  cents,
  className,
  signed,
}: {
  cents: number;
  className?: string;
  signed?: boolean;
}) {
  const currency = useStoreSettings().data?.currency ?? 'USD';
  const text = formatCurrency(Math.abs(cents), currency);
  return (
    <span className={cn('figures', className)}>{signed && cents < 0 ? `-${text}` : text}</span>
  );
}
