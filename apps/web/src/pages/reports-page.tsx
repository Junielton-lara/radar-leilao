import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { formatNumber } from '@/lib/utils';

interface DailyReport {
  day: string;
  auctionsCreated: number;
  byStatus: Record<string, number>;
  searchRuns: number;
  searchFailures: number;
  tavilyCreditsUsed: number;
  aiTokensUsed: number;
  aiEstimatedCost: number;
  sourcesActive: number;
  ufsSearchedToday: number;
  narrative?: string | null;
}

export function ReportsPage() {
  const reportQuery = useQuery({
    queryKey: ['reports-daily'],
    queryFn: () => apiRequest<DailyReport>('/reports/daily'),
  });

  const data = reportQuery.data;

  return (
    <div className="mx-auto max-w-5xl space-y-4" data-testid="reports-page">
      <div>
        <h1 className="font-display text-2xl font-bold">Relatórios</h1>
        <p className="mt-1 text-sm text-text-muted">
          Resumo executivo diário da cobertura e das coletas.
        </p>
      </div>

      {reportQuery.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-24" />
          ))}
        </div>
      ) : reportQuery.isError ? (
        <div className="rounded-2xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {(reportQuery.error as Error).message}
        </div>
      ) : (
        <>
          <p className="text-xs text-text-dim">Dia: {data?.day}</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: 'Novos leilões', value: data?.auctionsCreated },
              { label: 'Rodadas de busca', value: data?.searchRuns },
              { label: 'Falhas de busca', value: data?.searchFailures },
              { label: 'UFs buscadas hoje', value: data?.ufsSearchedToday },
              { label: 'Fontes ativas', value: data?.sourcesActive },
              { label: 'Créditos Tavily', value: data?.tavilyCreditsUsed },
              { label: 'Tokens IA', value: data?.aiTokensUsed },
              {
                label: 'Custo IA est.',
                value: data?.aiEstimatedCost,
                money: true,
              },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-2xl border border-border bg-bg-card p-4"
              >
                <div className="text-[11px] text-text-muted">{card.label}</div>
                <div className="mt-1 font-display text-2xl font-bold">
                  {card.money
                    ? `R$ ${Number(card.value ?? 0).toFixed(4)}`
                    : formatNumber(Number(card.value ?? 0))}
                </div>
              </div>
            ))}
          </div>

          {data?.byStatus && Object.keys(data.byStatus).length > 0 ? (
            <div className="rounded-2xl border border-border bg-bg-card p-4">
              <h2 className="text-sm font-semibold">Por status de verificação</h2>
              <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                {Object.entries(data.byStatus).map(([status, count]) => (
                  <div
                    key={status}
                    className="flex justify-between rounded-xl border border-border-subtle px-3 py-2 text-xs"
                  >
                    <dt className="text-text-muted">{status}</dt>
                    <dd className="font-semibold">{formatNumber(count)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}

          {data?.narrative ? (
            <div className="rounded-2xl border border-border bg-bg-card p-4 text-sm text-text-muted">
              {data.narrative}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
