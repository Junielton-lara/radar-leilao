import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { HeartOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { STATUS_COLORS } from '@/features/radar/category-meta';
import { apiRequest } from '@/lib/api';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';

interface FavoriteRow {
  id: string;
  createdAt: string;
  auction: {
    id: string;
    title: string;
    state?: string | null;
    city?: string | null;
    minimumBid?: string | number | null;
    endDate?: string | null;
    verificationStatus: string;
    category?: { name: string } | null;
  };
}

export function FavoritesPage() {
  const queryClient = useQueryClient();
  const listQuery = useQuery({
    queryKey: ['favorites'],
    queryFn: () => apiRequest<FavoriteRow[]>('/favorites'),
  });

  const removeMutation = useMutation({
    mutationFn: (auctionId: string) =>
      apiRequest(`/favorites/${auctionId}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-4" data-testid="favorites-page">
      <div>
        <h1 className="font-display text-2xl font-bold">Favoritos</h1>
        <p className="mt-1 text-sm text-text-muted">
          Oportunidades que você marcou para acompanhar.
        </p>
      </div>

      {listQuery.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-20" />
          ))}
        </div>
      ) : (listQuery.data?.length ?? 0) === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
          <p className="text-sm font-medium">Nenhum favorito ainda</p>
          <p className="mt-2 text-xs text-text-dim">
            Abra uma oportunidade e use “Favoritar”, ou explore o{' '}
            <Link to="/oportunidades" className="text-brand underline">
              mapa de leilões
            </Link>
            .
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {listQuery.data?.map((row) => (
            <li
              key={row.id}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <Link to={`/oportunidades/${row.auction.id}`} className="min-w-0">
                <Badge
                  style={{
                    background: `${STATUS_COLORS[row.auction.verificationStatus] ?? '#888'}22`,
                    color: STATUS_COLORS[row.auction.verificationStatus] ?? '#888',
                  }}
                >
                  {row.auction.verificationStatus}
                </Badge>
                <div className="mt-1 truncate text-sm font-semibold">
                  {row.auction.title}
                </div>
                <div className="mt-1 text-[11px] text-text-dim">
                  {[row.auction.city, row.auction.state]
                    .filter(Boolean)
                    .join(' · ') || 'Local pendente'}
                  {row.auction.minimumBid != null
                    ? ` · ${formatCurrency(row.auction.minimumBid)}`
                    : ''}
                  {` · salvo ${formatRelativeTime(row.createdAt)}`}
                </div>
              </Link>
              <Button
                size="sm"
                variant="secondary"
                disabled={removeMutation.isPending}
                onClick={() => removeMutation.mutate(row.auction.id)}
              >
                <HeartOff className="h-3.5 w-3.5" />
                Remover
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
