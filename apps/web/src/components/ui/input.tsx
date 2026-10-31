import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      'flex h-10 w-full rounded-xl border border-border bg-bg-elevated px-3 py-2 text-sm text-text placeholder:text-text-dim outline-none transition focus:border-accent/50 focus:ring-2 focus:ring-accent/20',
      className,
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = 'Input';
