import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/utils/helpers';

const control =
  'block w-full rounded-lg border-ink-line bg-paper-card text-ink placeholder:text-ink-3 shadow-sm focus:border-lumen focus:ring-lumen disabled:opacity-60';

interface FieldShellProps {
  label?: string;
  hint?: ReactNode;
  error?: string;
  id: string;
  children: ReactNode;
  className?: string;
}

function FieldShell({ label, hint, error, id, children, className }: FieldShellProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-ink-2">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-signal">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-ink-3">{hint}</p>
      ) : null}
    </div>
  );
}

type Common = { label?: string; hint?: ReactNode; error?: string; wrapperClassName?: string };

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & Common & { leading?: ReactNode }
>(({ label, hint, error, wrapperClassName, className, id, leading, ...props }, ref) => {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <FieldShell label={label} hint={hint} error={error} id={fieldId} className={wrapperClassName}>
      <div className="relative">
        {leading && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-3">
            {leading}
          </span>
        )}
        <input
          ref={ref}
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          className={cn(
            control,
            leading && 'pl-9',
            error && 'border-signal focus:border-signal focus:ring-signal',
            className,
          )}
          {...props}
        />
      </div>
    </FieldShell>
  );
});
Input.displayName = 'Input';

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & Common
>(({ label, hint, error, wrapperClassName, className, id, ...props }, ref) => {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <FieldShell label={label} hint={hint} error={error} id={fieldId} className={wrapperClassName}>
      <textarea
        ref={ref}
        id={fieldId}
        aria-invalid={error ? true : undefined}
        className={cn(control, className)}
        {...props}
      />
    </FieldShell>
  );
});
Textarea.displayName = 'Textarea';

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & Common
>(({ label, hint, error, wrapperClassName, className, id, children, ...props }, ref) => {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <FieldShell label={label} hint={hint} error={error} id={fieldId} className={wrapperClassName}>
      <select ref={ref} id={fieldId} className={cn(control, 'pr-8', className)} {...props}>
        {children}
      </select>
    </FieldShell>
  );
});
Select.displayName = 'Select';
