import { Injectable, Logger } from '@nestjs/common';
import { Prisma, VerificationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  LANCEX_DISCOVERY_SCHEDULE_BRT,
  LANCEX_INTELLIGENCE_SYSTEM_PROMPT,
  LANCEX_MAP_COLOR_LEGEND,
} from './lancex-intelligence.prompt';

export interface IntelligenceMetrics {
  verified: number;
  inAnalysis: number;
  highRisk: number;
  notConfirmed: number;
  activeOpportunities: number;
  alertsCount: number;
  statesWithData: number;
  sourcesActive: number;
  lastSearchRunAt: string | null;
}

export interface IntelligenceHighlightItem {
  auctionId: string;
  title: string;
  status: VerificationStatus;
  state: string | null;
  categoryName: string | null;
  minimumBid: string | null;
  endDate: string | null;
  originalUrl: string | null;
  summary: string;
}

@Injectable()
export class IntelligenceService {
  private readonly logger = new Logger(IntelligenceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getSystemPrompt(): Promise<string> {
    const row = await this.prisma.systemSetting.findUnique({
      where: { key: 'intelligence.system_prompt' },
    });
    if (row?.valueJson && typeof row.valueJson === 'object') {
      const v = row.valueJson as { text?: string };
      if (v.text?.trim()) return v.text.trim();
    }
    return LANCEX_INTELLIGENCE_SYSTEM_PROMPT;
  }

  meta() {
    return {
      scheduleBrt: [...LANCEX_DISCOVERY_SCHEDULE_BRT],
      mapLegend: [...LANCEX_MAP_COLOR_LEGEND],
      radarPrimaryStatuses: [VerificationStatus.VERIFICADO],
      disclaimer:
        'VERIFICADO significa procedimento e informações essenciais em fonte oficial — não garante lucro, vistoria de todos os lotes ou custo total calculado.',
    };
  }

  async latest() {
    const row = await this.prisma.intelligenceBriefing.findFirst({
      orderBy: { cutOffAt: 'desc' },
    });
    if (!row) {
      const metrics = await this.collectMetrics();
      const highlights = await this.collectHighlights();
      const limitations = await this.collectLimitations();
      const cutOffAt = new Date();
      return {
        id: 'pending',
        title: 'LanceX Intelligence — Radar nacional',
        cutOffAt: cutOffAt.toISOString(),
        source: 'system',
        metrics,
        highlights,
        limitations,
        bodyMarkdown: this.renderBodyMarkdown(
          'LanceX Intelligence — Radar nacional',
          cutOffAt,
          metrics,
          highlights,
          limitations,
        ),
        narrativeMarkdown: null,
        mapLegend: [...LANCEX_MAP_COLOR_LEGEND],
        scheduleBrt: [...LANCEX_DISCOVERY_SCHEDULE_BRT],
        meta: this.meta(),
        createdAt: cutOffAt.toISOString(),
      };
    }
    return this.formatBriefing(row);
  }

  async createSnapshot(input?: {
    searchRunId?: string;
    source?: string;
    title?: string;
    narrativeMarkdown?: string;
  }) {
    const cutOffAt = new Date();
    const metrics = await this.collectMetrics();
    const highlights = await this.collectHighlights();
    const limitations = await this.collectLimitations();
    const title =
      input?.title ??
      `LanceX Intelligence — Rodada ${this.formatCutOffTitle(cutOffAt)}`;
    const bodyMarkdown = this.renderBodyMarkdown(
      title,
      cutOffAt,
      metrics,
      highlights,
      limitations,
    );

    return this.prisma.intelligenceBriefing.create({
      data: {
        title,
        cutOffAt,
        searchRunId: input?.searchRunId,
        source: input?.source ?? 'system',
        metricsJson: metrics as unknown as Prisma.InputJsonValue,
        highlightsJson: highlights as unknown as Prisma.InputJsonValue,
        limitationsJson: limitations as unknown as Prisma.InputJsonValue,
        bodyMarkdown,
        narrativeMarkdown: input?.narrativeMarkdown ?? null,
      },
    });
  }

  async importBriefing(input: {
    title: string;
    cutOffAt?: string;
    narrativeMarkdown: string;
  }) {
    const cutOffAt = input.cutOffAt ? new Date(input.cutOffAt) : new Date();
    const metrics = await this.collectMetrics();
    const highlights = await this.collectHighlights();
    const limitations = await this.collectLimitations();
    const bodyMarkdown = this.renderBodyMarkdown(
      input.title,
      cutOffAt,
      metrics,
      highlights,
      limitations,
      true,
    );
    return this.prisma.intelligenceBriefing.create({
      data: {
        title: input.title,
        cutOffAt,
        source: 'import',
        metricsJson: metrics as unknown as Prisma.InputJsonValue,
        highlightsJson: highlights as unknown as Prisma.InputJsonValue,
        limitationsJson: limitations as unknown as Prisma.InputJsonValue,
        bodyMarkdown,
        narrativeMarkdown: input.narrativeMarkdown,
      },
    });
  }

  async generateNarrative(briefingId: string) {
    const briefing = await this.prisma.intelligenceBriefing.findUnique({
      where: { id: briefingId },
    });
    if (!briefing) return null;
    const prompt = await this.getSystemPrompt();
    const facts = {
      cutOffAt: briefing.cutOffAt.toISOString(),
      metrics: briefing.metricsJson,
      highlights: briefing.highlightsJson,
      limitations: briefing.limitationsJson,
    };
    this.logger.log(
      `Narrative generation requested for ${briefingId} (configure IA para texto longo estilo rodada nacional).`,
    );
    const narrative = `${prompt.slice(0, 800)}\n\n---\n\n## Dados reais do banco LanceX (não inventar além disto)\n\n\`\`\`json\n${JSON.stringify(facts, null, 2).slice(0, 12000)}\n\`\`\`\n\nGere relatório em markdown no estilo "Rodada nacional", apenas com base no JSON acima.`;
    return this.prisma.intelligenceBriefing.update({
      where: { id: briefingId },
      data: { narrativeMarkdown: narrative },
    });
  }

  private formatBriefing(row: {
    id: string;
    title: string;
    cutOffAt: Date;
    source: string;
    metricsJson: unknown;
    highlightsJson: unknown;
    limitationsJson: unknown;
    bodyMarkdown: string | null;
    narrativeMarkdown: string | null;
    createdAt: Date;
  }) {
    return {
      id: row.id,
      title: row.title,
      cutOffAt: row.cutOffAt.toISOString(),
      source: row.source,
      metrics: row.metricsJson as IntelligenceMetrics,
      highlights: row.highlightsJson as {
        verified: IntelligenceHighlightItem[];
        inAnalysis: IntelligenceHighlightItem[];
        highRisk: IntelligenceHighlightItem[];
      },
      limitations: (row.limitationsJson as string[]) ?? [],
      bodyMarkdown: row.bodyMarkdown,
      narrativeMarkdown: row.narrativeMarkdown,
      mapLegend: [...LANCEX_MAP_COLOR_LEGEND],
      scheduleBrt: [...LANCEX_DISCOVERY_SCHEDULE_BRT],
      meta: this.meta(),
      createdAt: row.createdAt.toISOString(),
    };
  }

  private async collectMetrics(): Promise<IntelligenceMetrics> {
    const notClosed = {
      notIn: [
        VerificationStatus.ENCERRADO,
        VerificationStatus.CANCELADO,
      ] as VerificationStatus[],
    };
    const [
      verified,
      inAnalysis,
      highRisk,
      notConfirmed,
      activeOpportunities,
      statesWithData,
      sourcesActive,
      lastRun,
    ] = await Promise.all([
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
        where: { verificationStatus: VerificationStatus.NAO_CONFIRMADO },
      }),
      this.prisma.auction.count({
        where: { verificationStatus: { notIn: notClosed.notIn } },
      }),
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
    ]);

    return {
      verified,
      inAnalysis,
      highRisk,
      notConfirmed,
      activeOpportunities,
      alertsCount: highRisk,
      statesWithData: statesWithData.length,
      sourcesActive,
      lastSearchRunAt: lastRun?.finishedAt?.toISOString() ?? null,
    };
  }

  private async collectHighlights() {
    const baseInclude = {
      category: { select: { name: true } },
      organizer: { select: { name: true } },
    };
    const mapRow = (a: {
      id: string;
      title: string;
      verificationStatus: VerificationStatus;
      state: string | null;
      minimumBid: { toString(): string } | null;
      endDate: Date | null;
      originalUrl: string | null;
      description: string | null;
      category: { name: string } | null;
      organizer: { name: string } | null;
    }): IntelligenceHighlightItem => ({
      auctionId: a.id,
      title: a.title,
      status: a.verificationStatus,
      state: a.state,
      categoryName: a.category?.name ?? null,
      minimumBid: a.minimumBid?.toString() ?? null,
      endDate: a.endDate?.toISOString() ?? null,
      originalUrl: a.originalUrl,
      summary: [
        a.category?.name,
        a.organizer?.name,
        a.description?.replace(/\s+/g, ' ').trim().slice(0, 160),
      ]
        .filter(Boolean)
        .join(' · '),
    });

    const [verified, inAnalysis, highRisk] = await Promise.all([
      this.prisma.auction.findMany({
        where: { verificationStatus: VerificationStatus.VERIFICADO },
        orderBy: [{ endDate: 'asc' }, { updatedAt: 'desc' }],
        take: 8,
        include: baseInclude,
      }),
      this.prisma.auction.findMany({
        where: { verificationStatus: VerificationStatus.EM_ANALISE },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: baseInclude,
      }),
      this.prisma.auction.findMany({
        where: { verificationStatus: VerificationStatus.ALTO_RISCO },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: baseInclude,
      }),
    ]);

    return {
      verified: verified.map(mapRow),
      inAnalysis: inAnalysis.map(mapRow),
      highRisk: highRisk.map(mapRow),
    };
  }

  private async collectLimitations(): Promise<string[]> {
    const coverage = await this.prisma.stateCoverage.findMany({
      select: { state: true, lastSearchedAt: true },
    });
    const notSearched = coverage
      .filter((c) => !c.lastSearchedAt)
      .map((c) => c.state);
    const lines: string[] = [
      'Este painel combina dados reais do banco LanceX com relatórios importados (ex.: análise externa). Nunca exibe contadores fictícios.',
      'Coletas automáticas dependem de Tavily ativo e fontes cadastradas; editais completos exigem revisão humana ou importação de rodada.',
    ];
    if (notSearched.length > 0) {
      lines.push(
        `UFs ainda sem consulta registrada no catálogo: ${notSearched.join(', ')}.`,
      );
    }
    return lines;
  }

  private renderBodyMarkdown(
    title: string,
    cutOffAt: Date,
    metrics: IntelligenceMetrics,
    highlights: {
      verified: IntelligenceHighlightItem[];
      inAnalysis: IntelligenceHighlightItem[];
      highRisk: IntelligenceHighlightItem[];
    },
    limitations: string[],
    imported = false,
  ) {
    const br = this.formatBrasilia(cutOffAt);
    const lines: string[] = [
      `# ${title}`,
      ``,
      `Horário de corte: **${br}** · Brasília (UTC−3)`,
      imported
        ? `_Relatório enriquecido importado — métricas abaixo vêm do banco LanceX._`
        : `_Rodada gerada pelo LanceX a partir do banco e das coletas._`,
      ``,
      `## Resultado geral`,
      `- **${metrics.verified}** certames/oportunidades **VERIFICADO** (nível procedimento).`,
      `- **${metrics.inAnalysis}** candidatos **EM ANÁLISE**.`,
      `- **${metrics.highRisk}** alertas **ALTO RISCO**.`,
      `- **${metrics.notConfirmed}** registros **NÃO CONFIRMADO** aguardando revisão.`,
      `- Nenhuma margem de lucro ou retorno é considerada comprovada automaticamente.`,
      ``,
      `> ${this.meta().disclaimer}`,
      ``,
    ];

    if (highlights.verified.length) {
      lines.push(`## Oportunidades verificadas (amostra do banco)`);
      for (const h of highlights.verified) {
        lines.push(
          `- **${h.title}** (${h.state ?? 'UF?'}) — ${h.categoryName ?? 'sem categoria'}${h.minimumBid ? ` · mín. R$ ${h.minimumBid}` : ''}`,
        );
      }
      lines.push('');
    }

    if (highlights.highRisk.length) {
      lines.push(`## Alertas de alto risco`);
      for (const h of highlights.highRisk) {
        lines.push(`- **${h.title}** — ${h.summary || 'revisar edital'}`);
      }
      lines.push('');
    }

    lines.push(`## Cobertura e limitações`);
    for (const l of limitations) {
      lines.push(`- ${l}`);
    }
    lines.push(
      `- Fontes ativas: ${metrics.sourcesActive}. UFs com oportunidades no mapa: ${metrics.statesWithData}/27.`,
    );
    if (metrics.lastSearchRunAt) {
      lines.push(
        `- Última coleta concluída: ${this.formatBrasilia(new Date(metrics.lastSearchRunAt))}.`,
      );
    }

    return lines.join('\n');
  }

  private formatCutOffTitle(d: Date) {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  }

  private formatBrasilia(d: Date) {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  }
}
