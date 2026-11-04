import type { CategoryOption } from './map-filters';
import type { RadarFiltersState } from './filter-types';
import {
  AUTO_FOCUS_CATEGORY_SLUGS,
  buildVehicleFocusFilterRows,
  getCategoryIcon,
  getMapPinColor,
} from './category-meta';

export function MapFloatingFilters({
  filters,
  onChange,
  categories,
}: {
  filters: RadarFiltersState;
  onChange: (next: RadarFiltersState) => void;
  categories: CategoryOption[];
}) {
  const slugById = new Map(categories.map((c) => [c.id, c.slug]));
  const idBySlug = new Map(categories.map((c) => [c.slug, c.id]));

  const pickedSlugs = new Set(
    filters.categorySlugs.length
      ? filters.categorySlugs
      : filters.categoryIds
          .map((id) => slugById.get(id))
          .filter((s): s is string => Boolean(s)),
  );

  const syncSlugs = (slugs: string[]) => {
    const ids = slugs
      .map((slug) => idBySlug.get(slug))
      .filter((id): id is string => Boolean(id));
    onChange({ ...filters, categorySlugs: slugs, categoryIds: ids });
  };

  const toggle = (slug: string) => {
    const allSlugs = AUTO_FOCUS_CATEGORY_SLUGS as readonly string[];
    let next: string[];
    if (pickedSlugs.size === 0) {
      next = allSlugs.filter((s) => s !== slug);
    } else if (pickedSlugs.has(slug)) {
      next = Array.from(pickedSlugs).filter((s) => s !== slug);
    } else {
      next = [...pickedSlugs, slug];
      if (next.length >= allSlugs.length) next = [];
    }
    syncSlugs(next);
  };

  const visible = buildVehicleFocusFilterRows(categories);

  return (
    <div
      className="card-soft pointer-events-auto absolute left-3 top-3 z-30 max-h-[min(70vh,420px)] w-[min(calc(100%-1.5rem),260px)] overflow-y-auto border-white/80 bg-white/95 p-3 shadow-lg backdrop-blur-sm"
      data-testid="map-floating-filters"
    >
      <div className="text-xs font-bold text-text">Filtrar no mapa</div>
      <p className="mt-0.5 text-[10px] leading-snug text-text-muted">
        Carros, motos, caminhões, sucatas e peças
      </p>
      <ul className="mt-2 space-y-1.5">
        {visible.map((cat) => {
          const Icon = getCategoryIcon(cat.slug);
          const color = getMapPinColor(cat.slug);
          const checked = pickedSlugs.size === 0 || pickedSlugs.has(cat.slug);
          return (
            <li key={cat.slug}>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 hover:bg-slate-50">
                <input
                  type="checkbox"
                  className="accent-[#E31B23]"
                  checked={checked}
                  onChange={() => toggle(cat.slug)}
                />
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{ background: `${color}22`, color }}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-xs font-medium text-text-muted">
                  {cat.name}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
