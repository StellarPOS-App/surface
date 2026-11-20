import { act, renderHook } from '@testing-library/react';
import { useIdleTimeout } from './useIdleTimeout';

const MIN = 60_000;

describe('useIdleTimeout', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const setup = (enabled = true) => {
    const onTimeout = vi.fn();
    const hook = renderHook(() =>
      useIdleTimeout({ timeoutMs: 30 * MIN, warningMs: 5 * MIN, onTimeout, enabled }),
    );
    return { onTimeout, hook };
  };

  it('warns 5 minutes before signing out, then times out', () => {
    const { onTimeout, hook } = setup();
    act(() => vi.advanceTimersByTime(25 * MIN - 1));
    expect(hook.result.current.warning).toBe(false);
    act(() => vi.advanceTimersByTime(1));
    expect(hook.result.current.warning).toBe(true);
    expect(onTimeout).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(5 * MIN));
    expect(onTimeout).toHaveBeenCalledOnce();
  });

  it('resets on activity before the warning', () => {
    const { onTimeout, hook } = setup();
    act(() => vi.advanceTimersByTime(20 * MIN));
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown'));
    });
    act(() => vi.advanceTimersByTime(20 * MIN));
    expect(hook.result.current.warning).toBe(false);
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('ignores stray activity once warned; only stayActive resets', () => {
    const { onTimeout, hook } = setup();
    act(() => vi.advanceTimersByTime(26 * MIN));
    act(() => {
      window.dispatchEvent(new Event('pointerdown'));
    });
    expect(hook.result.current.warning).toBe(true);
    act(() => hook.result.current.stayActive());
    expect(hook.result.current.warning).toBe(false);
    act(() => vi.advanceTimersByTime(24 * MIN));
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('does nothing while disabled (signed out)', () => {
    const { onTimeout } = setup(false);
    act(() => vi.advanceTimersByTime(60 * MIN));
    expect(onTimeout).not.toHaveBeenCalled();
  });
});
