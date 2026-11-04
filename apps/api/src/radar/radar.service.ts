import { Injectable } from '@nestjs/common';
import { Prisma, VerificationStatus } from '@prisma/client';
import {
  STATE_REGIONS,
  VEHICLE_FOCUS_CATEGORY_SLUGS,
  inferVehicleCategorySlug,
} from '@lancex/shared';
import { buildMapAuctionWhere } from '../auctions/auction-map.filter';
import { PrismaService } from '../prisma/prisma.service';

const MAP_ACTIVE_WHERE: Prisma.AuctionWhereInput = buildMapAuctionWhere();

@Injectable()
export class RadarService {
  constructor(private readonly prisma: PrismaService) {}

  async indicators() {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const soon = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const [
      totalOpportunities,
      verified,
      inAnalysis,
      highRisk,
      newLast24h,
      endingSoon,
      totalLots,
      statesWithData,
      sourcesConsulted,
      lastCoverage,
      byStateRaw,
      recentUpdates,
      activeForVehicleKpi,
    ] = await Promise.all([
      this.prisma.auction.count({ where: MAP_ACTIVE_WHERE }),
      this.prisma.auction.count({
        where: { verificationStatus: VerificationStatus.VERIFICADO },
      }),
      this.prisma.auction.count({
        where: { verificationStatus: VerificationStatus.EM_ANALISE },
      }),
      this.prisma.auction.count({
        where: { verificationStatus: VerificationStatus.ALTO_RISCO },
      }),
      this.prisma.auction.count({
        where: { firstSeenAt: { gte: last24h } },
      }),
      this.prisma.auction.count({
        where: {
          endDate: { gt: now, lte: soon },
          verificationStatus: {
            notIn: [VerificationStatus.CANCELADO, VerificationStatus.ENCERRADO],
          },
        },
      }),
      this.prisma.auctionLot.count(),
      this.prisma.auction.findMany({
        where: { state: { not: null } },
        distinct: ['state'],
        select: { state: true },
      }),
      this.prisma.source.count({ where: { status: 'active' } }),
      this.prisma.searchRun.findFirst({
        where: { status: 'completed' },
        orderBy: { finishedAt: 'desc' },
        select: { finishedAt: true },
      }),
      this.prisma.auction.groupBy({
        by: ['state'],
        _count: { _all: true },
        where: { state: { not: null }, ...MAP_ACTIVE_WHERE },
      }),
      this.prisma.auctionHistory.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          auction: { select: { id: true, title: true, state: true } },
        },
      }),
      this.prisma.auction.findMany({
        where: MAP_ACTIVE_WHERE,
        select: {
          title: true,
          description: true,
          category: { select: { slug: true, name: true } },
        },
      }),
    ]);

    const vehicleCountBySlug = new Map<string, number>();
    for (const slug of VEHICLE_FOCUS_CATEGORY_SLUGS) {
      vehicleCountBySlug.set(slug, 0);
    }
    for (const row of activeForVehicleKpi) {
      const slug = inferVehicleCategorySlug(
        row.title,
        row.description,
        row.category?.slug,
      );
      if (slug) {
        vehicleCountBySlug.set(slug, (vehicleCountBySlug.get(slug) ?? 0) + 1);
      }
    }

    const categories = await this.prisma.auctionCategory.findMany({
      where: { slug: { in: [...VEHICLE_FOCUS_CATEGORY_SLUGS] } },
    });
    const nameBySlug = new Map(categories.map((c) => [c.slug, c.name]));

    const byCategory = VEHICLE_FOCUS_CATEGORY_SLUGS.map((slug) => ({
      slug,
      name: nameBySlug.get(slug) ?? slug,
      count: vehicleCountBySlug.get(slug) ?? 0,
    }));

    const regionCounts = new Map<string, number>();
    for (const row of byStateRaw) {
      if (!row.state) continue;
      const region = STATE_REGIONS[row.state];
      regionCounts.set(region, (regionCounts.get(region) ?? 0) + row._count._all);
    }

    return {
      totalOpportunities,
      verified,
      inAnalysis,
      highRisk,
      newLast24h,
      endingSoon,
      totalLots,
      statesMonitored: statesWithData.length,
      sourcesConsulted,
      lastCoverageAt: lastCoverage?.finishedAt?.toISOString() ?? null,
      byCategory,
      byRegion: Array.from(regionCounts.entries()).map(([region, count]) => ({
        region,
        count,
      })),
      recentUpdates: recentUpdates.map((u) => ({
        id: u.id,
        eventType: u.eventType,
        reason: u.reason,
        createdAt: u.createdAt.toISOString(),
        auction: u.auction,
      })),
      coverageNote:
        lastCoverage == null
          ? 'Nenhuma rodada concluída ainda. Em Admin → Coletas use “Iniciar coleta” (ou aguarde o cron horário). Exige Tavily ativo.'
          : null,
    };
  }

  async coverage() {
    const rows = await this.prisma.stateCoverage.findMany({
      orderBy: { state: 'asc' },
    });
    const searched = rows.filter((r) => r.lastSearchedAt != null).length;
    return {
      totalStates: 27,
      statesSearched: searched,
      isNationalCoverageComplete: searched === 27,
      states: rows.map((r) => ({
        code: r.state,
        name: r.name,
        region: r.region,
        lastSearchedAt: r.lastSearchedAt?.toISOString() ?? null,
        categoriesCovered: r.categoriesCovered,
        sourcesConsulted: r.sourcesConsulted,
        opportunitiesFound: r.opportunitiesFound,
        successCount: r.successCount,
        failureCount: r.failureCount,
      })),
    };
  }
}
