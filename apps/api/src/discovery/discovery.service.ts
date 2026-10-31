import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  BrazilianState,
  Prisma,
  SourceType,
  VerificationStatus,
} from '@prisma/client';
import { BRAZILIAN_STATES } from '@lancex/shared';
import { IntelligenceService } from '../intelligence/intelligence.service';
import { PrismaService } from '../prisma/prisma.service';
import { TavilyService } from '../tavily/tavily.service';
import { canonicalUrl, isLikelyDuplicate } from './dedupe';
import { TavilyAdapter } from './adapters/tavily.adapter';
import { ManualSourceAdapter } from './adapters/manual.adapter';
import {
  BancoAdapter,
  DiariosAdapter,
  GovernmentPortalAdapter,
  LeiloeiroAdapter,
  OrgaoPublicoAdapter,
  PlataformaPrivadaAdapter,
  PrefeturaAdapter,
  TribunalAdapter,
} from './adapters/stub.adapter';
import type {
  NormalizedAuctionCandidate,
  SourceAdapter,
} from './adapters/source-adapter.interface';
import { slugify } from '../common/utils/slug.util';
import { sanitizeJsonForPostgres, stripNullBytes } from '../common/json/sanitize-json-for-postgres';
import { resolveMapCoordinates } from '../common/geo/state-centroids';

@Injectable()
export class DiscoveryService implements OnModuleInit {
  private readonly logger = new Logger(DiscoveryService.name);
  private adapters = new Map<string, SourceAdapter>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly tavily: TavilyService,
    private readonly intelligence: IntelligenceService,
  ) {}

  onModuleInit() {
    this.adapters.set(SourceType.TAVILY, new TavilyAdapter(this.tavily));
    this.adapters.set(SourceType.MANUAL, new ManualSourceAdapter());
    this.adapters.set(SourceType.GOVERNMENT, new GovernmentPortalAdapter());
    this.adapters.set(SourceType.DIARIO_OFICIAL, new DiariosAdapter());
    this.adapters.set(SourceType.TRIBUNAL, new TribunalAdapter());
    this.adapters.set(SourceType.PREFEITURA, new PrefeturaAdapter());
    this.adapters.set(SourceType.ORGAO_PUBLICO, new OrgaoPublicoAdapter());
    this.adapters.set(SourceType.LEILOEIRO, new LeiloeiroAdapter());
    this.adapters.set(
      SourceType.PLATAFORMA_PRIVADA,
      new PlataformaPrivadaAdapter(),
    );
    this.adapters.set(SourceType.BANCO, new BancoAdapter());
  }

  /** Compatível com JobsService.dispatch */
  async run(input: {
    sourceId?: string;
    states?: BrazilianState[];
    categories?: string[];
    name?: string;
  }) {
    if (input.sourceId) {
      return this.runForSource(input.sourceId, input.states);
    }
    return this.runDailyRound(input.states);
  }

  private getAdapter(type: SourceType): SourceAdapter {
    const adapter = this.adapters.get(type);
    if (!adapter) return new GovernmentPortalAdapter();
    return adapter;
  }

  async runDailyRound(states?: BrazilianState[]) {
    const targets = states?.length ? states : [...BRAZILIAN_STATES];
    const sources = await this.prisma.source.findMany({
      where: { status: 'active' },
      orderBy: { priority: 'desc' },
    });
    const results = [];
    for (const source of sources) {
      results.push(await this.runForSource(source.id, targets));
    }
    await this.backfillApproximateCoordinates();
    return { sources: sources.length, states: targets.length, results };
  }

  async runForSource(sourceId: string, states?: BrazilianState[]) {
    const source = await this.prisma.source.findUnique({
      where: { id: sourceId },
    });
    if (!source) return { ok: false, message: 'Fonte não encontrada' };

    const adapter = this.getAdapter(source.sourceType);
    const status = await adapter.status();
    if (!status.ready) {
      return {
        ok: false,
        sourceId,
        code: status.code,
        message: status.message,
      };
    }

    const categories = await this.prisma.auctionCategory.findMany({
      select: { slug: true },
    });
    const allCategorySlugs = categories.map((c) => c.slug);
    const categorySlugs = this.resolveCategoriesForSource(source, allCategorySlugs);
    const ufList =
      states ??
      (source.geographicScope
        ? (source.geographicScope
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean) as BrazilianState[])
        : [...BRAZILIAN_STATES]);

    const run = await this.prisma.searchRun.create({
      data: {
        name: `discovery:${source.slug}`,
        status: 'running',
        coverageStates: ufList,
        categories: categorySlugs,
        startedAt: new Date(),
      },
    });

    let success = 0;
    let failure = 0;
    let found = 0;

    try {
      const items = await adapter.discover({
        source,
        states: ufList,
        categories: categorySlugs,
      });

      for (const item of items) {
        found += 1;
        try {
          await this.prisma.searchRunItem.create({
            data: {
              searchRunId: run.id,
              url: stripNullBytes(item.url),
              title: item.title ? stripNullBytes(item.title) : item.title,
              snippet: item.snippet ? stripNullBytes(item.snippet) : item.snippet,
              state: item.state ?? undefined,
              category: item.category ?? undefined,
              status: 'found',
              rawJson: item.raw
                ? (sanitizeJsonForPostgres(item.raw) as Prisma.InputJsonValue)
                : undefined,
            },
          });

          const extracted = (await adapter.extract([item.url]))[0];
          const candidate = adapter.normalize(item, extracted);
          if (!candidate) continue;
          const validation = adapter.validate(candidate);
          if (!validation.ok) {
            failure += 1;
            continue;
          }
          const upserted = await this.persistCandidate(candidate, source.id);
          if (upserted) success += 1;
        } catch (itemErr) {
          failure += 1;
          this.logger.warn(
            `Discovery item falhou (${item.url}): ${String(itemErr)}`,
          );
        }
      }

      for (const uf of ufList) {
        await this.prisma.stateCoverage.update({
          where: { state: uf },
          data: {
            lastSearchedAt: new Date(),
            categoriesCovered: categorySlugs,
            sourcesConsulted: { increment: 1 },
            opportunitiesFound: { increment: success },
            successCount: { increment: success > 0 ? 1 : 0 },
            failureCount: { increment: failure > 0 ? 1 : 0 },
          },
        });
      }

      await this.prisma.source.update({
        where: { id: source.id },
        data: {
          lastRunAt: new Date(),
          successRate:
            found === 0 ? 0 : Math.round((success / Math.max(found, 1)) * 100),
        },
      });

      await this.prisma.searchRun.update({
        where: { id: run.id },
        data: {
          status: 'completed',
          finishedAt: new Date(),
          sourcesConsulted: 1,
          successCount: success,
          failureCount: failure,
          opportunitiesFound: success,
        },
      });

      await this.backfillApproximateCoordinates();

      void this.intelligence
        .createSnapshot({ searchRunId: run.id, source: 'system' })
        .catch((err) =>
          this.logger.warn(`Briefing intelligence: ${String(err)}`),
        );

      return {
        ok: true,
        searchRunId: run.id,
        found,
        persisted: success,
        failures: failure,
        itemsInRun: found,
      };
    } catch (e) {
      this.logger.error(`Discovery falhou: ${String(e)}`);
      await this.prisma.searchRun.update({
        where: { id: run.id },
        data: {
          status: 'failed',
          finishedAt: new Date(),
          failureCount: failure + 1,
        },
      });
      return { ok: false, searchRunId: run.id, message: String(e) };
    }
  }

  private resolveCategoriesForSource(
    source: { category: string | null; slug: string; configJson: unknown },
    allSlugs: string[],
  ): string[] {
    const cfg = source.configJson as {
      categories?: string[];
      categorySlug?: string;
    } | null;
    if (cfg?.categories?.length) {
      const picked = cfg.categories.filter((s) => allSlugs.includes(s));
      if (picked.length) return picked;
    }
    if (cfg?.categorySlug && allSlugs.includes(cfg.categorySlug)) {
      return [cfg.categorySlug];
    }
    if (source.category) {
      const direct = source.category.trim();
      if (allSlugs.includes(direct)) return [direct];
      const fromSlug = slugify(direct);
      if (allSlugs.includes(fromSlug)) return [fromSlug];
    }
    const slugAliases: Record<string, string> = {
      motos: 'motocicletas',
      carros: 'veiculos',
      caminhao: 'caminhoes',
      caminhoes: 'caminhoes',
      sucatas: 'sucatas',
      'cobertura-nacional': 'veiculos',
    };
    const alias = slugAliases[source.slug];
    if (alias && allSlugs.includes(alias)) return [alias];
    return allSlugs;
  }

  private async persistCandidate(
    candidate: NormalizedAuctionCandidate,
    sourceId: string,
  ) {
    const canon = canonicalUrl(candidate.canonicalUrl || candidate.originalUrl);
    if (!canon) return null;

    const existingByUrl = await this.prisma.auction.findFirst({
      where: {
        OR: [{ canonicalUrl: canon }, { originalUrl: candidate.originalUrl }],
      },
    });

    if (existingByUrl) {
      await this.prisma.auctionHistory.create({
        data: {
          auctionId: existingByUrl.id,
          eventType: 'rediscovery',
          reason: 'URL canônica já conhecida — histórico preservado',
          actor: 'discovery',
          evidenceJson: sanitizeJsonForPostgres(
            candidate.evidence,
          ) as Prisma.InputJsonValue,
        },
      });
      await this.prisma.auction.update({
        where: { id: existingByUrl.id },
        data: { lastCheckedAt: new Date() },
      });
      return existingByUrl;
    }

    const recent = await this.prisma.auction.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: { organizer: true },
    });
    const dup = recent.find((a) =>
      isLikelyDuplicate({
        urlA: a.canonicalUrl ?? a.originalUrl,
        urlB: canon,
        organizerA: a.organizer?.name,
        organizerB: candidate.organizerName,
        titleA: a.title,
        titleB: candidate.title,
      }),
    );
    if (dup) {
      await this.prisma.auctionHistory.create({
        data: {
          auctionId: dup.id,
          eventType: 'duplicate_link',
          reason: 'Candidato relacionado por similaridade — não apagado',
          actor: 'discovery',
          evidenceJson: {
            candidateUrl: canon,
            candidateTitle: candidate.title,
          },
        },
      });
      return dup;
    }

    let organizerId: string | undefined;
    if (candidate.organizerName) {
      const existingOrg = await this.prisma.organizer.findFirst({
        where: { name: candidate.organizerName },
      });
      const org =
        existingOrg ??
        (await this.prisma.organizer.create({
          data: {
            name: candidate.organizerName,
            state: candidate.state ?? undefined,
            verificationStatus: VerificationStatus.NAO_CONFIRMADO,
          },
        }));
      organizerId = org.id;
    }

    let categoryId: string | undefined;
    if (candidate.categorySlug) {
      const cat = await this.prisma.auctionCategory.findUnique({
        where: { slug: candidate.categorySlug },
      });
      categoryId = cat?.id;
    }

    const baseSlug = slugify(candidate.title).slice(0, 60) || 'oportunidade';
    const slug = `${baseSlug}-${Date.now().toString(36)}`;
    const coords = resolveMapCoordinates(
      candidate.state ?? null,
      slug,
      null,
      null,
    );

    return this.prisma.auction.create({
      data: {
        title: stripNullBytes(candidate.title),
        slug,
        description: candidate.description
          ? stripNullBytes(candidate.description)
          : candidate.description,
        state: candidate.state ?? undefined,
        city: candidate.city ?? undefined,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        originalUrl: candidate.originalUrl,
        canonicalUrl: canon,
        publicationDate: candidate.publicationDate ?? undefined,
        endDate: candidate.endDate ?? undefined,
        verificationStatus: VerificationStatus.NAO_CONFIRMADO,
        sourceId,
        organizerId,
        categoryId,
        lastCheckedAt: new Date(),
        history: {
          create: {
            eventType: 'first_seen',
            toStatus: VerificationStatus.NAO_CONFIRMADO,
            reason: 'Identificado pelo motor de descoberta',
            actor: 'discovery',
          },
        },
        evidences: {
          create: {
            evidenceType: 'source_url',
            sourceUrl: candidate.originalUrl,
            evidenceDescription: 'URL descoberta na coleta',
            evidenceStatus: 'collected',
          },
        },
      },
    });
  }

  listRuns(take = 20) {
    return this.prisma.searchRun.findMany({
      orderBy: { createdAt: 'desc' },
      take,
      include: { _count: { select: { items: true } } },
    });
  }

  private async backfillApproximateCoordinates(limit = 800) {
    const rows = await this.prisma.auction.findMany({
      where: { latitude: null, state: { not: null } },
      select: { id: true, state: true },
      take: limit,
    });
    for (const row of rows) {
      const coords = resolveMapCoordinates(row.state, row.id, null, null);
      if (!coords) continue;
      await this.prisma.auction.update({
        where: { id: row.id },
        data: {
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
      });
    }
  }

  getRun(id: string) {
    return this.prisma.searchRun.findUnique({
      where: { id },
      include: { items: { take: 100, orderBy: { createdAt: 'desc' } } },
    });
  }
}
