import { useEffect, useRef } from 'react';

/**
 * Registers a single-key shortcut. Ignored while typing in a field unless
 * `allowInInputs` is set (useful for Escape).
 */
export function useHotkey(
  key: string,
  handler: (e: KeyboardEvent) => void,
  opts: { allowInInputs?: boolean; enabled?: boolean } = {},
) {
  const ref = useRef(handler);
  ref.current = handler;
  const { allowInInputs = false, enabled = true } = opts;

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== key || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const typing = target?.closest('input, textarea, select, [contenteditable="true"]');
      if (typing && !allowInInputs) return;
      ref.current(e);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [key, allowInInputs, enabled]);
}
