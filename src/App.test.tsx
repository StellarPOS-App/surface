import { screen } from '@testing-library/react';
import { useAuthStore } from '@/stores/authStore';
import { mockFetch, renderWithProviders } from '@/test/utils';
import App from './App';

const store = {
  name: 'Test Cafe',
  currency: 'USD',
  taxRateBps: 0,
  stellar: {
    network: 'testnet',
    enabled: false,
    merchantPublicKey: null,
    asset: { code: 'XLM', issuer: null },
    assetRate: '1',
    paymentTtlMinutes: 15,
  },
};

describe('App', () => {
  beforeEach(() => {
    mockFetch({
      'GET /api/v1/store': { body: { success: true, data: store } },
      'GET /api/v1/products': {
        body: { success: true, data: [], pagination: { page: 1, limit: 200, total: 0, pages: 1 } },
      },
      'GET /api/v1/products/categories': { body: { success: true, data: [] } },
      'GET /api/v1/products/catalog': { body: { success: true, data: [] } },
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false });
  });

  it('finishes loading the persisted session and shows sign-in', async () => {
    expect(useAuthStore.getState().isLoading).toBe(false);
    renderWithProviders(<App />, { route: '/pos' });
    expect(await screen.findByRole('heading', { name: 'Sign in to the till' })).toBeInTheDocument();
  });

  it('opens the register for a signed-in user', async () => {
    useAuthStore.setState({
      user: {
        id: 'u1',
        name: 'Ada Admin',
        email: 'a@example.com',
        role: 'admin',
        createdAt: '2026-01-01 00:00:00',
      },
      token: 't',
      isAuthenticated: true,
    });
    renderWithProviders(<App />, { route: '/' });
    expect(await screen.findByRole('navigation', { name: 'Modes' })).toBeInTheDocument();
    expect(await screen.findByText('Nothing rung up yet')).toBeInTheDocument();
  });

  it('loads back-office screens on demand', async () => {
    useAuthStore.setState({
      user: {
        id: 'u1',
        name: 'Ada Admin',
        email: 'a@example.com',
        role: 'cashier',
        createdAt: '2026-01-01 00:00:00',
      },
      token: 't',
      isAuthenticated: true,
    });
    renderWithProviders(<App />, { route: '/settings' });
    expect(await screen.findByRole('heading', { name: 'Till configuration' })).toBeInTheDocument();
  });
});
