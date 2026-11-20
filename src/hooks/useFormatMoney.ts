import { useStoreSettings } from '@/hooks/queries';
import { formatCurrency } from '@/utils/helpers';

/** Formats cents in the store's currency. */
export function useFormatMoney() {
  const currency = useStoreSettings().data?.currency ?? 'USD';
  return (cents: number) => formatCurrency(cents, currency);
}
