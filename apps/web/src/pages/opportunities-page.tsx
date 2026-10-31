import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import type { Paginated, AuctionSummary } from '@lancex/shared';
import { Badge } from '@/components/ui/badge';
import { STATUS_COLORS } from '@/features/radar/category-meta';
import { apiRequest } from '@/lib/api';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';

export function OpportunitiesPage() {
  const [params] = useSearchParams();
  const q = params.get('q') ?? '';
  const sort = params.get('sort') ?? 'recent';

  const listQuery = useQuery({
    queryKey: ['auctions-list', q, sort],
    queryFn: () => {
      const search = new URLSearchParams({
        page: '1',
        pageSize: '20',
        sort,
      });
      if (q) search.set('q', q);
      return apiRequest<Paginated<AuctionSummary>>(`/auctions?${search}`);
    },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold">Oportunidades</h1>
        <p className="mt-1 text-sm text-text-muted">
          Carros, motos, caminhões, sucatas e peças para desmanche — dados do
          banco após coleta com Tavily.
        </p>
      </div>

      {listQuery.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-24" />
          ))}
        </div>
      ) : (listQuery.data?.items.length ?? 0) === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <p className="text-sm font-medium text-text">
            Nenhuma oportunidade cadastrada
          </p>
          <p className="mt-2 text-xs text-text-dim">
            Sem dados inventados. Configure Tavily em Admin → Integrações e
            clique em “Iniciar coleta” em Admin → Coletas.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {listQuery.data?.items.map((item) => (
            <Link
              key={item.id}
              to={`/oportunidades/${item.id}`}
              className="flex flex-col gap-2 rounded-2xl border border-border bg-bg-card p-4 transition hover:border-brand/40 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <Badge
                  style={{
                    background: `${STATUS_COLORS[item.verificationStatus]}22`,
                    color: STATUS_COLORS[item.verificationStatus],
                  }}
                >
                  {item.verificationStatus}
                </Badge>
                <div className="mt-1 text-base font-semibold">{item.title}</div>
                <div className="mt-1 text-xs text-text-muted">
                  {item.category?.name ?? 'Sem categoria'} ·{' '}
                  {[item.city, item.state].filter(Boolean).join(' · ') ||
                    'Localização pendente'}
                  {item.lastCheckedAt
                    ? ` · verificado ${formatRelativeTime(item.lastCheckedAt)}`
                    : ''}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-text-dim">Lance mínimo</div>
                <div className="text-sm font-bold text-accent">
                  {formatCurrency(item.minimumBid)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
