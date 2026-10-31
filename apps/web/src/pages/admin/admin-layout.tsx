import { NavLink, Navigate, Outlet } from 'react-router-dom';
import {
  Database,
  LayoutDashboard,
  ListChecks,
  Radar,
  Settings2,
  Shield,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/features/auth/auth-context';
import { cn } from '@/lib/utils';

const adminNav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/fontes', label: 'Fontes', icon: Database },
  { to: '/admin/coletas', label: 'Coletas', icon: Radar },
  { to: '/admin/revisao', label: 'Revisão', icon: ListChecks },
  { to: '/admin/filas', label: 'Filas', icon: Shield },
  { to: '/admin/inteligencia', label: 'Intelligence', icon: Sparkles },
  { to: '/admin/integracoes', label: 'Integrações', icon: Settings2 },
];

export function AdminLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="skeleton mx-auto h-64 max-w-5xl" />;
  }

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4" data-testid="admin-area">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Admin</h1>
        <p className="mt-1 text-sm text-text-muted">
          Operação LanceX · acesso restrito a ADMIN
        </p>
      </div>

      <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-border bg-bg-card/80 p-1">
        {adminNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition',
                isActive
                  ? 'bg-brand text-white'
                  : 'text-text-muted hover:bg-white/5 hover:text-text',
              )
            }
          >
            <item.icon className="h-3.5 w-3.5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}
