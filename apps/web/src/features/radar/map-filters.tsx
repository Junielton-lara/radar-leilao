import {
  BRAZILIAN_STATES,
  AuctionType,
  STATE_NAMES,
  VerificationStatus,
} from '@lancex/shared';
import { Filter, RotateCcw, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  ORGANIZER_TYPES,
  REGIONS,
  countActiveFilters,
  type RadarFiltersState,
} from './filter-types';
import { SavedFiltersPanel } from './saved-filters';

export interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

const STATUS_OPTIONS = Object.values(VerificationStatus);
const TYPE_OPTIONS = Object.values(AuctionType);

interface MapFiltersPanelProps {
  open: boolean;
  onClose: () => void;
  filters: RadarFiltersState;
  onChange: (next: RadarFiltersState) => void;
  categories: CategoryOption[];
  variant?: 'drawer' | 'panel';
}

export function MapFiltersPanel({
  open,
  onClose,
  filters,
  onChange,
  categories,
  variant = 'drawer',
}: MapFiltersPanelProps) {
  const active = countActiveFilters(filters);

  const patch = (partial: Partial<RadarFiltersState>) =>
    onChange({ ...filters, ...partial });

  const toggleInArray = <T extends string>(
    key: keyof RadarFiltersState,
    value: T,
  ) => {
    const current = filters[key] as T[];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    patch({ [key]: next } as Partial<RadarFiltersState>);
  };

  if (!open) return null;

  const body = (
    <div className="flex h-full min-h-0 flex-col" data-testid="radar-filters">
      <div className="flex items-center justify-between gap-2 border-b border-border-subtle px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Filter className="h-4 w-4 text-brand" />
          Filtros avançados
          {active > 0 ? (
            <span className="rounded-full bg-brand px-1.5 text-[10px] text-white">
              {active}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              onChange({
                states: [],
                city: '',
                region: '',
                categoryIds: [],
                auctionType: '',
                statuses: [],
                minValue: '',
                maxValue: '',
                startDateFrom: '',
                startDateTo: '',
                endDateFrom: '',
                endDateTo: '',
                organizerType: '',
                q: '',
              })
            }
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Limpar
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Fechar filtros"
            onClick={onClose}
            data-testid="radar-filters-close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-auto px-4 py-4">
        <Field label="Busca">
          <Input
            value={filters.q}
            onChange={(e) => patch({ q: e.target.value })}
            placeholder="Título, cidade..."
            data-testid="filter-q"
          />
        </Field>

        <Field label="Região">
          <select
            className={selectClass}
            value={filters.region}
            onChange={(e) => patch({ region: e.target.value })}
            data-testid="filter-region"
          >
            <option value="">Todas</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </Field>

        <Field label="UF">
          <div className="grid max-h-36 grid-cols-4 gap-1 overflow-auto pr-1">
            {BRAZILIAN_STATES.map((uf) => {
              const checked = filters.states.includes(uf);
              return (
                <button
                  key={uf}
                  type="button"
                  title={STATE_NAMES[uf]}
                  onClick={() => toggleInArray('states', uf)}
                  className={cn(
                    'rounded-lg border px-1.5 py-1 text-[10px] font-semibold transition',
                    checked
                      ? 'border-brand bg-brand/20 text-brand'
                      : 'border-border text-text-muted hover:bg-white/5',
                  )}
                  data-testid={`filter-uf-${uf}`}
                >
                  {uf}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Município">
          <Input
            value={filters.city}
            onChange={(e) => patch({ city: e.target.value })}
            placeholder="Ex.: São Paulo"
            data-testid="filter-city"
          />
        </Field>

        <Field label="Categorias">
          <div className="max-h-40 space-y-1 overflow-auto pr-1">
            {categories.length === 0 ? (
              <p className="text-[11px] text-text-dim">
                Categorias serão carregadas do banco.
              </p>
            ) : (
              categories.map((cat) => {
                const checked = filters.categoryIds.includes(cat.id);
                return (
                  <label
                    key={cat.id}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 text-[11px] text-text-muted hover:bg-white/5"
                  >
                    <input
                      type="checkbox"
                      className="accent-brand"
                      checked={checked}
                      onChange={() => toggleInArray('categoryIds', cat.id)}
                      data-testid={`filter-category-${cat.slug}`}
                    />
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: cat.color ?? '#38bdf8' }}
                    />
                    <span className="truncate">{cat.name}</span>
                  </label>
                );
              })
            )}
          </div>
        </Field>

        <Field label="Tipo de leilão">
          <select
            className={selectClass}
            value={filters.auctionType}
            onChange={(e) =>
              patch({
                auctionType: e.target.value as RadarFiltersState['auctionType'],
              })
            }
            data-testid="filter-type"
          >
            <option value="">Todos</option>
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Status">
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map((status) => {
              const checked = filters.statuses.includes(status);
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => toggleInArray('statuses', status)}
                  className={cn(
                    'rounded-lg border px-2 py-1 text-[10px] font-medium transition',
                    checked
                      ? 'border-brand bg-brand/20 text-brand'
                      : 'border-border text-text-muted hover:bg-white/5',
                  )}
                  data-testid={`filter-status-${status}`}
                >
                  {status.replaceAll('_', ' ')}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Faixa de valor (lance mín.)">
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              min={0}
              placeholder="Mín."
              value={filters.minValue}
              onChange={(e) => patch({ minValue: e.target.value })}
              data-testid="filter-min-value"
            />
            <Input
              type="number"
              min={0}
              placeholder="Máx."
              value={filters.maxValue}
              onChange={(e) => patch({ maxValue: e.target.value })}
              data-testid="filter-max-value"
            />
          </div>
        </Field>

        <Field label="Início">
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              value={filters.startDateFrom}
              onChange={(e) => patch({ startDateFrom: e.target.value })}
              data-testid="filter-start-from"
            />
            <Input
              type="date"
              value={filters.startDateTo}
              onChange={(e) => patch({ startDateTo: e.target.value })}
              data-testid="filter-start-to"
            />
          </div>
        </Field>

        <Field label="Encerramento">
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              value={filters.endDateFrom}
              onChange={(e) => patch({ endDateFrom: e.target.value })}
              data-testid="filter-end-from"
            />
            <Input
              type="date"
              value={filters.endDateTo}
              onChange={(e) => patch({ endDateTo: e.target.value })}
              data-testid="filter-end-to"
            />
          </div>
        </Field>

        <Field label="Tipo de organizador">
          <select
            className={selectClass}
            value={filters.organizerType}
            onChange={(e) => patch({ organizerType: e.target.value })}
            data-testid="filter-organizer-type"
          >
            {ORGANIZER_TYPES.map((o) => (
              <option key={o.value || 'all'} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <div className="rounded-2xl border border-border-subtle bg-bg-panel/50 p-3">
          <SavedFiltersPanel current={filters} onApply={onChange} />
        </div>
      </div>
    </div>
  );

  if (variant === 'panel') {
    return (
      <aside className="flex h-full min-h-[420px] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-bg-card/95 shadow-xl backdrop-blur">
        {body}
      </aside>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/50 backdrop-blur-sm md:bg-black/40">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Fechar overlay"
        onClick={onClose}
      />
      <aside className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-border bg-bg-elevated shadow-2xl">
        {body}
      </aside>
    </div>
  );
}

/** Compact category chips overlay kept for map-corner quick filter */
export function MapFilters({
  categories,
  selected,
  onToggle,
}: {
  categories: CategoryOption[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <div
      className="pointer-events-auto absolute left-3 top-3 z-10 hidden w-[210px] rounded-2xl border border-border bg-bg-card/95 p-3 shadow-xl shadow-black/40 backdrop-blur lg:block"
      data-testid="radar-quick-filters"
    >
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-text">
        <Filter className="h-3.5 w-3.5 text-brand" />
        Categorias no mapa
      </div>
      <div className="max-h-40 space-y-1.5 overflow-auto pr-1">
        {categories.length === 0 ? (
          <p className="text-[11px] text-text-dim">
            Categorias serão carregadas do banco.
          </p>
        ) : (
          categories.map((cat) => {
            const checked =
              selected.size === 0 || selected.has(cat.id);
            return (
              <label
                key={cat.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 text-[11px] text-text-muted hover:bg-white/5"
              >
                <input
                  type="checkbox"
                  className="accent-brand"
                  checked={checked}
                  onChange={() => onToggle(cat.id)}
                />
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: cat.color ?? '#38bdf8' }}
                />
                <span className="truncate">{cat.name}</span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-medium text-text-muted">{label}</div>
      {children}
    </div>
  );
}

const selectClass =
  'flex h-10 w-full rounded-xl border border-border bg-bg-elevated px-3 py-2 text-sm text-text outline-none transition focus:border-accent/50 focus:ring-2 focus:ring-accent/20';
