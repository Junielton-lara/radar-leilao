import { useQuery } from '@tanstack/react-query';
import { EndpointFallback } from '@/features/admin/endpoint-fallback';
import { adminApi } from '@/lib/admin-api';
import { formatNumber } from '@/lib/utils';

export function AdminQueuesPage() {
  const queuesQuery = useQuery({
    queryKey: ['admin-queues'],
    queryFn: () => adminApi.getQueues(),
    refetchInterval: 15_000,
  });

  if (queuesQuery.isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-32" />
        ))}
      </div>
    );
  }

  if (queuesQuery.isError) {
    return <EndpointFallback error={queuesQuery.error} />;
  }

  const queues = queuesQuery.data ?? [];

  if (queues.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-xs text-text-dim">
        Nenhuma fila reportada pela API.
      </div>
    );
  }

  const inlineMode = queues.every((q) => q.paused);

  return (
    <div className="space-y-3" data-testid="admin-queues">
      {inlineMode ? (
        <div className="rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
          Redis/filas desativados neste ambiente — jobs rodam inline sob demanda
          (botão Coletas / cron).
        </div>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {queues.map((queue) => (
        <div
          key={queue.name}
          className="rounded-2xl border border-border bg-bg-card p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-semibold">{queue.name}</div>
            {queue.paused ? (
              <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-bold text-warning">
                pausada
              </span>
            ) : null}
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-text-muted">
            <Stat label="waiting" value={queue.waiting} />
            <Stat label="active" value={queue.active} />
            <Stat label="completed" value={queue.completed} />
            <Stat label="failed" value={queue.failed} />
            <Stat label="delayed" value={queue.delayed} />
          </dl>
        </div>
      ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-panel/50 px-2 py-1.5">
      <dt className="text-[10px] uppercase text-text-dim">{label}</dt>
      <dd className="font-semibold text-text">
        {value == null ? '—' : formatNumber(value)}
      </dd>
    </div>
  );
}
