import { screen } from '@testing-library/react';
import { DEFAULT_RECEIPT, MAX_FOOTER, useReceiptStore } from '@/stores/receiptStore';
import { mockFetch, renderWithProviders } from '@/test/utils';
import type { Transaction } from '@/types';
import ReceiptView from './ReceiptView';

const sale: Transaction = {
  id: 't1',
  reference: 'S-000042',
  userId: 'u',
  cashierName: 'Chidi Cashier',
  customerId: 'c',
  customerName: 'Grace Mensah',
  subtotalCents: 500,
  discountCents: 0,
  taxCents: 0,
  totalCents: 500,
  paidCents: 500,
  balanceCents: 0,
  status: 'completed',
  note: '',
  createdAt: '2026-10-01 10:00:00',
  completedAt: '2026-10-01 10:00:00',
  items: [
    {
      id: 'i',
      productId: 'p',
      name: 'Espresso',
      sku: 'E',
      unitPriceCents: 500,
      quantity: 1,
      lineTotalCents: 500,
    },
  ],
  payments: [
    {
      id: 'p',
      transactionId: 't1',
      method: 'stellar',
      amountCents: 500,
      tenderedCents: null,
      changeCents: null,
      status: 'completed',
      stellarTxHash: 'a'.repeat(64),
      createdAt: '2026-10-01 10:00:00',
    },
  ],
};

describe('ReceiptView options', () => {
  beforeEach(() => {
    useReceiptStore.getState().reset();
    mockFetch({
      'GET /api/v1/store': { body: { success: true, data: { name: 'Kofi', currency: 'USD' } } },
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('prints the defaults', () => {
    renderWithProviders(<ReceiptView sale={sale} />);
    expect(screen.getByText('Served by Chidi Cashier')).toBeInTheDocument();
    expect(screen.getByText('Customer: Grace Mensah')).toBeInTheDocument();
    expect(screen.getByText(/^tx aaaa/)).toBeInTheDocument();
    expect(screen.getByText(DEFAULT_RECEIPT.footer)).toBeInTheDocument();
  });

  it('applies header, footer and hidden fields', () => {
    useReceiptStore.getState().update({
      header: '12 Admiralty Way',
      footer: 'Wifi: kofi-guest',
      showCashier: false,
      showCustomer: false,
      showTxHash: false,
    });
    renderWithProviders(<ReceiptView sale={sale} />);
    expect(screen.getByText('12 Admiralty Way')).toBeInTheDocument();
    expect(screen.getByText('Wifi: kofi-guest')).toBeInTheDocument();
    expect(screen.queryByText(/Served by/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Customer:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^tx /)).not.toBeInTheDocument();
    expect(screen.queryByText('Thank you')).not.toBeInTheDocument();
  });

  it('caps text length and persists per device', () => {
    useReceiptStore.getState().update({ footer: 'x'.repeat(500) });
    expect(useReceiptStore.getState().footer).toHaveLength(MAX_FOOTER);
    expect(localStorage.getItem('stellarpos.receipt')).toContain('xxx');
  });
});
