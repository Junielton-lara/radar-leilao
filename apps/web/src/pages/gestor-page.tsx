import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/auth-context';
import { apiRequest } from '@/lib/api';
import { formatNumber, formatRelativeTime } from '@/lib/utils';

interface RadarIndicators {
  totalOpportunities: number;
  verified: number;
  inAnalysis: number;
  highRisk: number;
  newLast24h: number;
  endingSoon: number;
  statesMonitored: number;
  sourcesConsulted: number;
  lastCoverageAt: string | null;
}

interface Coverage {
  totalStates: number;
  statesSearched: number;
  isNationalCoverageComplete: boolean;
}

interface AlertRow {
  id: string;
  active: boolean;
}

interface FavoriteRow {
  id: string;
}

export function GestorPage() {
  const { user } = useAuth();

  const indicatorsQuery = useQuery({
    queryKey: ['gestor-indicators'],
    queryFn: () => apiRequest<RadarIndicators>('/radar/indicators'),
  });
  const coverageQuery = useQuery({
    queryKey: ['gestor-coverage'],
    queryFn: () => apiRequest<Coverage>('/radar/coverage'),
  });
  const alertsQuery = useQuery({
    queryKey: ['alerts'],
    queryFn: () => apiRequest<AlertRow[]>('/alerts'),
  });
  const favoritesQuery = useQuery({
    queryKey: ['favorites'],
    queryFn: () => apiRequest<FavoriteRow[]>('/favorites'),
  });

  const d = indicatorsQuery.data;
  const coverage = coverageQuery.data;

  return (
    <div className="mx-auto max-w-5xl space-y-4" data-testid="gestor-page">
      <div>
        <h1 className="font-display text-2xl font-bold">Meu Gestor</h1>
        <p className="mt-1 text-sm text-text-muted">
          Painel pessoal de {user?.name?.split(' ')[0] ?? 'usuário'} · cobertura
          e acompanhamento.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Oportunidades', value: d?.totalOpportunities },
          { label: 'Verificados', value: d?.verified },
          { label: 'Em análise', value: d?.inAnalysis },
          { label: 'Encerrando em breve', value: d?.endingSoon },
          { label: 'Novos (24h)', value: d?.newLast24h },
          { label: 'UFs monitoradas', value: d?.statesMonitored },
          {
            label: 'Cobertura nacional',
            value:
              coverage != null
                ? `${coverage.statesSearched}/${coverage.totalStates}`
                : null,
          },
          {
            label: 'Meus alertas ativos',
            value: alertsQuery.data?.filter((a) => a.active).length,
          },
          {
            label: 'Favoritos',
            value: favoritesQuery.data?.length,
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-border bg-bg-card p-4"
          >
            <div className="text-[11px] text-text-muted">{card.label}</div>
            <div className="mt-1 font-display text-2xl font-bold">
              {typeof card.value === 'string'
                ? card.value
                : formatNumber(Number(card.value ?? 0))}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-bg-card p-4 text-sm text-text-muted">
        Última cobertura:{' '}
        <span className="text-text">
          {d?.lastCoverageAt
            ? formatRelativeTime(d.lastCoverageAt)
            : 'ainda não executada'}
        </span>
        {coverage?.isNationalCoverageComplete ? (
          <span className="ml-2 text-success">· nacional completa</span>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          to="/alertas"
          className="rounded-xl border border-border bg-bg-panel px-3 py-2 text-xs font-medium hover:border-brand/40"
        >
          Gerenciar alertas
        </Link>
        <Link
          to="/favoritos"
          className="rounded-xl border border-border bg-bg-panel px-3 py-2 text-xs font-medium hover:border-brand/40"
        >
          Ver favoritos
        </Link>
        <Link
          to="/relatorios"
          className="rounded-xl border border-border bg-bg-panel px-3 py-2 text-xs font-medium hover:border-brand/40"
        >
          Relatório diário
        </Link>
        <Link
          to="/radar"
          className="rounded-xl border border-border bg-bg-panel px-3 py-2 text-xs font-medium hover:border-brand/40"
        >
          Abrir radar
        </Link>
      </div>
    </div>
  );
}
