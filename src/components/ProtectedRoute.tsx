import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { Role } from '@/types';
import EmptyState from './ui/EmptyState';

/**
 * Sends signed-out visitors to the login page (remembering where they were
 * going) and blocks roles below `minRole`.
 */
export default function ProtectedRoute({
  children,
  minRole,
}: {
  children: ReactNode;
  minRole?: Role;
}) {
  const { isAuthenticated, can } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />;
  }
  if (minRole && !can(minRole)) {
    return (
      <EmptyState title="Not on your shift">
        This screen needs a {minRole} or above. Ask a manager to open it for you.
      </EmptyState>
    );
  }
  return <>{children}</>;
}
