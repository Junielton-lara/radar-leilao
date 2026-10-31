import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JobsService } from '../jobs/jobs.service';
import { TavilyService } from '../tavily/tavily.service';
import { AiEngineService } from '../ai-engine/ai-engine.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jobs: JobsService,
    private readonly tavily: TavilyService,
    private readonly ai: AiEngineService,
  ) {}

  async dashboard() {
    const [
      byStatus,
      sources,
      ufs,
      lastSearches,
      failures,
      tavilyStatus,
      aiStatus,
      jobStats,
      tavilyUsageMonth,
      aiUsageMonth,
    ] = await Promise.all([
      this.prisma.auction.groupBy({
        by: ['verificationStatus'],
        _count: { _all: true },
      }),
      this.prisma.source.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          sourceType: true,
          status: true,
          lastRunAt: true,
          successRate: true,
        },
        orderBy: { priority: 'desc' },
        take: 50,
      }),
      this.prisma.stateCoverage.findMany({
        orderBy: { state: 'asc' },
      }),
      this.prisma.searchRun.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.sourceCheck.findMany({
        where: { status: { in: ['error', 'not_ready'] } },
        orderBy: { checkedAt: 'desc' },
        take: 20,
      }),
      this.tavily.getStatus(),
      this.ai.getStatus(),
      this.jobs.getStats(),
      this.monthUsage('tavily'),
      this.monthUsage('ai'),
    ]);

    return {
      opportunitiesByStatus: Object.fromEntries(
        byStatus.map((r) => [r.verificationStatus, r._count._all]),
      ),
      sources,
      ufs: ufs.map((u) => ({
        state: u.state,
        name: u.name,
        lastSearchedAt: u.lastSearchedAt,
        opportunitiesFound: u.opportunitiesFound,
        successCount: u.successCount,
        failureCount: u.failureCount,
      })),
      lastSearches,
      failures,
      tavily: {
        ...tavilyStatus,
        monthCredits: tavilyUsageMonth.credits,
      },
      ai: {
        ...aiStatus,
        monthTokens: aiUsageMonth.tokens,
        monthEstimatedCost: aiUsageMonth.cost,
        // never expose keys
      },
      pendingJobs: jobStats,
    };
  }

  private async monthUsage(provider: string) {
    const now = new Date();
    const monthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const agg = await this.prisma.integrationUsageLog.aggregate({
      where: {
        provider,
        success: true,
        createdAt: { gte: monthStart },
      },
      _sum: {
        creditsEstimated: true,
        tokensUsed: true,
        estimatedCost: true,
      },
    });
    return {
      credits: agg._sum.creditsEstimated ?? 0,
      tokens: agg._sum.tokensUsed ?? 0,
      cost: Number(agg._sum.estimatedCost ?? 0),
    };
  }
}
