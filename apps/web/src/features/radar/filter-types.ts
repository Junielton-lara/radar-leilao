import type { AuctionType, BrazilianState, VerificationStatus } from '@lancex/shared';

export interface RadarFiltersState {
  states: BrazilianState[];
  city: string;
  region: string;
  categoryIds: string[];
  auctionType: AuctionType | '';
  statuses: VerificationStatus[];
  minValue: string;
  maxValue: string;
  startDateFrom: string;
  startDateTo: string;
  endDateFrom: string;
  endDateTo: string;
  organizerType: string;
  q: string;
}

export const EMPTY_RADAR_FILTERS: RadarFiltersState = {
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
};

export const REGIONS = [
  'Norte',
  'Nordeste',
  'Centro-Oeste',
  'Sudeste',
  'Sul',
] as const;

export const ORGANIZER_TYPES = [
  { value: '', label: 'Todos' },
  { value: 'BANCO', label: 'Banco / Financeira' },
  { value: 'JUDICIAL', label: 'Poder Judiciário' },
  { value: 'PUBLICO', label: 'Órgão público' },
  { value: 'PRIVADO', label: 'Particular / Leiloeiro' },
] as const;

export function buildAuctionQueryParams(
  filters: RadarFiltersState,
  extras?: Record<string, string | number | undefined>,
): URLSearchParams {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(extras ?? {})) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }

  if (filters.q.trim()) params.set('q', filters.q.trim());
  if (filters.states.length === 1) params.set('state', filters.states[0]);
  if (filters.states.length > 1) params.set('states', filters.states.join(','));
  if (filters.city.trim()) params.set('city', filters.city.trim());
  if (filters.region) params.set('region', filters.region);
  if (filters.categoryIds.length === 1) {
    params.set('categoryId', filters.categoryIds[0]);
  }
  if (filters.categoryIds.length > 0) {
    params.set('categoryIds', filters.categoryIds.join(','));
  }
  if (filters.auctionType) params.set('auctionType', filters.auctionType);
  if (filters.statuses.length === 1) params.set('status', filters.statuses[0]);
  if (filters.statuses.length > 1) {
    params.set('status', filters.statuses.join(','));
  }
  if (filters.minValue) params.set('minValue', filters.minValue);
  if (filters.maxValue) params.set('maxValue', filters.maxValue);
  if (filters.startDateFrom) params.set('startDateFrom', filters.startDateFrom);
  if (filters.startDateTo) params.set('startDateTo', filters.startDateTo);
  if (filters.endDateFrom) params.set('endDateFrom', filters.endDateFrom);
  if (filters.endDateTo) params.set('endDateTo', filters.endDateTo);
  if (filters.organizerType) params.set('organizerType', filters.organizerType);

  return params;
}

export function buildBboxQueryParams(
  bbox: {
    minLng: number;
    minLat: number;
    maxLng: number;
    maxLat: number;
    zoom: number;
  },
  filters: RadarFiltersState,
): URLSearchParams {
  const params = buildAuctionQueryParams(filters, {
    minLng: bbox.minLng,
    minLat: bbox.minLat,
    maxLng: bbox.maxLng,
    maxLat: bbox.maxLat,
    zoom: bbox.zoom,
    limit: 500,
  });
  // bbox endpoint expects comma-separated states/status (see BboxQueryDto)
  if (filters.states.length) params.set('states', filters.states.join(','));
  if (filters.statuses.length) {
    params.set('status', filters.statuses.join(','));
  }
  return params;
}

export function countActiveFilters(filters: RadarFiltersState): number {
  let n = 0;
  if (filters.states.length) n += 1;
  if (filters.city.trim()) n += 1;
  if (filters.region) n += 1;
  if (filters.categoryIds.length) n += 1;
  if (filters.auctionType) n += 1;
  if (filters.statuses.length) n += 1;
  if (filters.minValue || filters.maxValue) n += 1;
  if (filters.startDateFrom || filters.startDateTo) n += 1;
  if (filters.endDateFrom || filters.endDateTo) n += 1;
  if (filters.organizerType) n += 1;
  if (filters.q.trim()) n += 1;
  return n;
}
