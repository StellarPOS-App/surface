import { useAuthStore } from '@/stores/authStore';
import type { Role } from '@/types';

const RANK: Record<Role, number> = { cashier: 0, manager: 1, admin: 2 };

/** Session state plus role checks. `can('manager')` is true for managers and admins. */
export function useAuth() {
  const state = useAuthStore();
  const role = state.user?.role;
  return {
    ...state,
    role,
    can: (min: Role) => (role ? RANK[role] >= RANK[min] : false),
  };
}
