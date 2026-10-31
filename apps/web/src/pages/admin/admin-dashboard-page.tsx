import { useQuery } from '@tanstack/react-query';
import { EndpointFallback } from '@/features/admin/endpoint-fallback';
import {
  adminApi,
  isEndpointUnavailable,
  type AdminDashboard,
} from '@/lib/admin-api';
import { apiRequest } from '@/lib/api';
import { formatNumber, formatRelativeTime } from '@/lib/utils';

interface RadarIndicators {
  totalOpportunities: number;
  verified: number;
  inAnalysis: number;
  highRisk: number;
  sourcesConsulted: number;
  lastCoverageAt: string | null;
}

interface IntegrationStatus {
  provider: string;
  active: boolean;
  configured: boolean;
  note: string | null;
}

export function AdminDashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async (): Promise<{
      source: 'admin' | 'fallback';
      data: AdminDashboard;
    }> => {
      try {
        const data = await adminApi.getDashboard();
        return { source: 'admin', data };
      } catch (err) {
        if (!isEndpointUnavailable(err)) throw err;
        const [indicators, integrations] = await Promise.all([
          apiRequest<RadarIndicators>('/radar/indicators'),
          apiRequest<IntegrationStatus[]>('/settings/integrations').catch(
            () => [] as IntegrationStatus[],
          ),
        ]);
        return {
          source: 'fallback',
          data: {
            totalAuctions: indicators.totalOpportunities,
            verified: indicators.verified,
            pendingReview: indicators.inAnalysis,
            highRisk: indicators.highRisk,
            sourcesActive: integrations.filter((i) => i.active).length,
            sourcesConsulted: indicators.sourcesConsulted,
            lastRunAt: indicators.lastCoverageAt,
            note: 'Métricas derivadas de /radar/indicators + /settings/integrations',
          },
        };
      }
    },
  });

  if (dashboardQuery.isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-24" />
        ))}
      </div>
    );
  }

  if (dashboardQuery.isError) {
    return <EndpointFallback error={dashboardQuery.error} />;
  }

  const d = dashboardQuery.data?.data;
  const cards = [
    { label: 'Oportunidades', value: d?.totalAuctions },
    { label: 'Verificados', value: d?.verified },
    { label: 'Em revisão', value: d?.pendingReview },
    { label: 'Fontes / integrações', value: d?.sourcesActive ?? d?.sourcesConsulted },
    { label: 'Runs ativas', value: d?.runsRunning },
    { label: 'Fila', value: d?.queueDepth },
  ].filter((c) => c.value != null);

  return (
    <div className="space-y-4" data-testid="admin-dashboard">
      {dashboardQuery.data?.source === 'fallback' ? (
        <div className="rounded-xl border border-info/30 bg-info/10 px-3 py-2 text-xs text-info">
          Usando indicadores do radar (fallback).
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-border bg-bg-card p-4"
          >
            <div className="text-[11px] text-text-muted">{card.label}</div>
            <div className="mt-1 font-display text-2xl font-bold">
              {formatNumber(Number(card.value ?? 0))}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-bg-card p-4 text-sm text-text-muted">
        Última cobertura / run:{' '}
        <span className="text-text">
          {d?.lastRunAt
            ? formatRelativeTime(String(d.lastRunAt))
            : 'ainda não executada'}
        </span>
        {d?.note ? (
          <p className="mt-2 text-xs text-text-dim">{String(d.note)}</p>
        ) : null}
      </div>
    </div>
  );
}
