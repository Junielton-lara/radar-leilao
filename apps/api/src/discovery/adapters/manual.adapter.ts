import { SourceType } from '@prisma/client';
import { normalizeCanonicalUrl } from '../../common/utils/url-safety.util';
import {
  AdapterStatus,
  DiscoverContext,
  DiscoveredItem,
  ExtractedContent,
  NormalizedAuctionCandidate,
  SourceAdapter,
} from './source-adapter.interface';

/**
 * ManualSourceAdapter — reads URLs/items from source.configJson.manualItems.
 * Does not invent data; only processes explicitly provided entries.
 */
export class ManualSourceAdapter implements SourceAdapter {
  readonly type = SourceType.MANUAL;

  status(): AdapterStatus {
    return {
      ready: true,
      code: 'MANUAL_READY',
      message: 'Adapter manual pronto (itens em configJson.manualItems).',
    };
  }

  async discover(ctx: DiscoverContext): Promise<DiscoveredItem[]> {
    const cfg = (ctx.source.configJson ?? {}) as {
      manualItems?: Array<{
        url: string;
        title?: string;
        snippet?: string;
        state?: string;
        category?: string;
      }>;
    };
    const items = cfg.manualItems ?? [];
    return items
      .filter((i) => i.url?.trim())
      .map((i) => ({
        url: i.url.trim(),
        title: i.title,
        snippet: i.snippet,
        state: (i.state as DiscoveredItem['state']) ?? null,
        category: i.category ?? ctx.source.category ?? null,
        raw: { ...i, source: 'manual' },
      }));
  }

  async search(query: string, ctx: DiscoverContext): Promise<DiscoveredItem[]> {
    const all = await this.discover(ctx);
    const q = query.toLowerCase();
    return all.filter(
      (i) =>
        i.title?.toLowerCase().includes(q) ||
        i.snippet?.toLowerCase().includes(q) ||
        i.url.toLowerCase().includes(q),
    );
  }

  async extract(urls: string[]): Promise<ExtractedContent[]> {
    return urls.map((url) => ({
      url,
      status: 'ok' as const,
      text: undefined,
      message: 'Extração de conteúdo remoto não aplicada no adapter manual',
    }));
  }

  normalize(
    item: DiscoveredItem,
    extracted?: ExtractedContent,
  ): NormalizedAuctionCandidate | null {
    if (!item.url) return null;
    return {
      title: item.title?.trim() || extracted?.title?.trim() || item.url,
      description: item.snippet ?? extracted?.text?.slice(0, 2000),
      originalUrl: item.url,
      canonicalUrl: normalizeCanonicalUrl(item.url),
      state: item.state ?? null,
      categorySlug: item.category ?? null,
      evidence: { adapter: 'manual', raw: item.raw },
    };
  }

  validate(candidate: NormalizedAuctionCandidate) {
    const reasons: string[] = [];
    if (!candidate.title?.trim()) reasons.push('title obrigatório');
    if (!candidate.canonicalUrl?.trim()) reasons.push('canonicalUrl obrigatório');
    return { ok: reasons.length === 0, reasons };
  }

  async getChanges(_since: Date): Promise<DiscoveredItem[]> {
    return [];
  }
}
