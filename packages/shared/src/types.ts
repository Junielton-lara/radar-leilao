import type {
  AuctionType,
  BrazilianState,
  UserRole,
  UserStatus,
  VerificationStatus,
} from './enums';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

export interface LoginResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface AuctionMarker {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  categorySlug: string | null;
  categoryName: string | null;
  verificationStatus: VerificationStatus;
  minimumBid: string | null;
  appraisalValue?: string | null;
  auctionType?: AuctionType | null;
  organizerName?: string | null;
  lotCount?: number;
  descriptionSnippet?: string | null;
  originalUrl?: string | null;
  state: BrazilianState | null;
  city: string | null;
  endDate: string | null;
  startDate?: string | null;
  publicationDate?: string | null;
  /** true = posição aproximada pela capital da UF (sem geocode) */
  approximate?: boolean;
}

export interface AuctionSummary {
  id: string;
  title: string;
  slug: string;
  auctionType: AuctionType | null;
  verificationStatus: VerificationStatus;
  confidenceScore: number | null;
  state: BrazilianState | null;
  city: string | null;
  appraisalValue: string | null;
  minimumBid: string | null;
  publicationDate: string | null;
  startDate: string | null;
  endDate: string | null;
  lastCheckedAt: string | null;
  category: { id: string; name: string; slug: string } | null;
  organizer: { id: string; name: string } | null;
}

export interface AuctionDetail extends AuctionSummary {
  description: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  commissionPercentage: string | null;
  originalUrl: string | null;
  firstSeenAt: string;
  createdAt: string;
  updatedAt: string;
  auctioneer: {
    id: string;
    name: string;
    registrationNumber: string | null;
  } | null;
  source: { id: string; name: string } | null;
  lots: AuctionLotSummary[];
}

export interface AuctionLotSummary {
  id: string;
  lotNumber: string | null;
  title: string;
  description: string | null;
  appraisalValue: string | null;
  minimumBid: string | null;
  status: string | null;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface RadarIndicators {
  totalOpportunities: number;
  verified: number;
  inAnalysis: number;
  highRisk: number;
  newLast24h: number;
  endingSoon: number;
  totalLots: number;
  statesMonitored: number;
  sourcesConsulted: number;
  lastCoverageAt: string | null;
  byCategory: Array<{
    slug: string;
    name: string;
    count: number;
  }>;
  byRegion: Array<{
    region: string;
    count: number;
  }>;
}

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  color: string | null;
  icon: string | null;
  children?: CategoryNode[];
}

export interface StateMeta {
  code: BrazilianState;
  name: string;
  region: string;
}
