/**
 * Stellar path payment helpers for StellarPOS checkout.
 *
 * Uses the Horizon /paths/strict-receive endpoint to discover conversion paths
 * and builds a SEP-7 `tx` URI that encodes a PathPaymentStrictReceive operation
 * so the customer pays in any asset they hold while the merchant receives the
 * configured settlement asset.
 */

export interface PathAsset {
  assetCode: string;
  assetIssuer: string | null;
}

export interface PathQuote {
  sourceAsset: PathAsset;
  sendMax: string;
  path: PathAsset[];
}

/** Canonical string for use in SEP-7 / Horizon params. */
export function assetParam(asset: PathAsset): string {
  if (!asset.assetIssuer) return 'native';
  return `${asset.assetCode}:${asset.assetIssuer}`;
}

/** GET /paths/strict-receive — returns the cheapest path for the customer to send. */
export async function findStrictReceivePaths(opts: {
  horizonUrl: string;
  sourceAccount: string;
  destinationAsset: PathAsset;
  destinationAmount: string;
}): Promise<PathQuote[]> {
  const { horizonUrl, sourceAccount, destinationAsset, destinationAmount } = opts;

  const destCode = destinationAsset.assetIssuer ? destinationAsset.assetCode : 'native';
  const params = new URLSearchParams({
    source_account: sourceAccount,
    destination_asset_type: destinationAsset.assetIssuer ? 'credit_alphanum12' : 'native',
    ...(destinationAsset.assetIssuer
      ? {
          destination_asset_code: destinationAsset.assetCode,
          destination_asset_issuer: destinationAsset.assetIssuer,
        }
      : {}),
    destination_amount: destinationAmount,
  });
  // suppress unused variable — destCode is only here for the type annotation clarity
  void destCode;

  const res = await fetch(`${horizonUrl}/paths/strict-receive?${params}`);
  if (!res.ok) throw new Error(`Horizon path-finding failed: ${res.status}`);
  const json = (await res.json()) as {
    _embedded: {
      records: Array<{
        source_asset_code?: string;
        source_asset_issuer?: string;
        source_asset_type: string;
        source_amount: string;
        path: Array<{
          asset_code?: string;
          asset_issuer?: string;
          asset_type: string;
        }>;
      }>;
    };
  };

  return json._embedded.records.map((r) => ({
    sourceAsset: {
      assetCode: r.source_asset_type === 'native' ? 'XLM' : (r.source_asset_code ?? 'XLM'),
      assetIssuer: r.source_asset_type === 'native' ? null : (r.source_asset_issuer ?? null),
    },
    sendMax: r.source_amount,
    path: r.path.map((p) => ({
      assetCode: p.asset_type === 'native' ? 'XLM' : (p.asset_code ?? 'XLM'),
      assetIssuer: p.asset_type === 'native' ? null : (p.asset_issuer ?? null),
    })),
  }));
}

/**
 * Builds a SEP-7 `web+stellar:pay` URI for a PathPaymentStrictReceive operation.
 * The customer's wallet will show "send up to sendMax of sourceAsset, receive
 * exactly destinationAmount of destinationAsset".
 *
 * We use a 1 % slippage buffer on sendMax so minor price movement does not
 * cause a user-visible failure.
 */
export function buildPathPaymentUri(opts: {
  destination: string;
  destinationAsset: PathAsset;
  destinationAmount: string;
  sourceAsset: PathAsset;
  sendMax: string;
  path: PathAsset[];
  memo: string;
}): string {
  const { destination, destinationAsset, destinationAmount, sourceAsset, sendMax, path, memo } =
    opts;

  const slippageFactor = 1.01;
  const sendMaxWithSlippage = (parseFloat(sendMax) * slippageFactor).toFixed(7);

  const params = new URLSearchParams({
    destination,
    amount: destinationAmount,
    asset_code: destinationAsset.assetCode,
    ...(destinationAsset.assetIssuer ? { asset_issuer: destinationAsset.assetIssuer } : {}),
    send_asset_code: sourceAsset.assetCode,
    ...(sourceAsset.assetIssuer ? { send_asset_issuer: sourceAsset.assetIssuer } : {}),
    send_max: sendMaxWithSlippage,
    memo,
    memo_type: 'MEMO_TEXT',
  });

  if (path.length > 0) {
    params.set('path', path.map(assetParam).join(','));
  }

  return `web+stellar:pay?${params.toString()}`;
}
