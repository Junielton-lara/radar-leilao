import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Play, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EndpointFallback } from '@/features/admin/endpoint-fallback';
import { adminApi } from '@/lib/admin-api';
import { formatRelativeTime } from '@/lib/utils';

export function AdminRunsPage() {
  const queryClient = useQueryClient();

  const runsQuery = useQuery({
    queryKey: ['admin-runs'],
    queryFn: () => adminApi.listRuns(),
  });

  const startMutation = useMutation({
    mutationFn: () => adminApi.startRun(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-runs'] });
      void queryClient.invalidateQueries({ queryKey: ['radar-indicators'] });
    },
  });

  const backfillMutation = useMutation({
    mutationFn: () => adminApi.backfillMapCoordinates(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['auctions-bbox'] });
    },
  });

  if (runsQuery.isError) {
    return <EndpointFallback error={runsQuery.error} />;
  }

  return (
    <div className="space-y-4" data-testid="admin-runs">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-text-muted">
          Execuções de discovery · cron horário + botão manual
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => backfillMutation.mutate()}
            disabled={backfillMutation.isPending}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Pins no mapa (UF)
          </Button>
          <Button
            size="sm"
            onClick={() => startMutation.mutate()}
            disabled={startMutation.isPending}
          >
            <Play className="h-3.5 w-3.5" />
            {startMutation.isPending ? 'Coletando…' : 'Iniciar coleta'}
          </Button>
        </div>
      </div>

      {startMutation.isError ? (
        <div className="rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
          {(startMutation.error as Error).message}
        </div>
      ) : null}
      {startMutation.isSuccess && startMutation.data ? (
        <div className="rounded-xl border border-success/40 bg-success/10 px-3 py-2 text-xs text-success">
          Coleta concluída · {startMutation.data.foundCount ?? 0} URLs
          encontradas · {startMutation.data.opportunitiesFound ?? 0} novos
          persistidos · demais entradas geram histórico (URL já conhecida).
        </div>
      ) : null}

      {runsQuery.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-16" />
          ))}
        </div>
      ) : (runsQuery.data?.length ?? 0) === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-xs text-text-dim">
          Nenhuma execução registrada.
        </div>
      ) : (
        <ul className="space-y-2">
          {runsQuery.data?.map((run) => (
            <li
              key={run.id}
              className="flex flex-col gap-2 rounded-2xl border border-border bg-bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="text-sm font-semibold">
                  {run.sourceName ?? run.name ?? 'Coleta Tavily'}
                </div>
                <div className="mt-1 text-[11px] text-text-dim">
                  {run.status}
                  {run.startedAt
                    ? ` · início ${formatRelativeTime(run.startedAt)}`
                    : ''}
                  {run.foundCount != null
                    ? ` · ${run.foundCount} URLs na rodada`
                    : ''}
                  {run.opportunitiesFound != null
                    ? ` · ${run.opportunitiesFound} novos no banco`
                    : ''}
                </div>
              </div>
              <span className="text-[11px] uppercase text-text-dim">
                {run.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
