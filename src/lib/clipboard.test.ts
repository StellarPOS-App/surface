import { copyText } from './clipboard';

describe('copyText', () => {
  const original = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  afterEach(() => {
    if (original) Object.defineProperty(navigator, 'clipboard', original);
    else delete (navigator as { clipboard?: unknown }).clipboard;
    vi.restoreAllMocks();
  });

  const setClipboard = (value: unknown) =>
    Object.defineProperty(navigator, 'clipboard', { value, configurable: true });

  it('uses the async clipboard API when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
    await expect(copyText('web+stellar:pay?x')).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('web+stellar:pay?x');
  });

  it('falls back to execCommand on insecure origins (Safari over http)', async () => {
    setClipboard(undefined);
    const exec = vi.fn().mockReturnValue(true);
    document.execCommand = exec;
    await expect(copyText('hello')).resolves.toBe(true);
    expect(exec).toHaveBeenCalledWith('copy');
    expect(document.querySelector('textarea')).toBeNull();
  });

  it('falls back when the async API rejects, and reports failure without throwing', async () => {
    setClipboard({ writeText: vi.fn().mockRejectedValue(new Error('NotAllowedError')) });
    document.execCommand = vi.fn().mockReturnValue(false);
    await expect(copyText('hello')).resolves.toBe(false);
  });
});
