import { useAuthStore } from '@/stores/authStore';
import { mockFetch } from '@/test/utils';
import { loadReceipt, ReceiptAccessError, receiptAccessMessage } from './receiptAccess';

describe('receipt access guard', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false });
  });

  it('refuses anonymous access without making a request', async () => {
    const fetch = mockFetch({});
    await expect(loadReceipt('txn_1')).rejects.toBeInstanceOf(ReceiptAccessError);
    expect(fetch).not.toHaveBeenCalled();
    expect(receiptAccessMessage(new ReceiptAccessError('unauthenticated'))).toBe(
      'Sign in to view this receipt.',
    );
  });

  it('rejects path-like or non-numeric guesses before any request', async () => {
    useAuthStore.setState({ token: 'tok', isAuthenticated: true });
    const fetch = mockFetch({});
    await expect(loadReceipt('../../admin')).rejects.toMatchObject({ reason: 'invalid-id' });
    await expect(loadReceipt('12345/../../secret')).rejects.toMatchObject({ reason: 'invalid-id' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('loads a receipt only through the authenticated transactions endpoint', async () => {
    useAuthStore.setState({ token: 'tok', isAuthenticated: true });
    const fetch = mockFetch({
      'GET /api/v1/transactions/txn_1': {
        body: { success: true, data: { id: 'txn_1', reference: 'S-000001' } },
      },
    });

    await expect(loadReceipt('txn_1')).resolves.toMatchObject({ id: 'txn_1' });
    const [, init] = fetch.mock.calls[0]!;
    expect((init!.headers as Record<string, string>).Authorization).toBe('Bearer tok');
  });

  it('rejects a response for a different receipt', async () => {
    useAuthStore.setState({ token: 'tok', isAuthenticated: true });
    mockFetch({
      'GET /api/v1/transactions/txn_1': {
        body: { success: true, data: { id: 'someone-elses' } },
      },
    });
    await expect(loadReceipt('txn_1')).rejects.toMatchObject({ reason: 'not-found' });
  });
});
