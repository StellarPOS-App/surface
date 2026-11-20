import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from './Modal';

describe('Modal', () => {
  it('keeps focus where the user put it when the parent re-renders', async () => {
    const view = render(
      <Modal open onClose={() => undefined} title="Refund">
        <input aria-label="first" />
        <input aria-label="second" />
      </Modal>,
    );
    expect(screen.getByLabelText('first')).toHaveFocus();
    await userEvent.click(screen.getByLabelText('second'));

    // A new onClose identity on every render used to re-run setup and refocus "first".
    view.rerender(
      <Modal open onClose={() => undefined} title="Refund">
        <input aria-label="first" />
        <input aria-label="second" />
      </Modal>,
    );
    expect(screen.getByLabelText('second')).toHaveFocus();
  });

  it('still calls the latest onClose on Escape', async () => {
    const first = vi.fn();
    const latest = vi.fn();
    const view = render(
      <Modal open onClose={first} title="X">
        body
      </Modal>,
    );
    view.rerender(
      <Modal open onClose={latest} title="X">
        body
      </Modal>,
    );
    await userEvent.keyboard('{Escape}');
    expect(latest).toHaveBeenCalledOnce();
    expect(first).not.toHaveBeenCalled();
  });

  it('restores page scrolling when closed', () => {
    const view = render(
      <Modal open onClose={() => undefined} title="X">
        body
      </Modal>,
    );
    expect(document.body.style.overflow).toBe('hidden');
    view.rerender(
      <Modal open={false} onClose={() => undefined} title="X">
        body
      </Modal>,
    );
    expect(document.body.style.overflow).toBe('');
  });
});
