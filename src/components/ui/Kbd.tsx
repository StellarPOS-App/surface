import type { ReactNode } from 'react';

export default function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-ink-line bg-paper px-1 font-mono text-[10px] font-medium text-ink-3">
      {children}
    </kbd>
  );
}
