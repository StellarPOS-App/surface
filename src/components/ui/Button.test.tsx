import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';

describe('Button', () => {
  it('fires clicks and defaults to type=button so it never submits forms by accident', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Charge</Button>);
    const button = screen.getByRole('button', { name: 'Charge' });
    expect(button).toHaveAttribute('type', 'button');
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is disabled and busy while loading', async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Save
      </Button>,
    );
    const button = screen.getByRole('button', { name: /save/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('applies method colors', () => {
    render(<Button variant="lumen">Stellar</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-lumen');
  });
});

describe('LoadingSpinner', () => {
  it('announces itself to assistive tech', () => {
    render(<LoadingSpinner label="Reserving stock" />);
    expect(screen.getByRole('status', { name: 'Reserving stock' })).toBeInTheDocument();
  });
});
