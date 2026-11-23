import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import type { Transaction } from '@/types';
import { renderWithProviders } from '@/test/utils';
import StellarCheckout from './StellarCheckout';

// vi.mock factories are hoisted, so shared fixtures must be hoisted too.
const { uri, request } = vi.hoisted(() => ({
  uri: 'web+stellar:pay?destination=GDEST&amount=12.5&asset_code=USDC',
  request: {
    id: 'req_1',
    transactionId: 'txn_1',
    destination: 'GDESTINATION',
    assetCode: 'USDC',
    assetIssuer: 'GISSUER',
    amount: '12.5',
    memo: 'S-000001',
    uri: 'web+stellar:pay?destination=GDEST&amount=12.5&asset_code=USDC',
    status: 'pending',
    txHash: null,
    payer: null,
    expiresAt: '2030-01-01T00:00:00Z',
    paidAt: null,
  },
}));

const sale = { id: 'txn_1', totalCents: 1250, status: 'pending' } as Transaction;

vi.mock('@/hooks/queries', () => ({
  useCreatePaymentRequest: () => ({ mutate: vi.fn(), data: request, isError: false, error: null }),
  usePaymentRequest: () => ({ data: undefined }),
  useVerifyPaymentRequest: () => ({ mutate: vi.fn(), isPending: false }),
  useStoreSettings: () => ({
    data: {
      stellar: {
        enabled: true,
        network: 'mainnet',
        merchantPublicKey: 'GDESTINATION',
        asset: { code: 'USDC', issuer: 'GISSUER' },
      },
    },
  }),
}));

vi.mock('@/hooks/usePathPayment', () => ({
  usePathQuotes: () => ({ data: [], isLoading: false, isError: false }),
}));
vi.mock('@/hooks/useCountdown', () => ({ useCountdown: () => 300 }));
vi.mock('@/hooks/useRealtime', () => ({ onRealtime: vi.fn(() => () => undefined) }));
vi.mock('react-qr-code', () => ({
  default: ({ value }: { value: string }) => <div data-testid="qr" data-uri={value} />,
}));

describe('StellarCheckout signing review', () => {
  it('does not expose the QR or wallet URI until the operation is reviewed', async () => {
    renderWithProviders(<StellarCheckout sale={sale} onPaid={vi.fn()} />);

    expect(screen.getByRole('heading', { name: /review what you are signing/i })).toBeInTheDocument();
    expect(screen.getByText('GDESTINATION')).toBeInTheDocument();
    expect(screen.getByText('S-000001')).toBeInTheDocument();
    expect(screen.queryByTestId('qr')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /open in wallet/i })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: /show payment request/i }));

    expect(await screen.findByTestId('qr')).toHaveAttribute('data-uri', uri);
    expect(screen.getByRole('link', { name: /open in wallet/i })).toHaveAttribute('href', uri);

    await userEvent.click(screen.getByRole('button', { name: /review details/i }));
    expect(screen.queryByTestId('qr')).not.toBeInTheDocument();
  });
});
