import { useAuthStore } from '@/stores/authStore';
import { mockFetch } from '@/test/utils';
import { api, ApiError } from './api';

describe('api client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false });
  });

  it('unwraps the success envelope and sends the bearer token', async () => {
    useAuthStore.setState({ token: 'tok', isAuthenticated: true });
    const fetch = mockFetch({
      'GET /api/v1/store': { body: { success: true, data: { name: 'Shop' } } },
    });
    await expect(api.get('/store')).resolves.toEqual({ name: 'Shop' });
    const [, init] = fetch.mock.calls[0];
    expect((init!.headers as Record<string, string>).Authorization).toBe('Bearer tok');
  });

  it('keeps pagination for list endpoints', async () => {
    mockFetch({
      'GET /api/v1/products': {
        body: { success: true, data: [], pagination: { page: 1, limit: 20, total: 0, pages: 1 } },
      },
    });
    const page = await api.getPage<{ pagination: { total: number } }>('/products', {
      search: '',
      limit: 20,
    });
    expect(page.pagination.total).toBe(0);
  });

  it('raises ApiError with the server message and validation details', async () => {
    mockFetch({
      'POST /api/v1/products': {
        status: 400,
        body: {
          success: false,
          error: 'Validation failed',
          details: [{ field: 'sku', message: 'bad' }],
        },
      },
    });
    const err = await api.post('/products', {}).catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({
      status: 400,
      message: 'Validation failed',
      details: [{ field: 'sku', message: 'bad' }],
    });
  });

  it('signs out when the server rejects the session', async () => {
    useAuthStore.setState({ token: 'expired', isAuthenticated: true });
    mockFetch({
      'GET /api/v1/auth/me': {
        status: 401,
        body: { success: false, error: 'Invalid or expired token' },
      },
    });
    await expect(api.get('/auth/me')).rejects.toThrow('Invalid or expired token');
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('reports network failures clearly', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(api.get('/store')).rejects.toMatchObject({
      status: 0,
      message: expect.stringMatching(/Cannot reach/),
    });
  });
});
