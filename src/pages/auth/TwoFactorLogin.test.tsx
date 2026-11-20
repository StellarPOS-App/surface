import { screen } from '@testing-library/react';
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
    twoFactorEnabled: true,
  },
  token: 'tok',
};

function renderLogin() {
  return renderWithProviders(
    <Routes>
      <Route path="/auth/login" element={<Login />} />
      <Route path="/pos" element={<p>register screen</p>} />
    </Routes>,
    { route: '/auth/login' },
  );
}

async function passwordStep() {
  await userEvent.type(screen.getByLabelText('Email'), 'ada@example.com');
  await userEvent.type(screen.getByLabelText('Password'), 'correct-horse-1');
  await userEvent.click(screen.getByRole('button', { name: 'Open register' }));
}

describe('two-factor sign-in', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
      challenge: null,
    });
  });

  it('asks for a code after the password, then opens the register', async () => {
    const fetch = mockFetch({
      'POST /api/v1/auth/login': {
        body: { success: true, data: { twoFactorRequired: true, challenge: 'ch-1' } },
      },
      'POST /api/v1/auth/2fa/verify': { body: { success: true, data: session } },
    });
    renderLogin();
    await passwordStep();

    expect(await screen.findByRole('heading', { name: 'Enter your code' })).toBeInTheDocument();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);

    const verify = screen.getByRole('button', { name: 'Verify and open register' });
    expect(verify).toBeDisabled();
    await userEvent.type(screen.getByLabelText('Authentication code'), '12a3456');
    expect(screen.getByLabelText('Authentication code')).toHaveValue('123456');
    await userEvent.click(verify);

    expect(await screen.findByText('register screen')).toBeInTheDocument();
    const body = JSON.parse(String(fetch.mock.calls[1][1]!.body));
    expect(body).toEqual({ challenge: 'ch-1', code: '123456' });
    expect(useAuthStore.getState()).toMatchObject({ isAuthenticated: true, challenge: null });
  });

  it('accepts a recovery code and shows errors', async () => {
    mockFetch({
      'POST /api/v1/auth/login': {
        body: { success: true, data: { twoFactorRequired: true, challenge: 'ch-2' } },
      },
      'POST /api/v1/auth/2fa/verify': {
        status: 401,
        body: { success: false, error: 'That code is not right' },
      },
    });
    renderLogin();
    await passwordStep();
    await userEvent.click(await screen.findByRole('button', { name: 'Use a recovery code' }));
    await userEvent.type(screen.getByLabelText('Recovery code'), 'k7qp-2m9x');
    expect(screen.getByLabelText('Recovery code')).toHaveValue('K7QP-2M9X');
    await userEvent.click(screen.getByRole('button', { name: 'Verify and open register' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('That code is not right');

    await userEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByRole('heading', { name: 'Sign in to the till' })).toBeInTheDocument();
  });
});
