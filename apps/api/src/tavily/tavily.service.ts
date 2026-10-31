import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  decryptCredential,
  sha256,
} from '../common/crypto/credentials.crypto';
import { sanitizeJsonForPostgres } from '../common/json/sanitize-json-for-postgres';
import { PrismaService } from '../prisma/prisma.service';
import {
  TavilyExtractResponse,
  TavilySearchResponse,
  TavilyStatus,
} from './tavily.types';

const TAVILY_BASE = 'https://api.tavily.com';

type TavilyConfig = {
  dailyLimit?: number;
  monthlyLimit?: number;
  disabledByLimit?: boolean;
  searchDepth?: string;
  maxResults?: number;
  configured?: boolean;
  note?: string;
};

@Injectable()
export class TavilyService {
  private readonly logger = new Logger(TavilyService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getStatus(): Promise<TavilyStatus> {
    const integration = await this.prisma.integrationSetting.findUnique({
      where: { provider: 'tavily' },
    });
    const config = (integration?.configJson ?? {}) as TavilyConfig;
    const envKey = Boolean(process.env.TAVILY_API_KEY?.trim());
    const hasCred = Boolean(integration?.credentialsEnc) || envKey;
    const dailyLimit = Number(config.dailyLimit ?? 0);
    const monthlyLimit = Number(config.monthlyLimit ?? 0);
    const { dailyUsed, monthlyUsed } = await this.usageCounts();
    const disabledByLimit =
      Boolean(config.disabledByLimit) ||
      (dailyLimit > 0 && dailyUsed >= dailyLimit) ||
      (monthlyLimit > 0 && monthlyUsed >= monthlyLimit);

    let source: TavilyStatus['source'] = 'none';
    if (integration?.credentialsEnc) source = 'integration';
    else if (envKey) source = 'env';

    const configured = hasCred && (integration?.active || envKey);
    return {
      configured: Boolean(configured),
      active: Boolean(integration?.active || (envKey && !integration)),
      disabledByLimit,
      dailyLimit,
      monthlyLimit,
      dailyUsed,
      monthlyUsed,
      source,
      message: !hasCred
        ? 'Tavily não configurado. Defina IntegrationSetting (tavily) ou TAVILY_API_KEY.'
        : disabledByLimit
          ? 'Limite diário/mensal de créditos Tavily atingido. Coleta recusada.'
          : !(integration?.active || envKey)
            ? 'Tavily configurado mas inativo.'
            : 'Tavily pronto.',
    };
  }

  async assertCanCollect(): Promise<{ apiKey: string; status: TavilyStatus }> {
    const status = await this.getStatus();
    if (!status.configured) {
      throw new ServiceUnavailableException({
        code: 'TAVILY_NOT_CONFIGURED',
        message: status.message,
        status,
      });
    }
    if (status.disabledByLimit) {
      await this.prisma.integrationSetting.updateMany({
        where: { provider: 'tavily' },
        data: {
          configJson: {
            ...(((
              await this.prisma.integrationSetting.findUnique({
                where: { provider: 'tavily' },
              })
            )?.configJson as object) ?? {}),
            disabledByLimit: true,
          } as Prisma.InputJsonValue,
        },
      });
      throw new ServiceUnavailableException({
        code: 'TAVILY_LIMIT_REACHED',
        message: status.message,
        status,
      });
    }
    const apiKey = await this.resolveApiKey();
    if (!apiKey) {
      throw new ServiceUnavailableException({
        code: 'TAVILY_NOT_CONFIGURED',
        message: 'Chave Tavily indisponível',
        status,
      });
    }
    return { apiKey, status };
  }

  async search(params: {
    query: string;
    maxResults?: number;
    searchDepth?: 'basic' | 'advanced';
    includeDomains?: string[];
    excludeDomains?: string[];
  }): Promise<TavilySearchResponse> {
    const { apiKey } = await this.assertCanCollect();
    const day = this.dayKey();
    const endpoint = 'search';
    const body = {
      query: params.query,
      max_results: params.maxResults ?? 10,
      search_depth: params.searchDepth ?? 'basic',
      include_domains: params.includeDomains,
      exclude_domains: params.excludeDomains,
    };
    const queryHash = sha256(JSON.stringify({ endpoint, ...body }));

    const cached = await this.prisma.tavilyCache.findUnique({
      where: { queryHash_day_endpoint: { queryHash, day, endpoint } },
    });
    if (cached) {
      const data = cached.responseJson as unknown as TavilySearchResponse;
      return { ...data, cached: true, creditsEstimated: 0 };
    }

    const credits = body.search_depth === 'advanced' ? 2 : 1;
    await this.guardCredits(credits);

    const raw = await this.callTavily<TavilySearchResponse>(
      '/search',
      { ...body, api_key: apiKey },
      apiKey,
    );

    await this.saveTavilyCache({
      queryHash,
      day,
      endpoint,
      responseJson: raw as unknown as Prisma.InputJsonValue,
      creditsUsed: credits,
    });
    await this.logUsage('search', credits, true, { query: params.query });

    return { ...raw, cached: false, creditsEstimated: credits };
  }

  async extract(urls: string[]): Promise<TavilyExtractResponse> {
    const { apiKey } = await this.assertCanCollect();
    const day = this.dayKey();
    const endpoint = 'extract';
    const normalized = [...urls].sort();
    const queryHash = sha256(JSON.stringify({ endpoint, urls: normalized }));

    const cached = await this.prisma.tavilyCache.findUnique({
      where: { queryHash_day_endpoint: { queryHash, day, endpoint } },
    });
    if (cached) {
      const data = cached.responseJson as unknown as TavilyExtractResponse;
      return { ...data, cached: true, creditsEstimated: 0 };
    }

    const credits = Math.max(1, urls.length);
    await this.guardCredits(credits);

    const raw = await this.callTavily<TavilyExtractResponse>(
      '/extract',
      { urls: normalized, api_key: apiKey },
      apiKey,
    );

    await this.saveTavilyCache({
      queryHash,
      day,
      endpoint,
      responseJson: raw as unknown as Prisma.InputJsonValue,
      creditsUsed: credits,
    });
    await this.logUsage('extract', credits, true, { urlCount: urls.length });

    return { ...raw, cached: false, creditsEstimated: credits };
  }

  /** Real Tavily map endpoint — used when needed; refuses if not configured. */
  async map(url: string): Promise<unknown> {
    const { apiKey } = await this.assertCanCollect();
    const credits = 1;
    await this.guardCredits(credits);
    const raw = await this.callTavily(
      '/map',
      { url, api_key: apiKey },
      apiKey,
    );
    await this.logUsage('map', credits, true, { url });
    return raw;
  }

  /** Real Tavily crawl endpoint — used when needed; refuses if not configured. */
  async crawl(url: string, options?: Record<string, unknown>): Promise<unknown> {
    const { apiKey } = await this.assertCanCollect();
    const credits = 2;
    await this.guardCredits(credits);
    const raw = await this.callTavily(
      '/crawl',
      { url, ...(options ?? {}), api_key: apiKey },
      apiKey,
    );
    await this.logUsage('crawl', credits, true, { url });
    return raw;
  }

  private async saveTavilyCache(input: {
    queryHash: string;
    day: string;
    endpoint: string;
    responseJson: Prisma.InputJsonValue;
    creditsUsed: number;
  }) {
    const responseJson = sanitizeJsonForPostgres(
      input.responseJson,
    ) as Prisma.InputJsonValue;
    await this.prisma.tavilyCache.upsert({
      where: {
        queryHash_day_endpoint: {
          queryHash: input.queryHash,
          day: input.day,
          endpoint: input.endpoint,
        },
      },
      create: {
        queryHash: input.queryHash,
        day: input.day,
        endpoint: input.endpoint,
        responseJson,
        creditsUsed: input.creditsUsed,
      },
      update: {
        responseJson,
        creditsUsed: input.creditsUsed,
      },
    });
  }

  private async resolveApiKey(): Promise<string | null> {
    const integration = await this.prisma.integrationSetting.findUnique({
      where: { provider: 'tavily' },
    });
    if (integration?.credentialsEnc) {
      try {
        return decryptCredential(integration.credentialsEnc);
      } catch (e) {
        this.logger.error('Falha ao descriptografar credencial Tavily');
      }
    }
    return process.env.TAVILY_API_KEY?.trim() || null;
  }

  private async callTavily<T>(
    path: string,
    body: Record<string, unknown>,
    _apiKey: string,
  ): Promise<T> {
    const res = await fetch(`${TAVILY_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      await this.logUsage(path.replace('/', ''), 0, false, {
        status: res.status,
        body: text.slice(0, 500),
      });
      throw new ServiceUnavailableException({
        code: 'TAVILY_API_ERROR',
        message: `Tavily ${path} falhou (${res.status})`,
        detail: text.slice(0, 300),
      });
    }
    return (await res.json()) as T;
  }

  private async guardCredits(needed: number) {
    const status = await this.getStatus();
    if (
      (status.dailyLimit > 0 && status.dailyUsed + needed > status.dailyLimit) ||
      (status.monthlyLimit > 0 &&
        status.monthlyUsed + needed > status.monthlyLimit)
    ) {
      throw new ServiceUnavailableException({
        code: 'TAVILY_LIMIT_REACHED',
        message: 'Limite de créditos Tavily seria excedido',
        status,
      });
    }
  }

  private async usageCounts() {
    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setUTCHours(0, 0, 0, 0);
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    const [daily, monthly] = await Promise.all([
      this.prisma.integrationUsageLog.aggregate({
        where: {
          provider: 'tavily',
          success: true,
          createdAt: { gte: dayStart },
        },
        _sum: { creditsEstimated: true },
      }),
      this.prisma.integrationUsageLog.aggregate({
        where: {
          provider: 'tavily',
          success: true,
          createdAt: { gte: monthStart },
        },
        _sum: { creditsEstimated: true },
      }),
    ]);

    return {
      dailyUsed: daily._sum.creditsEstimated ?? 0,
      monthlyUsed: monthly._sum.creditsEstimated ?? 0,
    };
  }

  private async logUsage(
    operation: string,
    credits: number,
    success: boolean,
    meta?: Record<string, unknown>,
  ) {
    await this.prisma.integrationUsageLog.create({
      data: {
        provider: 'tavily',
        operation,
        creditsEstimated: credits,
        success,
        metaJson: (meta as Prisma.InputJsonValue) ?? undefined,
      },
    });
  }

  private dayKey(d = new Date()): string {
    return d.toISOString().slice(0, 10);
  }

  /** Admin connectivity check — consome ~1 crédito Tavily quando ativo. */
  async testConnection(): Promise<{
    ok: boolean;
    message: string;
    latencyMs?: number;
  }> {
    const status = await this.getStatus();
    if (!status.configured) {
      return { ok: false, message: status.message };
    }
    const started = Date.now();
    try {
      await this.search({
        query: 'leilão público Brasil',
        maxResults: 1,
        searchDepth: 'basic',
      });
      return {
        ok: true,
        message: 'Tavily respondeu (busca mínima, ~1 crédito).',
        latencyMs: Date.now() - started,
      };
    } catch (e) {
      return {
        ok: false,
        message: e instanceof Error ? e.message : String(e),
        latencyMs: Date.now() - started,
      };
    }
  }

  /** Pure helper for unit tests — whether a call should be blocked by limits. */
  static shouldBlockByLimit(opts: {
    dailyLimit: number;
    monthlyLimit: number;
    dailyUsed: number;
    monthlyUsed: number;
    needed: number;
    disabledByLimit?: boolean;
  }): boolean {
    if (opts.disabledByLimit) return true;
    if (opts.dailyLimit > 0 && opts.dailyUsed + opts.needed > opts.dailyLimit) {
      return true;
    }
    if (
      opts.monthlyLimit > 0 &&
      opts.monthlyUsed + opts.needed > opts.monthlyLimit
    ) {
      return true;
    }
    return false;
  }
}
