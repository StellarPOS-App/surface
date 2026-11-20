import type { ReactNode } from 'react';

export default function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <div className="mb-2 h-px w-16 border-t-2 border-dashed border-ink-line" aria-hidden />
      <p className="font-display text-lg font-bold">{title}</p>
      {children && <p className="max-w-sm text-sm text-ink-3">{children}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
