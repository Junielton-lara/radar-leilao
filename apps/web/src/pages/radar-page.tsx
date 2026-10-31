import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock3, ExternalLink, Filter, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { AuctionDetail, AuctionMarker, AuctionSummary } from '@lancex/shared';
import { Button } from '@/components/ui/button';
import { BrazilMap, type BrazilMapHandle } from '@/features/radar/brazil-map';
import {
  EMPTY_RADAR_FILTERS,
  buildBboxQueryParams,
  countActiveFilters,
  type RadarFiltersState,
} from '@/features/radar/filter-types';
import { IntelligenceBriefingPanel } from '@/features/radar/intelligence-briefing-panel';
import { KpiStrip } from '@/features/radar/kpi-strip';
import { MapFloatingFilters } from '@/features/radar/map-floating-filters';
import {
  MapFiltersPanel,
  type CategoryOption,
} from '@/features/radar/map-filters';
import {
  AUTO_FOCUS_CATEGORY_SLUGS,
  STATUS_COLORS,
  getCategoryColorForItem,
  getCategoryIcon,
  isAutoDesmancheFocus,
  resolveDisplayCategorySlug,
} from '@/features/radar/category-meta';
import {
  labelAuctionType,
  labelVerification,
} from '@/lib/auction-labels';
import { RegionBadges } from '@/features/radar/region-badges';
import { useDebounce } from '@/hooks/use-debounce';
import { apiRequest } from '@/lib/api';
import {
  countdown,
  formatCurrency,
  formatRelativeTime,
} from '@/lib/utils';

interface RadarIndicatorsResponse {
  totalOpportunities: number;
  byCategory: Array<{ slug: string; name: string; count: number }>;
  byRegion: Array<{ region: string; count: number }>;
  recentUpdates: Array<{
    id: string;
    eventType: string;
    reason: string | null;
    createdAt: string;
    auction: { id: string; title: string; state: string | null };
  }>;
  coverageNote: string | null;
  lastCoverageAt: string | null;
}

export function RadarPage() {
  const [bbox, setBbox] = useState<{
    minLng: number;
    minLat: number;
    maxLng: number;
    maxLat: number;
    zoom: number;
  } | null>(null);
  const [filters, setFilters] = useState<RadarFiltersState>(EMPTY_RADAR_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<AuctionMarker | null>(
    null,
  );
  const mapRef = useRef<BrazilMapHandle>(null);
  const appliedAutoFocusRef = useRef(false);

  const debouncedFilters = useDebounce(filters, 350);
  const activeFilterCount = countActiveFilters(filters);

  const indicatorsQuery = useQuery({
    queryKey: ['radar-indicators'],
    queryFn: () => apiRequest<RadarIndicatorsResponse>('/radar/indicators'),
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiRequest<CategoryOption[]>('/categories'),
  });

  useEffect(() => {
    if (appliedAutoFocusRef.current || !categoriesQuery.data?.length) return;
    const focusIds = categoriesQuery.data
      .filter((c) =>
        (AUTO_FOCUS_CATEGORY_SLUGS as readonly string[]).includes(c.slug),
      )
      .map((c) => c.id);
    if (focusIds.length === 0) return;
    setFilters((prev) => ({ ...prev, categoryIds: focusIds }));
    appliedAutoFocusRef.current = true;
  }, [categoriesQuery.data]);

  const featuredQuery = useQuery({
    queryKey: ['auctions-featured'],
    queryFn: () => apiRequest<AuctionSummary[]>('/auctions/featured'),
  });

  const endingQuery = useQuery({
    queryKey: ['auctions-ending'],
    queryFn: () => apiRequest<AuctionSummary[]>('/auctions/ending-soon'),
  });

  const markersQuery = useQuery({
    queryKey: ['auctions-bbox', bbox, debouncedFilters],
    enabled: Boolean(bbox),
    queryFn: () => {
      if (!bbox) return Promise.resolve([] as AuctionMarker[]);
      const params = buildBboxQueryParams(bbox, debouncedFilters);
      return apiRequest<AuctionMarker[]>(`/auctions/geo/bbox?${params}`);
    },
  });

  const onBoundsChange = useCallback(
    (next: {
      minLng: number;
      minLat: number;
      maxLng: number;
      maxLat: number;
      zoom: number;
    }) => {
      setBbox(next);
    },
    [],
  );

  return (
    <div className="flex min-h-0 flex-col gap-4" data-testid="radar-page">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-text-muted">
          Mapa do Brasil · cores LanceX Intelligence por tipo de oportunidade
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setFiltersOpen(true)}
          data-testid="radar-filters-open"
        >
          <Filter className="h-3.5 w-3.5" />
          Mais filtros
          {activeFilterCount > 0 ? (
            <span className="rounded-full bg-brand px-1.5 text-[10px] text-white">
              {activeFilterCount}
            </span>
          ) : null}
        </Button>
      </div>

      <KpiStrip
        data={indicatorsQuery.data}
        loading={indicatorsQuery.isLoading}
      />

      <IntelligenceBriefingPanel />

      {indicatorsQuery.data?.coverageNote ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {indicatorsQuery.data.coverageNote}
        </div>
      ) : null}

      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-h-0 flex-col gap-4">
          <div className="relative min-h-[480px] flex-1">
            <BrazilMap
              ref={mapRef}
              markers={markersQuery.data ?? []}
              selectedId={selectedMarker?.id ?? null}
              onBoundsChange={onBoundsChange}
              onSelect={setSelectedMarker}
            />
            <RegionBadges regions={indicatorsQuery.data?.byRegion ?? []} />
            <MapFloatingFilters
              filters={filters}
              onChange={setFilters}
              categories={categoriesQuery.data ?? []}
            />
            {selectedMarker ? (
              <div className="absolute bottom-14 right-3 z-10 w-[min(100%,360px)] md:bottom-3">
                <MarkerSummary
                  marker={selectedMarker}
                  onClose={() => setSelectedMarker(null)}
                />
              </div>
            ) : null}
            {(markersQuery.data?.length ?? 0) === 0 &&
            !markersQuery.isLoading &&
            bbox ? (
              <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4">
                <div className="rounded-full border border-border bg-white/95 px-4 py-2 text-xs text-text-muted shadow-md">
                  Nenhum leilão nesta área com os filtros atuais — afaste o
                  zoom, ajuste categorias ou use Admin → Coletas.
                </div>
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="card-soft p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold text-text">
                  Próximos encerramentos
                </h2>
                <Link
                  to="/calendario"
                  className="text-xs font-semibold text-brand hover:underline"
                >
                  Ver todos
                </Link>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {endingQuery.isLoading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="skeleton h-24 w-48 shrink-0" />
                    ))
                  : (endingQuery.data ?? []).length === 0
                    ? (
                        <p className="text-xs text-text-muted">
                          Sem datas de encerramento ainda — veja o calendário.
                        </p>
                      )
                    : (endingQuery.data ?? []).map((item) => (
                        <AuctionMiniCard key={item.id} item={item} />
                      ))}
              </div>
            </section>

            <section className="card-soft p-4">
              <h2 className="mb-3 text-sm font-bold text-text">
                Últimas atualizações
              </h2>
              <div className="max-h-40 space-y-2 overflow-y-auto">
                {(indicatorsQuery.data?.recentUpdates ?? []).length === 0 ? (
                  <p className="text-xs text-text-muted">
                    Eventos aparecem após coletas.
                  </p>
                ) : (
                  (indicatorsQuery.data?.recentUpdates ?? []).map((u) => (
                    <div
                      key={u.id}
                      className="rounded-xl bg-slate-50 px-3 py-2 text-xs"
                    >
                      <div className="font-semibold text-text">
                        {u.reason ?? u.eventType}
                      </div>
                      <div className="mt-0.5 text-text-muted">
                        {u.auction.title}
                        {u.auction.state ? ` · ${u.auction.state}` : ''} ·{' '}
                        {formatRelativeTime(u.createdAt)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <section className="card-soft p-4">
            <h2 className="mb-3 text-sm font-bold text-text">
              Leilões em destaque
            </h2>
            <div className="space-y-3">
              {featuredQuery.isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="skeleton h-24" />
                  ))
                : (featuredQuery.data ?? []).length === 0
                  ? (
                      <p className="py-4 text-center text-xs text-text-muted">
                        Colete oportunidades para ver destaques aqui.
                      </p>
                    )
                  : (featuredQuery.data ?? []).map((item) => (
                      <FeaturedCard key={item.id} item={item} />
                    ))}
            </div>
          </section>
        </aside>
      </div>

      <MapFiltersPanel
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onChange={setFilters}
        categories={categoriesQuery.data ?? []}
      />
    </div>
  );
}

function FeaturedCard({ item }: { item: AuctionSummary }) {
  const slug = resolveDisplayCategorySlug(item.category?.slug, item.title);
  const Icon = getCategoryIcon(slug);
  const color = getCategoryColorForItem(slug, item.title);
  return (
    <Link
      to={`/oportunidades/${item.id}`}
      className="flex gap-3 rounded-2xl border border-border bg-slate-50/80 p-3 transition hover:border-brand/40 hover:bg-white"
    >
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `${color}22`, color }}
      >
        <Icon className="h-7 w-7" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <span
          className="inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase"
          style={{ background: `${color}22`, color }}
        >
          {item.category?.name ?? 'Leilão'}
        </span>
        <div className="mt-1 line-clamp-2 text-sm font-bold leading-snug">
          {item.title}
        </div>
        <div className="mt-1 text-[11px] text-text-muted">
          {[item.city, item.state].filter(Boolean).join(' · ') || 'Brasil'}
          {item.organizer?.name ? ` · ${item.organizer.name}` : ''}
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-sm font-extrabold text-brand">
              {formatCurrency(item.minimumBid)}
            </span>
            {item.appraisalValue ? (
              <span className="ml-2 text-[10px] text-text-muted">
                aval. {formatCurrency(item.appraisalValue)}
              </span>
            ) : null}
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-text-muted">
            <Clock3 className="h-3 w-3" />
            {countdown(item.endDate) ?? 'sem prazo'}
          </span>
        </div>
      </div>
    </Link>
  );
}

function AuctionMiniCard({ item }: { item: AuctionSummary }) {
  const slug = resolveDisplayCategorySlug(item.category?.slug, item.title);
  const color = getCategoryColorForItem(slug, item.title);
  const Icon = getCategoryIcon(slug);
  return (
    <Link
      to={`/oportunidades/${item.id}`}
      className="card-soft block w-52 shrink-0 p-3 transition hover:border-brand/30"
    >
      <div className="mb-2 flex items-center gap-2">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: `${color}22`, color }}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="line-clamp-2 text-xs font-bold">{item.title}</span>
      </div>
      <div className="text-[10px] text-text-muted">
        {labelAuctionType(item.auctionType)}
        {item.organizer?.name ? ` · ${item.organizer.name}` : ''}
      </div>
      <div className="mt-2 text-sm font-extrabold text-brand">
        {formatCurrency(item.minimumBid)}
      </div>
      <div className="mt-1 text-[10px] font-bold text-danger">
        {countdown(item.endDate) ?? 'Sem data'}
      </div>
    </Link>
  );
}

function MarkerSummary({
  marker,
  onClose,
}: {
  marker: AuctionMarker;
  onClose: () => void;
}) {
  const detailQuery = useQuery({
    queryKey: ['auction-marker-detail', marker.id],
    queryFn: () => apiRequest<AuctionDetail>(`/auctions/${marker.id}`),
  });

  const slug = resolveDisplayCategorySlug(marker.categorySlug, marker.title);
  const Icon = getCategoryIcon(slug);
  const color = getCategoryColorForItem(slug, marker.title);
  const detail = detailQuery.data;
  const statusColor = STATUS_COLORS[marker.verificationStatus] ?? '#64748B';
  const desmanche = isAutoDesmancheFocus(marker.categorySlug, marker.title);

  return (
    <div className="card-soft max-h-[min(70vh,520px)] overflow-y-auto p-4 shadow-lg">
      <div className="flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ background: `${color}22`, color }}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1.5">
            <span
              className="rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase"
              style={{ background: `${color}22`, color }}
            >
              {marker.categoryName ?? 'Leilão'}
            </span>
            <span
              className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
              style={{
                background: `${statusColor}22`,
                color: statusColor,
              }}
            >
              {labelVerification(marker.verificationStatus)}
            </span>
            {desmanche ? (
              <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                Desmanche / peças
              </span>
            ) : null}
          </div>
          <div className="mt-1 line-clamp-3 text-sm font-bold leading-snug">
            {marker.title}
          </div>
          <div className="mt-1 text-xs text-text-muted">
            {[marker.city, marker.state].filter(Boolean).join(' · ') ||
              'Local aproximado (UF)'}
            {marker.approximate ? ' · pin estimado' : ''}
          </div>
        </div>
        <button
          type="button"
          className="rounded-lg p-1 text-text-dim hover:bg-slate-100"
          onClick={onClose}
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <InfoChip label="Lance mín." value={formatCurrency(marker.minimumBid)} />
        <InfoChip
          label="Avaliação"
          value={formatCurrency(marker.appraisalValue ?? detail?.appraisalValue)}
        />
        <InfoChip
          label="Encerramento"
          value={countdown(marker.endDate) ?? 'Sem data'}
        />
        <InfoChip
          label="Tipo"
          value={labelAuctionType(marker.auctionType ?? detail?.auctionType)}
        />
        <InfoChip
          label="Organizador"
          value={marker.organizerName ?? detail?.organizer?.name ?? '—'}
        />
        <InfoChip
          label="Lotes"
          value={
            marker.lotCount != null
              ? String(marker.lotCount)
              : detail?.lots.length
                ? String(detail.lots.length)
                : '—'
          }
        />
      </div>

      {(marker.descriptionSnippet || detail?.description) && (
        <p className="mt-3 line-clamp-4 text-xs leading-relaxed text-text-muted">
          {marker.descriptionSnippet ?? detail?.description}
        </p>
      )}

      {detail?.lots?.length ? (
        <div className="mt-3 rounded-xl bg-slate-50 p-2">
          <div className="text-[10px] font-bold uppercase text-text-dim">
            Lotes ({detail.lots.length})
          </div>
          <ul className="mt-1 space-y-1">
            {detail.lots.slice(0, 3).map((lot) => (
              <li key={lot.id} className="text-[11px] text-text-muted">
                <span className="font-semibold text-text">
                  {lot.lotNumber ? `Lote ${lot.lotNumber}` : 'Lote'}:
                </span>{' '}
                {lot.title}
                {lot.minimumBid
                  ? ` · ${formatCurrency(lot.minimumBid)}`
                  : ''}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          to={`/oportunidades/${marker.id}`}
          className="inline-flex rounded-xl bg-brand px-3 py-2 text-xs font-bold text-white hover:bg-brand-soft"
        >
          Ver ficha completa
        </Link>
        {(marker.originalUrl || detail?.originalUrl) && (
          <a
            href={marker.originalUrl ?? detail?.originalUrl ?? '#'}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-xs font-bold text-text hover:bg-slate-50"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Site do leilão
          </a>
        )}
      </div>
    </div>
  );
}

function InfoChip({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-slate-50 px-2 py-1.5">
      <div className="text-[9px] font-semibold uppercase text-text-dim">
        {label}
      </div>
      <div className="mt-0.5 font-bold text-text">{value}</div>
    </div>
  );
}
