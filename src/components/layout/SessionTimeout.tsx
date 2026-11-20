import { useState } from 'react';
import { toast } from 'sonner';
import { useCountdown } from '@/hooks/useCountdown';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type { Session } from '@/types';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

const minutes = (env: string | undefined, fallback: number) => {
  const n = Number(env);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export const IDLE_MINUTES = minutes(import.meta.env.VITE_IDLE_TIMEOUT_MINUTES, 30);
export const WARNING_MINUTES = Math.min(5, IDLE_MINUTES / 2);

/**
 * Signs an unattended till out after IDLE_MINUTES without input, with a
 * warning and countdown WARNING_MINUTES beforehand. Staying signed in also
 * renews the session token, so an active shift never hits token expiry.
 */
export default function SessionTimeout() {
  const { isAuthenticated, logout } = useAuthStore();
  const [renewing, setRenewing] = useState(false);
  const { warning, deadline, stayActive } = useIdleTimeout({
    timeoutMs: IDLE_MINUTES * 60_000,
    warningMs: WARNING_MINUTES * 60_000,
    enabled: isAuthenticated,
    onTimeout: () => {
      logout();
      toast.info('Signed out after inactivity');
    },
  });
  const left = useCountdown(warning && deadline ? new Date(deadline).toISOString() : null);

  const stay = async () => {
    setRenewing(true);
    try {
      const session = await api.post<Session>('/auth/refresh');
      useAuthStore.setState({ user: session.user, token: session.token });
    } catch {
      // The countdown keeps running; an expired session signs out as usual.
    } finally {
      setRenewing(false);
      stayActive();
    }
  };

  return (
    <Modal
      open={warning}
      onClose={stay}
      eyebrow="Still there?"
      title="This till is about to sign out"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={logout}>
            Sign out now
          </Button>
          <Button onClick={stay} loading={renewing} autoFocus>
            Stay signed in
          </Button>
        </>
      }
    >
      <p className="text-ink-2">
        No activity for a while. For security, you will be signed out in{' '}
        <span className="figures font-semibold text-ink" aria-live="polite">
          {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
        </span>
        .
      </p>
    </Modal>
  );
}
