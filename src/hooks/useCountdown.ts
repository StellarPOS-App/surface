import { useEffect, useState } from 'react';

/** Seconds remaining until `deadline` (ISO string), ticking once a second. */
export function useCountdown(deadline: string | null | undefined): number {
  const calc = () =>
    deadline ? Math.max(0, Math.round((new Date(deadline).getTime() - Date.now()) / 1000)) : 0;
  const [left, setLeft] = useState(calc);

  useEffect(() => {
    setLeft(calc());
    if (!deadline) return;
    const id = window.setInterval(() => setLeft(calc()), 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadline]);

  return left;
}
