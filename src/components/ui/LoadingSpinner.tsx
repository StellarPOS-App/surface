import { cn } from '@/utils/helpers';

const sizes = { sm: 'h-4 w-4 border-2', md: 'h-6 w-6 border-2', lg: 'h-10 w-10 border-[3px]' };

export interface LoadingSpinnerProps {
  size?: keyof typeof sizes;
  className?: string;
  label?: string;
}

export default function LoadingSpinner({
  size = 'md',
  className,
  label = 'Loading',
}: LoadingSpinnerProps) {
  return (
    <span role="status" aria-label={label} className={cn('inline-flex text-ink-3', className)}>
      <span
        className={cn('animate-spin rounded-full border-current border-t-transparent', sizes[size])}
      />
    </span>
  );
}
