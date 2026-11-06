import {
  Bell,
  CalendarDays,
  Heart,
  Map,
  MoreHorizontal,
  Settings,
  Shield,
  Sparkles,
  Target,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { BottomSheet } from '@/components/mobile/bottom-sheet';
import { useAuth } from '@/features/auth/auth-context';
import { cn } from '@/lib/utils';

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
  adminOnly?: boolean;
};

const primary: NavItem[] = [
  { to: '/radar', label: 'Mapa', icon: Map },
  { to: '/oportunidades', label: 'Leilões', icon: Target },
  { to: '/calendario', label: 'Agenda', icon: CalendarDays },
];

const moreItems: Array<NavItem & { group: string }> = [
  { group: 'Radar', to: '/favoritos', label: 'Favoritos', icon: Heart },
  { group: 'Radar', to: '/alertas', label: 'Meus alertas', icon: Bell },
  { group: 'Radar', to: '/gestor', label: 'Meu gestor', icon: Sparkles },
  {
    group: 'Conta',
    to: '/relatorios',
    label: 'Relatórios',
    icon: Target,
  },
  {
    group: 'Conta',
    to: '/configuracoes',
    label: 'Configurações',
    icon: Settings,
  },
  {
    group: 'Admin',
    to: '/admin',
    label: 'Painel admin',
    icon: Shield,
    adminOnly: true,
  },
];

export function MobileBottomNav() {
  const { user } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const isAdmin = user?.role === 'ADMIN';
  const visibleMore = moreItems.filter(
    (item) => !item.adminOnly || isAdmin,
  );

  return (
    <>
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-bg-elevated/95 backdrop-blur lg:hidden"
        style={{ paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom))' }}
        data-testid="mobile-bottom-nav"
      >
        <ul className="grid grid-cols-4 gap-1 px-1 pt-1">
          {primary.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-lg text-[11px] font-semibold text-text-muted',
                    isActive && 'bg-brand/10 text-brand',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={cn('h-5 w-5', isActive && 'text-brand')}
                    />
                    {item.label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
          <li>
            <button
              type="button"
              className="flex min-h-[52px] w-full flex-col items-center justify-center gap-0.5 rounded-lg text-[11px] font-semibold text-text-muted"
              onClick={() => setMoreOpen(true)}
              aria-label="Mais módulos"
            >
              <MoreHorizontal className="h-5 w-5" />
              Mais
            </button>
          </li>
        </ul>
      </nav>

      {moreOpen ? (
        <BottomSheet title="Mais módulos" onClose={() => setMoreOpen(false)}>
          <div className="space-y-4 pb-2">
            {['Radar', 'Conta', 'Admin'].map((group) => {
              const items = visibleMore.filter((item) => item.group === group);
              if (!items.length) return null;
              return (
                <div key={group}>
                  <p className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-wider text-text-dim">
                    {group}
                  </p>
                  <ul className="space-y-1">
                    {items.map((item) => (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          onClick={() => setMoreOpen(false)}
                          className={({ isActive }) =>
                            cn(
                              'flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium text-text hover:bg-bg-panel',
                              isActive && 'bg-brand/10 text-brand',
                            )
                          }
                        >
                          <item.icon className="h-5 w-5 shrink-0" />
                          {item.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </BottomSheet>
      ) : null}
    </>
  );
}
