import type { CategoryOption } from './map-filters';
import type { RadarFiltersState } from './filter-types';
import {
  AUTO_FOCUS_CATEGORY_SLUGS,
  getCategoryIcon,
  getMapPinColor,
  sortCategoriesForFocus,
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
  const picked = new Set(filters.categoryIds);

  const syncCategories = (ids: string[]) => {
    const slugById = new Map(categories.map((c) => [c.id, c.slug]));
    const slugs = ids
      .map((id) => slugById.get(id))
      .filter((s): s is string => Boolean(s));
    onChange({ ...filters, categoryIds: ids, categorySlugs: slugs });
  };

  const toggle = (id: string) => {
    const allIds = categories.map((c) => c.id);
    let next: string[];
    if (picked.size === 0) {
      next = allIds.filter((x) => x !== id);
    } else if (picked.has(id)) {
      next = Array.from(picked).filter((x) => x !== id);
    } else {
      next = [...picked, id];
      if (next.length >= allIds.length) next = [];
    }
    syncCategories(next);
  };

  const visible = sortCategoriesForFocus(categories).filter((c) =>
    (AUTO_FOCUS_CATEGORY_SLUGS as readonly string[]).includes(c.slug),
  );

  return (
    <div
      className="card-soft pointer-events-auto absolute left-3 top-3 z-10 max-h-[min(70vh,420px)] w-[min(100%,240px)] overflow-y-auto p-3"
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
          const checked =
            picked.size === 0 || picked.has(cat.id);
          return (
            <li key={cat.id}>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 hover:bg-slate-50">
                <input
                  type="checkbox"
                  className="accent-[#E31B23]"
                  checked={checked}
                  onChange={() => toggle(cat.id)}
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
