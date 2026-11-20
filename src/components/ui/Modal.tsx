import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/utils/helpers';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  eyebrow?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** Prevent closing by Escape or backdrop, e.g. while a payment settles. */
  locked?: boolean;
  /** Slide in from the right instead of centering. */
  drawer?: boolean;
}

const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-3xl' };

export default function Modal({
  open,
  onClose,
  title,
  eyebrow,
  children,
  footer,
  size = 'md',
  locked,
  drawer,
}: ModalProps) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const previous = useRef<Element | null>(null);

  // Callers usually pass a new onClose each render; read it through a ref so
  // the effect below runs once per opening instead of on every render (which
  // re-registered listeners and pulled focus back to the first field).
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    previous.current = document.activeElement;
    const focusable = panel.current?.querySelector<HTMLElement>(
      '[autofocus], input, select, textarea, button:not([data-close])',
    );
    (focusable ?? panel.current)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !locked) onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      (previous.current as HTMLElement | null)?.focus?.();
    };
  }, [open, locked]);

  if (!open) return null;

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-50 flex',
        drawer ? 'justify-end' : 'items-end justify-center sm:items-center sm:p-6',
      )}
    >
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
        onClick={locked ? undefined : onClose}
        aria-hidden
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'relative flex max-h-[100dvh] w-full animate-print-in flex-col bg-paper-card shadow-slip',
          drawer
            ? 'h-full max-w-xl border-l border-ink-line'
            : cn('rounded-t-2xl sm:rounded-2xl', widths[size], 'sm:max-h-[90vh]'),
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-ink-line px-6 py-4">
          <div>
            {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
            <h2 id={titleId} className="font-display text-xl font-bold leading-tight">
              {title}
            </h2>
          </div>
          {!locked && (
            <button
              data-close
              onClick={onClose}
              className="-mr-2 rounded-md p-2 text-ink-3 hover:bg-paper-2 hover:text-ink"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </header>
        <div className="scroll-thin flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <footer className="flex flex-wrap justify-end gap-2 border-t border-ink-line bg-paper/60 px-6 py-4">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}
