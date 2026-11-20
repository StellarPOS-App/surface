import { useQuery } from '@tanstack/react-query';
import { findStrictReceivePaths } from '@/lib/pathPayment';
import type { PathQuote } from '@/lib/pathPayment';
import type { StoreSettings } from '@/types';

const HORIZON = {
  mainnet: 'https://horizon.stellar.org',
  testnet: 'https://horizon-testnet.stellar.org',
};

/**
 * Fetches path-payment quotes for every source asset the customer's account
 * holds that can be converted into the merchant's settlement asset.
 *
 * Enabled only when path payments are supported (stellar enabled + destination
 * is set) and a source account is provided (the customer's wallet address).
 */
export function usePathQuotes(opts: {
  store: StoreSettings | undefined;
  sourceAccount: string;
  destinationAmount: string;
  enabled?: boolean;
}) {
  const { store, sourceAccount, destinationAmount, enabled = true } = opts;
  const s = store?.stellar;

  return useQuery<PathQuote[]>({
    queryKey: ['path-quotes', sourceAccount, destinationAmount, s?.network, s?.asset],
    queryFn: async () => {
      if (!s?.merchantPublicKey) return [];
      const horizonUrl = HORIZON[s.network];
      return findStrictReceivePaths({
        horizonUrl,
        sourceAccount,
        destinationAsset: { assetCode: s.asset.code, assetIssuer: s.asset.issuer },
        destinationAmount,
      });
    },
    enabled:
      enabled &&
      Boolean(s?.enabled) &&
      Boolean(s?.merchantPublicKey) &&
      Boolean(sourceAccount) &&
      Boolean(destinationAmount),
    staleTime: 15_000,
    retry: false,
  });
}
