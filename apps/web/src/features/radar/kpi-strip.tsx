import type { LucideIcon } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import {
  Gavel,
  KPI_CATEGORY_ORDER,
  VEHICLE_FOCUS_LABELS,
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
  slug?: string;
}

export function KpiStrip({
  data,
  loading,
  activeCategorySlug,
  onCategoryClick,
}: {
  data?: Indicators;
  loading?: boolean;
  activeCategorySlug?: string | null;
  onCategoryClick?: (slug: string | null) => void;
}) {
  const bySlug = new Map(
    (data?.byCategory ?? []).map((c) => [c.slug, c] as const),
  );

  const categoryCards: KpiCard[] = KPI_CATEGORY_ORDER.map((slug) => {
    const hit = bySlug.get(slug);
    return {
      key: slug,
      slug,
      label: hit?.name ?? VEHICLE_FOCUS_LABELS[slug],
      value: hit?.count ?? 0,
      tone: kpiIconTone(slug),
      icon: getCategoryIcon(slug),
    };
  });

  const vehicleTotal = categoryCards.reduce((acc, c) => acc + c.value, 0);

  const cards: KpiCard[] = [
    {
      key: 'total',
      label: 'Leilões veículos',
      value: vehicleTotal || data?.totalOpportunities || 0,
      tone: 'bg-red-100 text-[#E31B23]',
      icon: Gavel,
    },
    ...categoryCards,
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {loading
        ? Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="skeleton h-[76px]" />
          ))
        : cards.map((card, idx) => {
            const Icon = card.icon;
            const isActive =
              card.key === 'total'
                ? !activeCategorySlug
                : activeCategorySlug === card.slug;
            const clickable = Boolean(onCategoryClick);
            return (
              <button
                key={card.key}
                type="button"
                disabled={!clickable}
                onClick={() => {
                  if (!onCategoryClick) return;
                  if (card.key === 'total') onCategoryClick(null);
                  else if (card.slug) onCategoryClick(card.slug);
                }}
                className={`card-soft animate-fade-up flex items-center gap-3 p-3 text-left transition ${
                  clickable ? 'cursor-pointer hover:border-brand/40' : ''
                } ${isActive && clickable ? 'ring-2 ring-brand/30' : ''}`}
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${card.tone}`}
                >
                  <Icon className="h-5 w-5" strokeWidth={2.25} />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[11px] font-semibold text-text-muted">
                    {card.label}
                  </div>
                  <div className="font-display text-xl font-extrabold leading-tight text-text">
                    {formatNumber(card.value)}
                  </div>
                </div>
              </button>
            );
          })}
    </div>
  );
}
