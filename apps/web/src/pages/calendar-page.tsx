import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import type { AuctionSummary, Paginated } from '@lancex/shared';
import { Badge } from '@/components/ui/badge';
import { STATUS_COLORS } from '@/features/radar/category-meta';
import { apiRequest } from '@/lib/api';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';

function groupByDay(items: AuctionSummary[]) {
  const map = new Map<string, AuctionSummary[]>();
  for (const item of items) {
    const key = item.endDate
      ? new Date(item.endDate).toISOString().slice(0, 10)
      : 'sem-data';
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
}

export function CalendarPage() {
  const endingQuery = useQuery({
    queryKey: ['calendar-ending'],
    queryFn: () =>
      apiRequest<AuctionSummary[]>('/auctions/ending-soon').catch(() => null),
  });

  const listQuery = useQuery({
    queryKey: ['calendar-list'],
    enabled: !endingQuery.data?.length,
    queryFn: () =>
      apiRequest<Paginated<AuctionSummary>>(
        '/auctions?page=1&pageSize=40&sort=ending',
      ),
  });

  const items =
    endingQuery.data ??
    listQuery.data?.items ??
    [];

  const groups = groupByDay(items);

  return (
    <div className="mx-auto max-w-5xl space-y-4" data-testid="calendar-page">
      <div>
        <h1 className="font-display text-2xl font-bold">Calendário</h1>
        <p className="mt-1 text-sm text-text-muted">
          Encerramentos próximos agrupados por data.
        </p>
      </div>

      {endingQuery.isLoading || listQuery.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-24" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center text-sm text-text-dim">
          Nenhum leilão com data de encerramento cadastrada ainda.
        </div>
      ) : (
        groups.map(([day, dayItems]) => (
          <section key={day} className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-text-dim">
              {day === 'sem-data'
                ? 'Sem data de encerramento'
                : new Date(`${day}T12:00:00`).toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                  })}
            </h2>
            {dayItems.map((item) => (
              <Link
                key={item.id}
                to={`/oportunidades/${item.id}`}
                className="flex flex-col gap-2 rounded-2xl border border-border bg-bg-card p-4 transition hover:border-brand/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <Badge
                    style={{
                      background: `${STATUS_COLORS[item.verificationStatus] ?? '#888'}22`,
                      color: STATUS_COLORS[item.verificationStatus] ?? '#888',
                    }}
                  >
                    {item.verificationStatus}
                  </Badge>
                  <div className="mt-1 text-sm font-semibold">{item.title}</div>
                  <div className="mt-1 text-[11px] text-text-dim">
                    {[item.city, item.state].filter(Boolean).join(' · ') ||
                      'Local pendente'}
                    {item.endDate
                      ? ` · encerra ${formatRelativeTime(item.endDate)}`
                      : ''}
                  </div>
                </div>
                <div className="text-sm font-bold text-accent">
                  {formatCurrency(item.minimumBid)}
                </div>
              </Link>
            ))}
          </section>
        ))
      )}
    </div>
  );
}
