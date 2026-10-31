import { Injectable } from '@nestjs/common';
import { VerificationStatus } from '@prisma/client';
import { STATE_REGIONS } from '@lancex/shared';
import { PrismaService } from '../prisma/prisma.service';

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
      byCategoryRaw,
      byStateRaw,
      recentUpdates,
    ] = await Promise.all([
      this.prisma.auction.count(),
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
        by: ['categoryId'],
        _count: { _all: true },
      }),
      this.prisma.auction.groupBy({
        by: ['state'],
        _count: { _all: true },
        where: { state: { not: null } },
      }),
      this.prisma.auctionHistory.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          auction: { select: { id: true, title: true, state: true } },
        },
      }),
    ]);

    const categories = await this.prisma.auctionCategory.findMany();
    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    const byCategory = byCategoryRaw
      .filter((row) => row.categoryId)
      .map((row) => {
        const cat = categoryMap.get(row.categoryId!);
        return {
          slug: cat?.slug ?? 'unknown',
          name: cat?.name ?? 'Sem categoria',
          count: row._count._all,
        };
      })
      .sort((a, b) => b.count - a.count);

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
