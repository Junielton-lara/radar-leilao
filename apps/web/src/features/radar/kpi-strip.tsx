import type { LucideIcon } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import {
  Gavel,
  KPI_CATEGORY_ORDER,
  getCategoryIcon,
  kpiIconTone,
} from './category-meta';

interface Indicators {
  totalOpportunities: number;
  byCategory: Array<{ slug: string; name: string; count: number }>;
}

interface KpiCard {
  key: string;
  label: string;
  value: number;
  tone: string;
  icon: LucideIcon;
}

export function KpiStrip({
  data,
  loading,
}: {
  data?: Indicators;
  loading?: boolean;
}) {
  const bySlug = new Map(
    (data?.byCategory ?? []).map((c) => [c.slug, c] as const),
  );

  const categoryCards: KpiCard[] = KPI_CATEGORY_ORDER.map((slug) => {
    const hit = bySlug.get(slug);
    return {
      key: slug,
      label:
        slug === 'pecas-desmanche'
          ? 'Peças / desmanche'
          : slug === 'ferroviarios'
            ? 'Ferroviário'
            : (hit?.name ?? slug),
      value: hit?.count ?? 0,
      tone: kpiIconTone(slug),
      icon: getCategoryIcon(slug),
    };
  });

  const cards: KpiCard[] = [
    {
      key: 'total',
      label: 'Leilões ativos',
      value: data?.totalOpportunities ?? 0,
      tone: 'bg-red-100 text-[#E31B23]',
      icon: Gavel,
    },
    ...categoryCards.slice(0, 5),
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {loading
        ? Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="skeleton h-[88px]" />
          ))
        : cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={card.key}
                className="card-soft animate-fade-up flex items-center gap-3 p-4"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${card.tone}`}
                >
                  <Icon className="h-5 w-5" strokeWidth={2.25} />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold text-text-muted">
                    {card.label}
                  </div>
                  <div className="font-display text-2xl font-extrabold leading-tight text-text">
                    {formatNumber(card.value)}
                  </div>
                </div>
              </div>
            );
          })}
    </div>
  );
}
