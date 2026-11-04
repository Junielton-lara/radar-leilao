import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Filter, X } from 'lucide-react';
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
import { useDebounce } from '@/hooks/use-debounce';
import { apiRequest } from '@/lib/api';
import {
  countdown,
  formatCurrency,
} from '@/lib/utils';

interface RadarIndicatorsResponse {
  totalOpportunities: number;
  byCategory: Array<{ slug: string; name: string; count: number }>;
  byRegion: Array<{ region: string; count: number }>;
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
  const [kpiCategorySlug, setKpiCategorySlug] = useState<string | null>(null);
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

  const applyCategorySlugFilter = useCallback(
    (slug: string | null) => {
      setKpiCategorySlug(slug);
      if (!categoriesQuery.data?.length) return;
      if (!slug) {
        const focusIds = categoriesQuery.data
          .filter((c) =>
            (AUTO_FOCUS_CATEGORY_SLUGS as readonly string[]).includes(c.slug),
          )
          .map((c) => c.id);
        setFilters((prev) => ({ ...prev, categoryIds: focusIds }));
        return;
      }
      const hit = categoriesQuery.data.find((c) => c.slug === slug);
      setFilters((prev) => ({
        ...prev,
        categoryIds: hit ? [hit.id] : [],
      }));
    },
    [categoriesQuery.data],
  );

  useEffect(() => {
    if (appliedAutoFocusRef.current || !categoriesQuery.data?.length) return;
    applyCategorySlugFilter(null);
    appliedAutoFocusRef.current = true;
  }, [categoriesQuery.data, applyCategorySlugFilter]);

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
    <div className="flex min-h-0 flex-col gap-3" data-testid="radar-page">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-display text-lg font-extrabold text-text">
            Mapa de leilões veiculares
          </h1>
          <p className="text-xs text-text-muted">
            Editais e oportunidades no Brasil · clique nos números para filtrar
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setFiltersOpen(true)}
          data-testid="radar-filters-open"
        >
          <Filter className="h-3.5 w-3.5" />
          Filtros
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
        activeCategorySlug={kpiCategorySlug}
        onCategoryClick={applyCategorySlugFilter}
      />

      {indicatorsQuery.data?.coverageNote ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {indicatorsQuery.data.coverageNote}
        </div>
      ) : null}

      <div className="relative min-h-[min(72vh,640px)] flex-1">
        <BrazilMap
          ref={mapRef}
          markers={markersQuery.data ?? []}
          selectedId={selectedMarker?.id ?? null}
          onBoundsChange={onBoundsChange}
          onSelect={setSelectedMarker}
        />
        <MapFloatingFilters
          filters={filters}
          onChange={setFilters}
          categories={categoriesQuery.data ?? []}
        />
        {selectedMarker ? (
          <div className="absolute bottom-3 right-3 z-10 w-[min(100%,340px)]">
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
              Nenhum leilão nesta área — afaste o zoom ou ajuste os filtros.
            </div>
          </div>
        ) : null}
      </div>

      {(endingQuery.data?.length ?? 0) > 0 ? (
        <section className="card-soft p-3">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs font-bold text-text">
              Próximos encerramentos
            </h2>
            <Link
              to="/calendario"
              className="text-[11px] font-semibold text-brand hover:underline"
            >
              Agenda
            </Link>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(endingQuery.data ?? []).slice(0, 6).map((item) => (
              <AuctionMiniCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ) : null}

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

function AuctionMiniCard({ item }: { item: AuctionSummary }) {
  const slug = resolveDisplayCategorySlug(item.category?.slug, item.title);
  const color = getCategoryColorForItem(slug, item.title);
  const Icon = getCategoryIcon(slug);
  return (
    <Link
      to={`/oportunidades/${item.id}`}
      className="card-soft block w-48 shrink-0 p-2.5 transition hover:border-brand/30"
    >
      <div className="mb-1 flex items-center gap-2">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ background: `${color}22`, color }}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="line-clamp-2 text-[11px] font-bold">{item.title}</span>
      </div>
      <div className="text-sm font-extrabold text-brand">
        {formatCurrency(item.minimumBid)}
      </div>
      <div className="mt-0.5 text-[10px] font-bold text-danger">
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
    <div className="card-soft max-h-[min(70vh,480px)] overflow-y-auto p-3 shadow-lg">
      <div className="flex items-start gap-2">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: `${color}22`, color }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1">
            <span
              className="rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase"
              style={{ background: `${color}22`, color }}
            >
              {marker.categoryName ?? slug}
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
                Desmanche
              </span>
            ) : null}
          </div>
          <div className="mt-1 line-clamp-2 text-sm font-bold leading-snug">
            {marker.title}
          </div>
          <div className="mt-0.5 text-[11px] text-text-muted">
            {[marker.city, marker.state].filter(Boolean).join(' · ') ||
              'Local (UF)'}
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

      <div className="mt-2 grid grid-cols-2 gap-1.5 text-xs">
        <InfoChip label="Lance mín." value={formatCurrency(marker.minimumBid)} />
        <InfoChip
          label="Encerramento"
          value={countdown(marker.endDate) ?? 'Sem data'}
        />
        <InfoChip
          label="Tipo"
          value={labelAuctionType(marker.auctionType ?? detail?.auctionType)}
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

      <div className="mt-2 flex flex-wrap gap-2">
        <Link
          to={`/oportunidades/${marker.id}`}
          className="inline-flex rounded-xl bg-brand px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-soft"
        >
          Ver edital
        </Link>
        {(marker.originalUrl || detail?.originalUrl) && (
          <a
            href={marker.originalUrl ?? detail?.originalUrl ?? '#'}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-1.5 text-xs font-bold text-text hover:bg-slate-50"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Site oficial
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
    <div className="rounded-lg bg-slate-50 px-2 py-1">
      <div className="text-[9px] font-semibold uppercase text-text-dim">
        {label}
      </div>
      <div className="mt-0.5 font-bold text-text">{value}</div>
    </div>
  );
}
