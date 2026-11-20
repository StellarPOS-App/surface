import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { api } from '@/lib/api';
import type { LoginCredentials, RegisterPayload, Session, TwoFactorChallenge, User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  /** True until the persisted session has been read from storage. */
  isLoading: boolean;
  error: string | null;
  /** Set after a correct password when the account needs a 2FA code. */
  challenge: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  verifyTwoFactor: (code: string) => Promise<void>;
  cancelTwoFactor: () => void;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => {
      const startSession = async (path: string, body: unknown) => {
        set({ error: null });
        try {
          const res = await api.post<Session | TwoFactorChallenge>(path, body);
          if ('twoFactorRequired' in res) {
            set({ challenge: res.challenge });
            return;
          }
          set({ user: res.user, token: res.token, isAuthenticated: true, challenge: null });
        } catch (err) {
          set({ error: (err as Error).message });
          throw err;
        }
      };
      return {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: true,
        error: null,
        challenge: null,
        login: (credentials) => startSession('/auth/login', credentials),
        verifyTwoFactor: async (code) => {
          const challenge = useAuthStore.getState().challenge;
          if (!challenge) throw new Error('Sign in with your password first');
          await startSession('/auth/2fa/verify', { challenge, code });
        },
        cancelTwoFactor: () => set({ challenge: null, error: null }),
        register: (payload) => startSession('/auth/register', payload),
        logout: () => set({ user: null, token: null, isAuthenticated: false, challenge: null }),
        setUser: (user) => set({ user }),
        clearError: () => set({ error: null }),
      };
    },
    {
      name: 'stellarpos.session',
      storage: createJSONStorage(() => localStorage),
      partialize: ({ user, token, isAuthenticated }) => ({ user, token, isAuthenticated }),
    },
  ),
);

// localStorage is synchronous, so hydration usually finishes inside create()
// above, before useAuthStore exists. Check after creation instead of using
// onRehydrateStorage, which would run too early to update the store.
const finishLoading = () => useAuthStore.setState({ isLoading: false });
if (useAuthStore.persist.hasHydrated()) finishLoading();
else useAuthStore.persist.onFinishHydration(finishLoading);
