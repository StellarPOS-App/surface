import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { renderWithProviders } from '@/test/utils';
import ProtectedRoute from './ProtectedRoute';

const user = (role: 'admin' | 'manager' | 'cashier') => ({
  id: 'u1',
  name: 'Test',
  email: 't@example.com',
  role,
  createdAt: '2026-01-01 00:00:00',
});

function tree(minRole?: 'manager') {
  return (
    <Routes>
      <Route path="/auth/login" element={<p>login page</p>} />
      <Route
        path="/secret"
        element={
          <ProtectedRoute minRole={minRole}>
            <p>secret</p>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

describe('ProtectedRoute', () => {
  afterEach(() => useAuthStore.setState({ user: null, token: null, isAuthenticated: false }));

  it('redirects signed-out visitors to login', () => {
    renderWithProviders(tree(), { route: '/secret' });
    expect(screen.getByText('login page')).toBeInTheDocument();
  });

  it('renders for signed-in users', () => {
    useAuthStore.setState({ user: user('cashier'), token: 't', isAuthenticated: true });
    renderWithProviders(tree(), { route: '/secret' });
    expect(screen.getByText('secret')).toBeInTheDocument();
  });

  it('blocks roles below the minimum', () => {
    useAuthStore.setState({ user: user('cashier'), token: 't', isAuthenticated: true });
    renderWithProviders(tree('manager'), { route: '/secret' });
    expect(screen.queryByText('secret')).not.toBeInTheDocument();
    expect(screen.getByText(/needs a manager/)).toBeInTheDocument();
  });
});
