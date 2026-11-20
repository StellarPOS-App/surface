import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCartStore } from '@/stores/cartStore';
import { makeProduct, mockFetch, renderWithProviders } from '@/test/utils';
import MobileOrderBar from './MobileOrderBar';

describe('MobileOrderBar', () => {
  beforeEach(() => {
    useCartStore.getState().clear();
    mockFetch({
      'GET /api/v1/store': {
        body: { success: true, data: { name: 'Kofi', currency: 'USD', taxRateBps: 0 } },
      },
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('summarizes the order in the sticky bar', async () => {
    useCartStore.getState().add(makeProduct({ name: 'Flat White', priceCents: 420 }), 2);
    renderWithProviders(<MobileOrderBar onCharge={vi.fn()} />);
    const bar = screen.getByRole('button', { name: 'View order: 2 items' });
    expect(within(bar).getByText('2 items')).toBeInTheDocument();
    expect(await within(bar).findByText('$8.40')).toBeInTheDocument();
  });

  it('opens the order as a sheet and charges from it', async () => {
    useCartStore.getState().add(makeProduct({ name: 'Espresso', priceCents: 250 }));
    const onCharge = vi.fn();
    renderWithProviders(<MobileOrderBar onCharge={onCharge} />);
    await userEvent.click(screen.getByRole('button', { name: /view order/i }));
    const sheet = screen.getByRole('dialog', { name: 'Current order' });
    expect(within(sheet).getByText('Espresso')).toBeInTheDocument();
    await userEvent.click(within(sheet).getByRole('button', { name: /card/i }));
    expect(onCharge).toHaveBeenCalledWith('card');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows an empty state with no items', () => {
    renderWithProviders(<MobileOrderBar onCharge={vi.fn()} />);
    expect(screen.getByText('No items yet')).toBeInTheDocument();
  });
});
