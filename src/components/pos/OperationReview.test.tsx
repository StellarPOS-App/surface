import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { renderWithProviders } from '@/test/utils';
import OperationReview from './OperationReview';

const rows = [
  { label: 'Operation', value: 'PathPaymentStrictReceive' },
  { label: 'Destination', value: 'GDESTINATION' },
  { label: 'Send up to', value: '12.5 USDC' },
];

function renderReview(onConfirm = vi.fn(), onCancel = vi.fn()) {
  return {
    onConfirm,
    onCancel,
    ...renderWithProviders(
      <OperationReview
        rows={rows}
        network="mainnet"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    ),
  };
}

describe('OperationReview', () => {
  it('shows every operation detail before signing is allowed', () => {
    renderReview();
    expect(screen.getByRole('heading', { name: /review what you are signing/i })).toBeInTheDocument();
    for (const row of rows) {
      expect(screen.getByText(row.label)).toBeInTheDocument();
      expect(screen.getByText(row.value)).toBeInTheDocument();
    }
    expect(screen.getByText(/mainnet/i)).toBeInTheDocument();
  });

  it('requires an explicit acknowledgement before confirming', async () => {
    const { onConfirm } = renderReview();
    const confirm = screen.getByRole('button', { name: /show payment request/i });
    expect(confirm).toBeDisabled();

    await userEvent.click(screen.getByRole('checkbox'));
    expect(confirm).toBeEnabled();
    await userEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('offers a way to cancel the review', async () => {
    const { onCancel } = renderReview();
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
