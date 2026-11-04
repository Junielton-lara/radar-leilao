import type { LucideIcon } from 'lucide-react';
import type { VerificationStatus } from '@lancex/shared';
import {
  VEHICLE_FOCUS_CATEGORY_SLUGS,
  inferVehicleCategorySlug,
} from '@lancex/shared';
import {
  Bike,
  Car,
  Gavel,
  Package,
  Recycle,
  TrainFront,
  Truck,
  Wrench,
} from 'lucide-react';

/** Foco LanceX: veículos e desmanche */
export const AUTO_FOCUS_CATEGORY_SLUGS = VEHICLE_FOCUS_CATEGORY_SLUGS;

export const VEHICLE_FOCUS_LABELS: Record<
  (typeof VEHICLE_FOCUS_CATEGORY_SLUGS)[number],
  string
> = {
  veiculos: 'Veículos',
  motocicletas: 'Motocicletas',
  caminhoes: 'Caminhões',
  sucatas: 'Sucatas',
  'pecas-desmanche': 'Peças / desmanche',
};

/** Filtros do mapa — sempre 5 linhas, mesmo se /categories falhar ou estiver desatualizado. */
export function buildVehicleFocusFilterRows<
  T extends { id: string; name: string; slug: string },
>(categories: T[]): T[] {
  const bySlug = new Map(categories.map((c) => [c.slug, c]));
  return VEHICLE_FOCUS_CATEGORY_SLUGS.map((slug) => {
    const hit = bySlug.get(slug);
    if (hit) return hit;
    return {
      id: `slug:${slug}`,
      name: VEHICLE_FOCUS_LABELS[slug],
      slug,
    } as T;
  });
}

/** Legenda oficial LanceX Intelligence (mapa) */
export type MapLegendKey =
  | 'sucata-inservivel'
  | 'sucata-aproveitavel'
  | 'veiculo-conservado'
  | 'imovel'
  | 'maquina'
  | 'mercadoria'
  | 'outros';

export const LANCEX_MAP_COLOR_LEGEND: Array<{
  key: MapLegendKey;
  color: string;
  label: string;
}> = [
  { key: 'sucata-inservivel', color: '#22C55E', label: 'Sucata inservível' },
  {
    key: 'sucata-aproveitavel',
    color: '#3B82F6',
    label: 'Sucata aproveitável / peças',
  },
  {
    key: 'veiculo-conservado',
    color: '#06B6D4',
    label: 'Veículo conservado / circulação',
  },
  { key: 'imovel', color: '#8B5CF6', label: 'Imóveis e terrenos' },
  { key: 'maquina', color: '#EAB308', label: 'Máquinas e equipamentos' },
  { key: 'mercadoria', color: '#F97316', label: 'Mercadorias e estoques' },
  { key: 'outros', color: '#94A3B8', label: 'Outras categorias' },
];

const MAP_COLOR_BY_KEY: Record<MapLegendKey, string> = Object.fromEntries(
  LANCEX_MAP_COLOR_LEGEND.map((e) => [e.key, e.color]),
) as Record<MapLegendKey, string>;

/** @deprecated use getMapPinColor — mantido para KPIs e tags */
export const CATEGORY_COLORS: Record<string, string> = {
  veiculos: MAP_COLOR_BY_KEY['veiculo-conservado'],
  motocicletas: MAP_COLOR_BY_KEY['veiculo-conservado'],
  caminhoes: MAP_COLOR_BY_KEY['veiculo-conservado'],
  'imoveis-residenciais': MAP_COLOR_BY_KEY.imovel,
  'imoveis-comerciais': MAP_COLOR_BY_KEY.imovel,
  terrenos: MAP_COLOR_BY_KEY.imovel,
  maquinas: MAP_COLOR_BY_KEY.maquina,
  equipamentos: MAP_COLOR_BY_KEY.maquina,
  sucatas: MAP_COLOR_BY_KEY['sucata-inservivel'],
  'pecas-desmanche': MAP_COLOR_BY_KEY['sucata-aproveitavel'],
  ferroviarios: MAP_COLOR_BY_KEY.maquina,
  'materiais-diversos': MAP_COLOR_BY_KEY.mercadoria,
};

export const STATUS_COLORS: Record<string, string> = {
  VERIFICADO: '#16A34A',
  EM_ANALISE: '#D97706',
  NAO_CONFIRMADO: '#64748B',
  ALTO_RISCO: '#DC2626',
  SUSPENSO: '#EA580C',
  CANCELADO: '#B91C1C',
  ENCERRADO: '#94A3B8',
};

export const REGION_COLORS: Record<string, string> = {
  Norte: '#22C55E',
  Nordeste: '#EAB308',
  'Centro-Oeste': '#3B82F6',
  Sudeste: '#F472B6',
  Sul: '#A855F7',
};

const ICON_BY_SLUG: Record<string, LucideIcon> = {
  veiculos: Car,
  motocicletas: Bike,
  caminhoes: Truck,
  sucatas: Recycle,
  'pecas-desmanche': Wrench,
  ferroviarios: TrainFront,
  equipamentos: Wrench,
  maquinas: Truck,
  'materiais-diversos': Package,
};

const INSERVIVEL =
  /\b(inserv[ií]vel|sucata inserv|reciclagem|destrui[cç][aã]o|renajud|restri[cç][aã]o judicial.*sucata|ferro-?velho)\b/i;
const APROVEITAVEL =
  /\b(aproveit[aá]vel|pe[cç]as? usadas?|desmontagem|desmanche|motor inserv|lote de pe[cç]as|chassi)\b/i;
const CONSERVADO =
  /\b(conservado|document[aá]vel|circula[cç][aã]o|recuper[aá]vel|crv|crlv)\b/i;
const DESMONTE_ONLY =
  /\b(desmontagem exclusiva|somente desmontagem|exclusivamente desmontagem)\b/i;
const TRAIN_KEYWORDS = /\b(trem|ferrovi|locomotiva|vag[aã]o|metro\b|metrô)\b/i;
const MOTO_KEYWORDS = /\b(moto|motocicleta|scooter\b)\b/i;
const TRUCK_KEYWORDS = /\b(caminh[aã]o|carreta|bitrem|rodotrem|[oô]nibus)\b/i;

export function resolveMapLegendKey(
  slug: string | null | undefined,
  title?: string | null,
): MapLegendKey {
  const s = (slug ?? '').toLowerCase();
  const t = title ?? '';

  if (s.includes('imovel') || s.includes('terreno')) return 'imovel';
  if (s === 'materiais-diversos') return 'mercadoria';
  if (s === 'maquinas' || s === 'equipamentos' || s === 'ferroviarios') {
    return 'maquina';
  }
  if (TRAIN_KEYWORDS.test(t) && !s.includes('veiculo')) return 'maquina';

  if (s === 'pecas-desmanche' || APROVEITAVEL.test(t)) {
    if (INSERVIVEL.test(t) && !APROVEITAVEL.test(t)) {
      return 'sucata-inservivel';
    }
    return 'sucata-aproveitavel';
  }

  if (s === 'sucatas' || /\bsucata\b/i.test(t)) {
    if (INSERVIVEL.test(t) || DESMONTE_ONLY.test(t)) {
      return 'sucata-inservivel';
    }
    if (APROVEITAVEL.test(t)) return 'sucata-aproveitavel';
    return 'sucata-inservivel';
  }

  if (
    s === 'veiculos' ||
    s === 'motocicletas' ||
    s === 'caminhoes' ||
    MOTO_KEYWORDS.test(t) ||
    TRUCK_KEYWORDS.test(t)
  ) {
    if (INSERVIVEL.test(t) || DESMONTE_ONLY.test(t)) {
      return 'sucata-inservivel';
    }
    if (APROVEITAVEL.test(t) && !CONSERVADO.test(t)) {
      return 'sucata-aproveitavel';
    }
    return 'veiculo-conservado';
  }

  if (INSERVIVEL.test(t)) return 'sucata-inservivel';
  if (APROVEITAVEL.test(t)) return 'sucata-aproveitavel';
  if (CONSERVADO.test(t)) return 'veiculo-conservado';

  return 'outros';
}

export function getMapPinColor(
  slug: string | null | undefined,
  title?: string | null,
): string {
  return MAP_COLOR_BY_KEY[resolveMapLegendKey(slug, title)];
}

export function resolveDisplayCategorySlug(
  slug: string | null | undefined,
  title?: string | null,
  description?: string | null,
): string {
  const inferred = inferVehicleCategorySlug(title, description, slug);
  if (inferred) return inferred;
  if (slug && (ICON_BY_SLUG[slug] || CATEGORY_COLORS[slug])) return slug;
  const t = title ?? '';
  if (TRAIN_KEYWORDS.test(t)) return 'ferroviarios';
  if (slug?.includes('sucata')) return 'sucatas';
  if (slug?.includes('veiculo')) return 'veiculos';
  return slug ?? 'veiculos';
}

export function getCategoryIcon(slug: string | null | undefined): LucideIcon {
  const key = slug ?? '';
  if (ICON_BY_SLUG[key]) return ICON_BY_SLUG[key];
  if (key.includes('imovel') || key.includes('terreno')) return Package;
  if (key.includes('veiculo')) return Car;
  if (key.includes('sucata')) return Recycle;
  return Package;
}

export function getCategoryColor(slug: string | null | undefined): string {
  return getMapPinColor(slug);
}

export function getCategoryColorForItem(
  slug: string | null | undefined,
  title?: string | null,
): string {
  return getMapPinColor(slug, title);
}

export function isVerifiedForMainRadar(
  status: VerificationStatus | string,
): boolean {
  return status === 'VERIFICADO';
}

export function isAutoDesmancheFocus(
  slug: string | null | undefined,
  title?: string | null,
): boolean {
  const resolved = resolveDisplayCategorySlug(slug, title);
  return (AUTO_FOCUS_CATEGORY_SLUGS as readonly string[]).includes(resolved);
}

export function sortCategoriesForFocus<
  T extends { slug: string; name: string },
>(categories: T[]): T[] {
  const order = new Map(
    AUTO_FOCUS_CATEGORY_SLUGS.map((s, i) => [s, i] as const),
  );
  return [...categories].sort((a, b) => {
    const ai = order.get(a.slug as (typeof AUTO_FOCUS_CATEGORY_SLUGS)[number]);
    const bi = order.get(b.slug as (typeof AUTO_FOCUS_CATEGORY_SLUGS)[number]);
    if (ai != null && bi != null) return ai - bi;
    if (ai != null) return -1;
    if (bi != null) return 1;
    return a.name.localeCompare(b.name, 'pt-BR');
  });
}

export const KPI_CATEGORY_ORDER = [...VEHICLE_FOCUS_CATEGORY_SLUGS] as const;

export function kpiIconTone(slug: string): string {
  const key = resolveMapLegendKey(slug);
  const map: Record<MapLegendKey, string> = {
    'sucata-inservivel': 'bg-green-100 text-green-700',
    'sucata-aproveitavel': 'bg-blue-100 text-blue-700',
    'veiculo-conservado': 'bg-cyan-100 text-cyan-700',
    imovel: 'bg-violet-100 text-violet-600',
    maquina: 'bg-amber-100 text-amber-700',
    mercadoria: 'bg-orange-100 text-orange-700',
    outros: 'bg-slate-100 text-slate-600',
  };
  return map[key];
}

export { Gavel };
