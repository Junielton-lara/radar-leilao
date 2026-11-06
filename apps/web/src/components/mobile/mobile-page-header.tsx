import { ArrowLeft, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BottomSheet,
  BottomSheetAction,
} from '@/components/mobile/bottom-sheet';
import { Button } from '@/components/ui/button';
import { useNavigateBack } from '@/hooks/use-navigate-back';
import { cn } from '@/lib/utils';

type MenuItem = {
  label: string;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
};

export function MobilePageHeader({
  title,
  subtitle,
  backTo,
  showBack = true,
  actions,
  primaryAction,
  className,
}: {
  title: string;
  subtitle?: string;
  /** Rota segura se não houver histórico interno. */
  backTo?: string;
  showBack?: boolean;
  actions?: MenuItem[];
  primaryAction?: {
    label: string;
    onClick?: () => void;
    to?: string;
    loading?: boolean;
  };
  className?: string;
}) {
  const goBack = useNavigateBack(backTo ?? '/');
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header
        className={cn(
          'sticky top-14 z-10 -mx-3 mb-4 border-b border-border/80 bg-bg-elevated/95 px-3 py-2.5 backdrop-blur sm:top-16 sm:-mx-5 sm:px-4 lg:static lg:mx-0 lg:mb-5 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none',
          className,
        )}
      >
        <div className="flex items-start gap-2">
          {showBack && backTo ? (
            <Button
              variant="ghost"
              size="icon"
              className="mt-0.5 h-11 w-11 shrink-0"
              onClick={goBack}
              aria-label="Voltar"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : null}
          <div className="min-w-0 flex-1 py-1">
            <h1 className="truncate font-display text-lg font-extrabold tracking-tight lg:text-[28px]">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-0.5 truncate text-sm text-text-muted lg:mt-1">
                {subtitle}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {primaryAction?.to ? (
              <Link to={primaryAction.to} className="hidden sm:inline-flex">
                <Button size="sm">{primaryAction.label}</Button>
              </Link>
            ) : primaryAction ? (
              <Button
                size="sm"
                className="hidden sm:inline-flex"
                disabled={primaryAction.loading}
                onClick={primaryAction.onClick}
              >
                {primaryAction.label}
              </Button>
            ) : null}
            {actions?.length ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11"
                aria-label="Mais ações"
                onClick={() => setMenuOpen(true)}
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            ) : null}
          </div>
        </div>
        {primaryAction ? (
          <div className="mt-2 sm:hidden">
            {primaryAction.to ? (
              <Link to={primaryAction.to} className="block">
                <Button className="h-11 w-full">{primaryAction.label}</Button>
              </Link>
            ) : (
              <Button
                className="h-11 w-full"
                disabled={primaryAction.loading}
                onClick={primaryAction.onClick}
              >
                {primaryAction.label}
              </Button>
            )}
          </div>
        ) : null}
      </header>

      {menuOpen && actions?.length ? (
        <BottomSheet title="Ações" onClose={() => setMenuOpen(false)}>
          <div className="space-y-1 pb-2">
            {actions.map((item) =>
              item.href ? (
                <Link
                  key={item.label}
                  to={item.href}
                  className={cn(
                    'flex w-full items-center rounded-xl px-3 py-3.5 text-sm font-medium hover:bg-bg-panel',
                    item.danger && 'text-danger',
                  )}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ) : (
                <BottomSheetAction
                  key={item.label}
                  label={item.label}
                  danger={item.danger}
                  onClick={() => {
                    setMenuOpen(false);
                    item.onClick?.();
                  }}
                />
              ),
            )}
          </div>
        </BottomSheet>
      ) : null}
    </>
  );
}
