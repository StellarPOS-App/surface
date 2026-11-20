import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCartStore } from '@/stores/cartStore';
import { makeProduct, mockFetch, renderWithProviders } from '@/test/utils';
import ReceiptCart from './ReceiptCart';

const store = {
  name: 'Test Cafe',
  currency: 'USD',
  taxRateBps: 0,
  stellar: { network: 'testnet', enabled: true },
};

describe('ReceiptCart', () => {
  beforeEach(() => {
    useCartStore.getState().clear();
    mockFetch({ 'GET /api/v1/store': { body: { success: true, data: store } } });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('disables tender buttons while empty', () => {
    renderWithProviders(<ReceiptCart onCharge={vi.fn()} />);
    expect(screen.getByText('Nothing rung up yet')).toBeInTheDocument();
    for (const name of [/cash/i, /card/i, /stellar/i]) {
      expect(screen.getByRole('button', { name })).toBeDisabled();
    }
  });

  it('shows lines and totals, and charges with the chosen method', async () => {
    const flatWhite = makeProduct({ name: 'Flat White', priceCents: 420, stock: 5 });
    useCartStore.getState().add(flatWhite, 2);
    const onCharge = vi.fn();
    renderWithProviders(<ReceiptCart onCharge={onCharge} />);

    expect(screen.getByText('Flat White')).toBeInTheDocument();
    expect(screen.getByText('2 items')).toBeInTheDocument();
    expect((await screen.findAllByText('$8.40')).length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole('button', { name: 'One more Flat White' }));
    expect(useCartStore.getState().lines[0].quantity).toBe(3);

    await userEvent.click(screen.getByRole('button', { name: /stellar/i }));
    expect(onCharge).toHaveBeenCalledWith('stellar');
  });

  it('applies a discount from the keypad input', async () => {
    useCartStore.getState().add(makeProduct({ priceCents: 1000 }));
    renderWithProviders(<ReceiptCart onCharge={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /discount/i }));
    await userEvent.type(screen.getByLabelText('Discount amount'), '2.50');
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(useCartStore.getState().discountCents).toBe(250);
    expect(await screen.findByText('$7.50')).toBeInTheDocument();
  });
});
