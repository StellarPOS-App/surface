import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/utils/helpers';
import LoadingSpinner from './LoadingSpinner';

export type ButtonVariant =
  'primary' | 'secondary' | 'ghost' | 'danger' | 'cash' | 'card' | 'lumen';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-paper hover:bg-ink/90 shadow-press',
  secondary: 'bg-paper-card text-ink border border-ink-line hover:bg-paper-2',
  ghost: 'text-ink-2 hover:bg-paper-2 hover:text-ink',
  danger: 'bg-signal text-white hover:bg-signal/90 shadow-press',
  cash: 'bg-cash text-white hover:bg-cash-ink shadow-press',
  card: 'bg-card text-white hover:bg-card-ink shadow-press',
  lumen: 'bg-lumen text-white hover:bg-lumen-ink shadow-press',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5 rounded-md',
  md: 'h-10 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-12 px-5 text-base gap-2 rounded-lg',
  xl: 'h-16 px-6 text-lg gap-3 rounded-xl',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      fullWidth,
      className,
      children,
      disabled,
      type = 'button',
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex select-none items-center justify-center font-medium transition-[background,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lumen focus-visible:ring-offset-2 focus-visible:ring-offset-paper active:translate-y-px disabled:pointer-events-none disabled:opacity-45',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? <LoadingSpinner size="sm" className="text-current" /> : icon}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';

export default Button;
