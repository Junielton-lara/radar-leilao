import {
  Bell,
  CalendarDays,
  Heart,
  LayoutDashboard,
  Map,
  MapPinned,
  Menu,
  Settings,
  Sparkles,
  Star,
  FileBarChart2,
  LogOut,
  Search,
  Shield,
  Target,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { MobileBottomNav } from '@/components/mobile/mobile-bottom-nav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/features/auth/auth-context';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', label: 'Visão Geral', icon: LayoutDashboard },
  { to: '/radar', label: 'Mapa do Brasil', icon: Map },
  { to: '/oportunidades', label: 'Oportunidades', icon: Target },
  { to: '/calendario', label: 'Calendário', icon: CalendarDays },
  { to: '/favoritos', label: 'Favoritos', icon: Heart },
  { to: '/alertas', label: 'Meus Alertas', icon: Bell },
  { to: '/gestor', label: 'Meu Gestor', icon: Sparkles },
  { to: '/relatorios', label: 'Relatórios', icon: FileBarChart2 },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
];

const topLinks = [
  { to: '/radar', label: 'Mapa', icon: MapPinned },
  { to: '/oportunidades', label: 'Oportunidades', icon: Target },
  { to: '/calendario', label: 'Calendário', icon: CalendarDays },
  { to: '/alertas', label: 'Alertas', icon: Bell },
  { to: '/favoritos', label: 'Favoritos', icon: Star },
  { to: '/gestor', label: 'Gestor', icon: Sparkles },
];

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isAdmin = user?.role === 'ADMIN';

  const initials =
    user?.name
      ?.split(' ')
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase() ?? 'LX';

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileNavOpen]);

  const sidebar = (
    <>
      <div className="mb-6 px-2">
        <div className="font-display text-xl font-bold tracking-tight text-text">
          Lance<span className="text-brand">X</span>
        </div>
        <div className="mt-0.5 text-[11px] font-semibold text-text-muted">
          Radar de Leilões
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1" data-testid="app-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'group flex min-h-11 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                isActive
                  ? 'bg-brand text-white shadow-lg shadow-brand/25'
                  : 'text-text-muted hover:bg-slate-100 hover:text-text',
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{item.label}</span>
          </NavLink>
        ))}

        {isAdmin ? (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              cn(
                'group mt-2 flex min-h-11 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                isActive
                  ? 'bg-brand text-white shadow-lg shadow-brand/25'
                  : 'text-text-muted hover:bg-slate-100 hover:text-text',
              )
            }
            data-testid="nav-admin"
          >
            <Shield className="h-4 w-4 shrink-0" />
            <span className="flex-1">Admin</span>
          </NavLink>
        ) : null}
      </nav>

      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <div className="text-xs font-bold text-amber-900">Dica do LanceX</div>
        <p className="mt-1 text-[11px] leading-relaxed text-text-muted">
          Ative alertas por UF e categoria para acompanhar novas oportunidades
          assim que forem verificadas.
        </p>
        <Button
          className="mt-3 w-full"
          size="sm"
          onClick={() => navigate('/alertas')}
        >
          Ativar alertas
        </Button>
      </div>

      <div className="mt-3 px-1 text-[10px] text-text-dim">by +Gestor</div>
    </>
  );

  return (
    <div className="flex min-h-dvh bg-bg text-text">
      <aside className="hidden w-[240px] shrink-0 flex-col border-r border-border bg-bg-elevated px-3 py-4 shadow-sm lg:flex">
        {sidebar}
      </aside>

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" data-testid="mobile-nav">
          <button
            type="button"
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            aria-label="Fechar menu"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative z-10 flex h-full w-[min(100%,280px)] flex-col overflow-y-auto border-r border-border-subtle bg-bg-elevated px-3 py-4 shadow-2xl">
            <div className="mb-2 flex justify-end">
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11"
                aria-label="Fechar"
                onClick={() => setMobileNavOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-bg-elevated/95 px-3 shadow-sm backdrop-blur sm:h-16 sm:gap-3 sm:px-5 lg:px-6"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 lg:hidden"
            aria-label="Abrir menu"
            onClick={() => setMobileNavOpen(true)}
            data-testid="mobile-menu-button"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim" />
            <Input
              className="h-11 pl-10 pr-3 sm:pr-12"
              placeholder="Buscar leilões..."
              inputMode="search"
              data-testid="global-search"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const q = (e.target as HTMLInputElement).value.trim();
                  navigate(
                    q
                      ? `/oportunidades?q=${encodeURIComponent(q)}`
                      : '/oportunidades',
                  );
                }
              }}
            />
            <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-border px-1.5 py-0.5 text-[10px] text-text-dim sm:inline">
              /
            </kbd>
          </div>

          <div className="ml-auto flex items-center gap-1 md:gap-2">
            {topLinks.map((link) => (
              <NavLink
                key={link.label}
                to={link.to}
                className="hidden items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-medium text-text-muted transition hover:bg-slate-100 hover:text-text xl:inline-flex"
              >
                <link.icon className="h-3.5 w-3.5" />
                {link.label}
              </NavLink>
            ))}

            {isAdmin ? (
              <NavLink
                to="/admin"
                className="hidden items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-medium text-text-muted transition hover:bg-slate-100 hover:text-text xl:inline-flex"
              >
                <Shield className="h-3.5 w-3.5" />
                Admin
              </NavLink>
            ) : null}

            <div className="ml-1 flex items-center gap-2 rounded-2xl border border-border bg-bg-card/80 px-2 py-1.5 sm:ml-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/20 text-xs font-bold text-brand">
                {initials}
              </div>
              <div className="hidden pr-1 sm:block">
                <div className="text-xs font-semibold leading-tight">
                  Olá, {user?.name?.split(' ')[0] ?? 'usuário'}
                </div>
                <div className="text-[10px] text-text-dim">
                  {isAdmin ? 'Admin' : 'Plano Pro'}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11"
                aria-label="Sair"
                onClick={() => void logout().then(() => navigate('/login'))}
                data-testid="logout-button"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <main
          className={cn(
            'min-h-0 flex-1 overflow-auto px-3 py-3 sm:px-5 sm:py-5 lg:px-6',
            'pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-6',
          )}
        >
          <Outlet />
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
}
