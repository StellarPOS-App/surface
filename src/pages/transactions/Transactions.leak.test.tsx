import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as csv from '@/lib/csv';
import { renderWithProviders } from '@/test/utils';
import Transactions from './Transactions';

const sale = (i: number) => ({
  id: `t${i}`,
  reference: `S-${String(i).padStart(6, '0')}`,
  status: 'completed',
  totalCents: 100,
  createdAt: '2026-10-01 10:00:00',
});

const page = (n: number) => ({
  success: true,
  data: Array.from({ length: 100 }, (_, i) => sale((n - 1) * 100 + i + 1)),
  pagination: { page: n, limit: 100, total: 500, pages: 5 },
});

describe('Orders export cleanup', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('cancels an in-flight export when the page unmounts', async () => {
    const download = vi.spyOn(csv, 'downloadFile').mockImplementation(() => undefined);
    let exportSignal: AbortSignal | undefined;
    let exportCalls = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes('/store'))
          return Promise.resolve(
            new Response(JSON.stringify({ success: true, data: { currency: 'USD' } })),
          );
        if (url.includes('limit=100')) {
          exportCalls++;
          exportSignal = init?.signal ?? undefined;
          // Page 1 answers; page 2 hangs until aborted.
          if (exportCalls === 1) return Promise.resolve(new Response(JSON.stringify(page(1))));
          return new Promise((_, reject) =>
            init?.signal?.addEventListener('abort', () =>
              reject(new DOMException('aborted', 'AbortError')),
            ),
          );
        }
        return Promise.resolve(new Response(JSON.stringify(page(1))));
      }),
    );

    const view = renderWithProviders(<Transactions />);
    await userEvent.click(await screen.findByRole('button', { name: /export csv/i }));
    await vi.waitFor(() => expect(exportCalls).toBe(2));
    expect(exportSignal?.aborted).toBe(false);

    view.unmount();
    expect(exportSignal?.aborted).toBe(true);
    await new Promise((r) => setTimeout(r, 20));
    expect(exportCalls).toBe(2);
    expect(download).not.toHaveBeenCalled();
  });
});
