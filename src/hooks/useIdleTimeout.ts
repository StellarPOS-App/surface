import { useCallback, useEffect, useRef, useState } from 'react';

const ACTIVITY = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;

/**
 * Tracks user inactivity. After `timeoutMs - warningMs` idle it reports
 * `warning`, and after `timeoutMs` it calls `onTimeout`. Any activity before
 * the warning resets the clock; once the warning shows, only `stayActive`
 * (an explicit choice) resets it, so a stray tap cannot dismiss it unseen.
 */
export function useIdleTimeout({
  timeoutMs,
  warningMs,
  onTimeout,
  enabled = true,
}: {
  timeoutMs: number;
  warningMs: number;
  onTimeout: () => void;
  enabled?: boolean;
}) {
  const [warning, setWarning] = useState(false);
  const [deadline, setDeadline] = useState<number | null>(null);
  const timers = useRef<number[]>([]);
  const warned = useRef(false);
  const timeoutRef = useRef(onTimeout);
  timeoutRef.current = onTimeout;

  const schedule = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    warned.current = false;
    setWarning(false);
    const end = Date.now() + timeoutMs;
    setDeadline(end);
    timers.current = [
      window.setTimeout(() => {
        warned.current = true;
        setWarning(true);
      }, timeoutMs - warningMs),
      window.setTimeout(() => timeoutRef.current(), timeoutMs),
    ];
  }, [timeoutMs, warningMs]);

  useEffect(() => {
    if (!enabled) return;
    schedule();
    const onActivity = () => {
      if (!warned.current) schedule();
    };
    ACTIVITY.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    return () => {
      ACTIVITY.forEach((e) => window.removeEventListener(e, onActivity));
      timers.current.forEach((t) => window.clearTimeout(t));
    };
  }, [enabled, schedule]);

  return { warning, deadline, stayActive: schedule };
}
