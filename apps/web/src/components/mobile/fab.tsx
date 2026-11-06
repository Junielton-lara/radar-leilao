import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

/** Um único FAB por tela; posicionado acima da bottom nav no mobile. */
export function Fab({
  to,
  onClick,
  label,
  className,
}: {
  to?: string;
  onClick?: () => void;
  label: string;
  className?: string;
}) {
  const classes = cn(
    'fixed z-30 grid h-14 w-14 place-items-center rounded-full bg-brand text-white shadow-lg shadow-brand/30',
    'right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] lg:bottom-8',
    'active:scale-95 focus-visible:ring-2 focus-visible:ring-brand/40',
    className,
  );

  if (to) {
    return (
      <Link to={to} className={classes} aria-label={label} title={label}>
        <Plus className="h-6 w-6" />
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      <Plus className="h-6 w-6" />
    </button>
  );
}
