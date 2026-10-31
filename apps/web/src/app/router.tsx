import { Navigate, Outlet, createBrowserRouter } from 'react-router-dom';
import { useAuth } from '@/features/auth/auth-context';
import { AppShell } from '@/layouts/app-shell';
import { AdminDashboardPage } from '@/pages/admin/admin-dashboard-page';
import { AdminIntelligencePage } from '@/pages/admin/admin-intelligence-page';
import { AdminIntegrationsPage } from '@/pages/admin/admin-integrations-page';
import { AdminLayout } from '@/pages/admin/admin-layout';
import { AdminQueuesPage } from '@/pages/admin/admin-queues-page';
import { AdminReviewPage } from '@/pages/admin/admin-review-page';
import { AdminRunsPage } from '@/pages/admin/admin-runs-page';
import { AdminSourcesPage } from '@/pages/admin/admin-sources-page';
import { AlertsPage } from '@/pages/alerts-page';
import { CalendarPage } from '@/pages/calendar-page';
import { FavoritesPage } from '@/pages/favorites-page';
import { GestorPage } from '@/pages/gestor-page';
import { LoginPage } from '@/pages/login-page';
import { OpportunitiesPage } from '@/pages/opportunities-page';
import { OpportunityDetailPage } from '@/pages/opportunity-detail-page';
import { RadarPage } from '@/pages/radar-page';
import { ReportsPage } from '@/pages/reports-page';
import { SettingsPage } from '@/pages/settings-page';

function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-text-muted">
        Carregando LanceX...
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function AdminRoute() {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="skeleton mx-auto h-40 max-w-5xl" />;
  }
  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <RadarPage /> },
          { path: 'radar', element: <RadarPage /> },
          { path: 'oportunidades', element: <OpportunitiesPage /> },
          { path: 'oportunidades/:id', element: <OpportunityDetailPage /> },
          { path: 'configuracoes', element: <SettingsPage /> },
          { path: 'favoritos', element: <FavoritesPage /> },
          { path: 'alertas', element: <AlertsPage /> },
          { path: 'gestor', element: <GestorPage /> },
          { path: 'relatorios', element: <ReportsPage /> },
          { path: 'calendario', element: <CalendarPage /> },
          {
            path: 'admin',
            element: <AdminRoute />,
            children: [
              {
                element: <AdminLayout />,
                children: [
                  { index: true, element: <AdminDashboardPage /> },
                  { path: 'fontes', element: <AdminSourcesPage /> },
                  { path: 'coletas', element: <AdminRunsPage /> },
                  { path: 'revisao', element: <AdminReviewPage /> },
                  { path: 'filas', element: <AdminQueuesPage /> },
                  { path: 'integracoes', element: <AdminIntegrationsPage /> },
                  { path: 'inteligencia', element: <AdminIntelligencePage /> },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
