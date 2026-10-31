import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiEngineService } from '../ai-engine/ai-engine.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiEngineService,
  ) {}

  async dailyExecutiveSummary(day = new Date()) {
    const start = new Date(day);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);

    const [
      auctionsCreated,
      byStatus,
      searchRuns,
      searchFailures,
      tavilyCredits,
      aiCost,
      sourcesActive,
      coverageTouched,
    ] = await Promise.all([
      this.prisma.auction.count({
        where: { createdAt: { gte: start, lt: end } },
      }),
      this.prisma.auction.groupBy({
        by: ['verificationStatus'],
        _count: { _all: true },
      }),
      this.prisma.searchRun.count({
        where: { createdAt: { gte: start, lt: end } },
      }),
      this.prisma.searchRun.count({
        where: {
          createdAt: { gte: start, lt: end },
          status: 'failed',
        },
      }),
      this.prisma.integrationUsageLog.aggregate({
        where: {
          provider: 'tavily',
          success: true,
          createdAt: { gte: start, lt: end },
        },
        _sum: { creditsEstimated: true },
      }),
      this.prisma.integrationUsageLog.aggregate({
        where: {
          provider: 'ai',
          success: true,
          createdAt: { gte: start, lt: end },
        },
        _sum: { estimatedCost: true, tokensUsed: true },
      }),
      this.prisma.source.count({ where: { status: 'active' } }),
      this.prisma.stateCoverage.count({
        where: { lastSearchedAt: { gte: start, lt: end } },
      }),
    ]);

    const counts = {
      day: start.toISOString().slice(0, 10),
      auctionsCreated,
      byStatus: Object.fromEntries(
        byStatus.map((r) => [r.verificationStatus, r._count._all]),
      ),
      searchRuns,
      searchFailures,
      tavilyCreditsUsed: tavilyCredits._sum.creditsEstimated ?? 0,
      aiTokensUsed: aiCost._sum.tokensUsed ?? 0,
      aiEstimatedCost: Number(aiCost._sum.estimatedCost ?? 0),
      sourcesActive,
      ufsSearchedToday: coverageTouched,
    };

    let narrative: string | null = null;
    const aiStatus = await this.ai.getStatus();
    if (aiStatus.configured) {
      narrative =
        `Resumo ${counts.day}: ${counts.auctionsCreated} novas oportunidades, ` +
        `${counts.searchRuns} buscas (${counts.searchFailures} falhas), ` +
        `${counts.ufsSearchedToday} UFs tocadas, créditos Tavily ${counts.tavilyCreditsUsed}.`;
      // Full LLM narrative only when configured — optional short call skipped to avoid spend in reports.
      // Callers can trigger AI separately; here we keep a deterministic narrative built from real counts.
    }

    return {
      ...counts,
      narrative,
      aiNarrativeAvailable: aiStatus.configured,
      note: aiStatus.configured
        ? 'Narrativa baseada em contagens reais do banco; LLM narrativo opcional não forçado neste endpoint para controlar custo.'
        : 'IA não configurada — apenas métricas reais do banco.',
    };
  }
}
