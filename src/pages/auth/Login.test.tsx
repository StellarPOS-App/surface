import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { mockFetch, renderWithProviders } from '@/test/utils';
import Login from './Login';

const session = {
  user: {
    id: 'u1',
    name: 'Ada',
    email: 'ada@example.com',
    role: 'admin',
    createdAt: '2026-01-01 00:00:00',
  },
  token: 'tok',
};

function renderLogin(route = '/auth/login') {
  return renderWithProviders(
    <Routes>
      <Route path="/auth/login" element={<Login />} />
      <Route path="/pos" element={<p>register screen</p>} />
      <Route path="/inventory" element={<p>inventory screen</p>} />
    </Routes>,
    { route },
  );
}

describe('Login', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false, error: null });
  });

  it('validates before calling the server', async () => {
    const fetch = mockFetch({});
    renderLogin();
    await userEvent.type(screen.getByLabelText('Email'), 'nope');
    await userEvent.click(screen.getByRole('button', { name: 'Open register' }));
    expect(await screen.findByText('That does not look like an email')).toBeInTheDocument();
    expect(screen.getByText('Enter your password')).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('signs in, persists the session and opens the register', async () => {
    mockFetch({ 'POST /api/v1/auth/login': { body: { success: true, data: session } } });
    renderLogin();
    await userEvent.type(screen.getByLabelText('Email'), 'ada@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'correct-horse-1');
    await userEvent.click(screen.getByRole('button', { name: 'Open register' }));

    expect(await screen.findByText('register screen')).toBeInTheDocument();
    expect(useAuthStore.getState()).toMatchObject({ isAuthenticated: true, token: 'tok' });
    await waitFor(() => expect(localStorage.getItem('stellarpos.session')).toContain('tok'));
  });

  it('shows the server error on bad credentials', async () => {
    mockFetch({
      'POST /api/v1/auth/login': {
        status: 401,
        body: { success: false, error: 'Invalid email or password' },
      },
    });
    renderLogin();
    await userEvent.type(screen.getByLabelText('Email'), 'ada@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Open register' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
  });

  it.each([
    '/auth/login?returnUrl=https://evil.example/steal',
    '/auth/login?returnUrl=//evil.example/steal',
    '/auth/login?returnUrl=/\\evil.example/steal',
    '/auth/login?returnUrl=javascript:alert(1)',
  ])('ignores an external returnUrl (%s)', async (route) => {
    mockFetch({ 'POST /api/v1/auth/login': { body: { success: true, data: session } } });
    renderLogin(route);
    await userEvent.type(screen.getByLabelText('Email'), 'ada@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'correct-horse-1');
    await userEvent.click(screen.getByRole('button', { name: 'Open register' }));

    expect(await screen.findByText('register screen')).toBeInTheDocument();
    expect(screen.queryByText('inventory screen')).not.toBeInTheDocument();
  });

  it('opens a same-origin returnUrl after sign-in', async () => {
    mockFetch({ 'POST /api/v1/auth/login': { body: { success: true, data: session } } });
    renderLogin('/auth/login?returnUrl=/inventory');
    await userEvent.type(screen.getByLabelText('Email'), 'ada@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'correct-horse-1');
    await userEvent.click(screen.getByRole('button', { name: 'Open register' }));

    expect(await screen.findByText('inventory screen')).toBeInTheDocument();
  });
});
