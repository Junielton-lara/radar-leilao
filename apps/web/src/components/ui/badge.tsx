import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Badge({
  className,
  children,
  style,
}: {
  className?: string;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
        className,
      )}
      style={style}
    >
      {children}
    </span>
  );
}
