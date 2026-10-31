import { BrazilianState, Source, SourceType } from '@prisma/client';

export type DiscoveredItem = {
  url: string;
  title?: string;
  snippet?: string;
  state?: BrazilianState | null;
  category?: string | null;
  raw?: Record<string, unknown>;
};

export type ExtractedContent = {
  url: string;
  title?: string;
  text?: string;
  raw?: Record<string, unknown>;
  status: 'ok' | 'failed' | 'skipped';
  message?: string;
};

export type NormalizedAuctionCandidate = {
  title: string;
  description?: string;
  originalUrl: string;
  canonicalUrl: string;
  state?: BrazilianState | null;
  city?: string | null;
  categorySlug?: string | null;
  organizerName?: string | null;
  procedureRef?: string | null;
  publicationDate?: Date | null;
  endDate?: Date | null;
  evidence?: Record<string, unknown>;
};

export type AdapterStatus = {
  ready: boolean;
  code: string;
  message: string;
};

export type DiscoverContext = {
  source: Source;
  states: BrazilianState[];
  categories: string[];
};

export interface SourceAdapter {
  readonly type: SourceType | string;
  status(): AdapterStatus | Promise<AdapterStatus>;
  discover(ctx: DiscoverContext): Promise<DiscoveredItem[]>;
  search(query: string, ctx: DiscoverContext): Promise<DiscoveredItem[]>;
  extract(urls: string[]): Promise<ExtractedContent[]>;
  normalize(item: DiscoveredItem, extracted?: ExtractedContent): NormalizedAuctionCandidate | null;
  validate(candidate: NormalizedAuctionCandidate): { ok: boolean; reasons: string[] };
  getChanges(since: Date): Promise<DiscoveredItem[]>;
}
