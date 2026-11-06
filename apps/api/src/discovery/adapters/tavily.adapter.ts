import { BrazilianState, SourceType } from '@prisma/client';
import { normalizeCanonicalUrl } from '../../common/utils/url-safety.util';
import { buildIntelligenceSearchQuery } from '../../intelligence/intelligence-queries';
import { TavilyService } from '../../tavily/tavily.service';
import {
  AdapterStatus,
  DiscoverContext,
  DiscoveredItem,
  ExtractedContent,
  NormalizedAuctionCandidate,
  SourceAdapter,
} from './source-adapter.interface';

export class TavilyAdapter implements SourceAdapter {
  readonly type = SourceType.TAVILY;

  constructor(private readonly tavily: TavilyService) {}

  async status(): Promise<AdapterStatus> {
    const s = await this.tavily.getStatus();
    if (!s.configured) {
      return {
        ready: false,
        code: 'TAVILY_NOT_CONFIGURED',
        message: s.message,
      };
    }
    if (s.disabledByLimit) {
      return {
        ready: false,
        code: 'TAVILY_LIMIT_REACHED',
        message: s.message,
      };
    }
    return {
      ready: true,
      code: 'TAVILY_READY',
      message: s.message,
    };
  }

  async discover(ctx: DiscoverContext): Promise<DiscoveredItem[]> {
    const st = await this.status();
    if (!st.ready) {
      throw Object.assign(new Error(st.message), { code: st.code, adapterStatus: st });
    }

    const items: DiscoveredItem[] = [];
    const categories =
      ctx.categories.length > 0
        ? ctx.categories
        : [ctx.source.category || 'leilão'];

    for (const state of ctx.states) {
      for (const category of categories) {
        const query = this.buildQuery(state, category, ctx.source);
        const res = await this.tavily.search({
          query,
          maxResults: 12,
          searchDepth: 'advanced',
        });
        for (const r of res.results ?? []) {
          items.push({
            url: r.url,
            title: r.title,
            snippet: r.content,
            state,
            category,
            raw: { ...r, query, cached: res.cached },
          });
        }
      }
    }
    return items;
  }

  async search(query: string, ctx: DiscoverContext): Promise<DiscoveredItem[]> {
    const st = await this.status();
    if (!st.ready) {
      throw Object.assign(new Error(st.message), { code: st.code, adapterStatus: st });
    }
    const res = await this.tavily.search({ query, maxResults: 10 });
    return (res.results ?? []).map((r) => ({
      url: r.url,
      title: r.title,
      snippet: r.content,
      state: ctx.states[0] ?? null,
      category: ctx.categories[0] ?? null,
      raw: r as unknown as Record<string, unknown>,
    }));
  }

  async extract(urls: string[]): Promise<ExtractedContent[]> {
    if (!urls.length) return [];
    const st = await this.status();
    if (!st.ready) {
      return urls.map((url) => ({
        url,
        status: 'skipped' as const,
        message: st.message,
      }));
    }
    const res = await this.tavily.extract(urls);
    const byUrl = new Map(
      (res.results ?? []).map((r) => [r.url, r]),
    );
    const failed = new Set((res.failed_results ?? []).map((f) => f.url));
    return urls.map((url) => {
      if (failed.has(url)) {
        return { url, status: 'failed' as const, message: 'extract failed' };
      }
      const hit = byUrl.get(url);
      return {
        url,
        status: 'ok' as const,
        text: hit?.raw_content ?? undefined,
        raw: hit as unknown as Record<string, unknown>,
      };
    });
  }

  normalize(
    item: DiscoveredItem,
    extracted?: ExtractedContent,
  ): NormalizedAuctionCandidate | null {
    if (!item.url) return null;
    const pageText =
      extracted?.status === 'ok' && extracted.text?.trim()
        ? extracted.text.trim()
        : null;
    return {
      title: item.title?.trim() || item.url,
      description: item.snippet ?? pageText?.slice(0, 2000),
      originalUrl: item.url,
      canonicalUrl: normalizeCanonicalUrl(item.url),
      state: item.state ?? null,
      categorySlug: item.category ?? null,
      extractedText: pageText?.slice(0, 50000) ?? null,
      evidence: {
        adapter: 'tavily',
        snippet: item.snippet,
        extracted: Boolean(pageText),
        extractedChars: pageText?.length ?? 0,
      },
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

  private buildQuery(
    state: BrazilianState,
    category: string,
    source: DiscoverContext['source'],
  ): string {
    const extra =
      source.configJson &&
      typeof source.configJson === 'object' &&
      'queryTemplate' in (source.configJson as object)
        ? String((source.configJson as { queryTemplate?: string }).queryTemplate)
        : '';
    if (extra) {
      return extra
        .replace('{state}', state)
        .replace('{category}', category)
        .replace('{source}', source.name);
    }
    return buildIntelligenceSearchQuery(state, category);
  }
}
