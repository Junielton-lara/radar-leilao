import { Injectable, NotFoundException } from '@nestjs/common';
import {
  BrazilianState,
  Prisma,
  VerificationStatus,
} from '@prisma/client';
import {
  VEHICLE_FOCUS_CATEGORY_SLUGS,
  inferVehicleCategorySlug,
} from '@lancex/shared';
import { PrismaService } from '../prisma/prisma.service';
import { resolveMapCoordinates } from '../common/geo/state-centroids';
import { BboxQueryDto } from './dto/bbox-query.dto';
import { AuctionListQueryDto } from './dto/list-query.dto';

const AUTO_FOCUS_CATEGORY_SLUGS = VEHICLE_FOCUS_CATEGORY_SLUGS;

@Injectable()
export class AuctionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findInBbox(query: BboxQueryDto) {
    const limit = query.limit ?? 200;
    const categoryIds = query.categoryIds
      ?.split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const states = query.states
      ?.split(',')
      .map((s) => s.trim())
      .filter(Boolean) as BrazilianState[] | undefined;
    const statuses = query.status
      ?.split(',')
      .map((s) => s.trim())
      .filter(Boolean) as VerificationStatus[] | undefined;

    const where: Prisma.AuctionWhereInput = {
      state: { not: null },
      verificationStatus: {
        notIn: [VerificationStatus.ENCERRADO, VerificationStatus.CANCELADO],
      },
    };

    if (states?.length) {
      where.state = { in: states };
    }
    if (statuses?.length) {
      where.verificationStatus = { in: statuses };
    }

    const rows = await this.prisma.auction.findMany({
      where,
      take: limit * 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        category: { select: { slug: true, name: true } },
        organizer: { select: { name: true } },
        _count: { select: { lots: true } },
      },
    });

    let allowedSlugs: Set<string> | null = null;
    if (categoryIds?.length) {
      const cats = await this.prisma.auctionCategory.findMany({
        where: { id: { in: categoryIds } },
        select: { slug: true },
      });
      allowedSlugs = new Set(cats.map((c) => c.slug));
    }

    const markers = [];
    for (const r of rows) {
      const effectiveSlug = inferVehicleCategorySlug(
        r.title,
        r.description,
        r.category?.slug,
      );
      if (allowedSlugs?.size) {
        if (!effectiveSlug || !allowedSlugs.has(effectiveSlug)) continue;
      }
      const coords = resolveMapCoordinates(
        r.state,
        r.id,
        r.latitude != null ? Number(r.latitude) : null,
        r.longitude != null ? Number(r.longitude) : null,
      );
      if (!coords) continue;
      if (
        coords.latitude < query.minLat ||
        coords.latitude > query.maxLat ||
        coords.longitude < query.minLng ||
        coords.longitude > query.maxLng
      ) {
        continue;
      }
      markers.push({
        id: r.id,
        title: r.title,
        latitude: coords.latitude,
        longitude: coords.longitude,
        approximate: coords.approximate,
        categorySlug: effectiveSlug ?? r.category?.slug ?? null,
        categoryName: r.category?.name ?? null,
        verificationStatus: r.verificationStatus,
        minimumBid: r.minimumBid?.toString() ?? null,
        appraisalValue: r.appraisalValue?.toString() ?? null,
        auctionType: r.auctionType,
        organizerName: r.organizer?.name ?? null,
        lotCount: r._count.lots,
        descriptionSnippet: r.description
          ? r.description.replace(/\s+/g, ' ').trim().slice(0, 220)
          : null,
        originalUrl: r.originalUrl,
        state: r.state,
        city: r.city,
        endDate: r.endDate?.toISOString() ?? null,
      });
      if (markers.length >= limit) break;
    }

    return markers;
  }

  async list(query: AuctionListQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.AuctionWhereInput = {};

    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
        { city: { contains: query.q, mode: 'insensitive' } },
      ];
    }
    if (query.state) where.state = query.state;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.status) where.verificationStatus = query.status;
    if (query.auctionType) where.auctionType = query.auctionType;

    const orderBy: Prisma.AuctionOrderByWithRelationInput = (() => {
      switch (query.sort) {
        case 'min_bid_asc':
          return { minimumBid: 'asc' };
        case 'appraisal_desc':
          return { appraisalValue: 'desc' };
        case 'ending_soon':
          return { endDate: 'asc' };
        case 'confidence_desc':
          return { confidenceScore: 'desc' };
        default:
          return { createdAt: 'desc' };
      }
    })();

    const [total, items] = await this.prisma.$transaction([
      this.prisma.auction.count({ where }),
      this.prisma.auction.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          organizer: { select: { id: true, name: true } },
        },
      }),
    ]);

    return {
      items: items.map((a) => this.toSummary(a)),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async findById(id: string) {
    const auction = await this.prisma.auction.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        organizer: { select: { id: true, name: true } },
        auctioneer: {
          select: { id: true, name: true, registrationNumber: true },
        },
        source: { select: { id: true, name: true } },
        lots: {
          orderBy: { lotNumber: 'asc' },
          select: {
            id: true,
            lotNumber: true,
            title: true,
            description: true,
            appraisalValue: true,
            minimumBid: true,
            status: true,
          },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            documentType: true,
            title: true,
            originalUrl: true,
            publicationDate: true,
            createdAt: true,
          },
        },
        history: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        aiAnalyses: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        evidences: {
          orderBy: { collectedAt: 'desc' },
          take: 50,
        },
      },
    });
    if (!auction) {
      throw new NotFoundException('Oportunidade não encontrada');
    }
    return {
      ...this.toSummary(auction),
      description: auction.description,
      address: auction.address,
      latitude: auction.latitude != null ? Number(auction.latitude) : null,
      longitude: auction.longitude != null ? Number(auction.longitude) : null,
      commissionPercentage: auction.commissionPercentage?.toString() ?? null,
      originalUrl: auction.originalUrl,
      firstSeenAt: auction.firstSeenAt.toISOString(),
      createdAt: auction.createdAt.toISOString(),
      updatedAt: auction.updatedAt.toISOString(),
      auctioneer: auction.auctioneer,
      source: auction.source,
      lots: auction.lots.map((lot) => ({
        id: lot.id,
        lotNumber: lot.lotNumber,
        title: lot.title,
        description: lot.description,
        appraisalValue: lot.appraisalValue?.toString() ?? null,
        minimumBid: lot.minimumBid?.toString() ?? null,
        status: lot.status,
      })),
      documents: auction.documents.map((d) => ({
        ...d,
        publicationDate: d.publicationDate?.toISOString() ?? null,
        createdAt: d.createdAt.toISOString(),
      })),
      history: auction.history.map((h) => ({
        id: h.id,
        eventType: h.eventType,
        fromStatus: h.fromStatus,
        toStatus: h.toStatus,
        reason: h.reason,
        actor: h.actor,
        createdAt: h.createdAt.toISOString(),
      })),
      aiAnalyses: auction.aiAnalyses.map((a) => ({
        id: a.id,
        model: a.model,
        analysisType: a.analysisType,
        resultJson: a.resultJson,
        confidenceScore:
          a.confidenceScore != null ? Number(a.confidenceScore) : null,
        createdAt: a.createdAt.toISOString(),
      })),
      evidences: auction.evidences.map((e) => ({
        id: e.id,
        evidenceType: e.evidenceType,
        sourceUrl: e.sourceUrl,
        evidenceDescription: e.evidenceDescription,
        evidenceStatus: e.evidenceStatus,
        collectedAt: e.collectedAt.toISOString(),
      })),
    };
  }

  async featured(limit = 5) {
    const statusWhere = {
      verificationStatus: {
        in: [
          VerificationStatus.VERIFICADO,
          VerificationStatus.EM_ANALISE,
        ] as VerificationStatus[],
      },
    };
    const include = {
      category: { select: { id: true, name: true, slug: true } },
      organizer: { select: { id: true, name: true } },
    };
    const priority = await this.prisma.auction.findMany({
      where: {
        ...statusWhere,
        category: { slug: { in: [...AUTO_FOCUS_CATEGORY_SLUGS] } },
      },
      orderBy: [{ endDate: 'asc' }, { updatedAt: 'desc' }],
      take: limit,
      include,
    });
    let primary = priority;
    if (priority.length < limit) {
      const more = await this.prisma.auction.findMany({
        where: {
          ...statusWhere,
          id: { notIn: priority.map((p) => p.id) },
        },
        orderBy: [{ endDate: 'asc' }, { updatedAt: 'desc' }],
        take: limit - priority.length,
        include,
      });
      primary = [...priority, ...more];
    }
    if (primary.length >= limit) {
      return primary.map((a) => this.toSummary(a));
    }
    const rest = await this.prisma.auction.findMany({
      where: {
        verificationStatus: VerificationStatus.NAO_CONFIRMADO,
        id: { notIn: primary.map((p) => p.id) },
        category: { slug: { in: [...AUTO_FOCUS_CATEGORY_SLUGS] } },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit - primary.length,
      include,
    });
    return [...primary, ...rest].map((a) => this.toSummary(a));
  }

  async endingSoon(limit = 8) {
    const now = new Date();
    const activeStatus = {
      notIn: [VerificationStatus.CANCELADO, VerificationStatus.ENCERRADO],
    };
    const include = {
      category: { select: { id: true, name: true, slug: true } },
      organizer: { select: { id: true, name: true } },
    };
    const withDate = await this.prisma.auction.findMany({
      where: {
        endDate: { gt: now },
        verificationStatus: activeStatus,
        category: { slug: { in: [...AUTO_FOCUS_CATEGORY_SLUGS] } },
      },
      orderBy: { endDate: 'asc' },
      take: limit,
      include,
    });
    let rows = withDate;
    if (withDate.length < limit) {
      const more = await this.prisma.auction.findMany({
        where: {
          endDate: { gt: now },
          verificationStatus: activeStatus,
          id: { notIn: withDate.map((w) => w.id) },
        },
        orderBy: { endDate: 'asc' },
        take: limit - withDate.length,
        include,
      });
      rows = [...withDate, ...more];
    }
    if (rows.length >= limit) {
      return rows.map((a) => this.toSummary(a));
    }
    const rest = await this.prisma.auction.findMany({
      where: {
        endDate: null,
        verificationStatus: activeStatus,
        category: { slug: { in: [...AUTO_FOCUS_CATEGORY_SLUGS] } },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit - rows.length,
      include,
    });
    return [...rows, ...rest].map((a) => this.toSummary(a));
  }

  /** Preenche lat/lng aproximados por UF para mapa (idempotente). */
  async backfillApproximateCoordinates(limit = 500) {
    const rows = await this.prisma.auction.findMany({
      where: { latitude: null, state: { not: null } },
      select: { id: true, state: true },
      take: limit,
    });
    let updated = 0;
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
      updated += 1;
    }
    return { scanned: rows.length, updated };
  }

  /**
   * Persiste categoryId veicular (5 slugs) a partir de título/descrição — idempotente.
   */
  async reclassifyVehicleCategories(limit = 5000) {
    const categories = await this.prisma.auctionCategory.findMany({
      where: { slug: { in: [...VEHICLE_FOCUS_CATEGORY_SLUGS] } },
      select: { id: true, slug: true },
    });
    const idBySlug = new Map(categories.map((c) => [c.slug, c.id]));

    const rows = await this.prisma.auction.findMany({
      take: limit,
      orderBy: { updatedAt: 'desc' },
      where: {
        verificationStatus: {
          notIn: [VerificationStatus.ENCERRADO, VerificationStatus.CANCELADO],
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        categoryId: true,
        category: { select: { slug: true } },
      },
    });

    let updated = 0;
    let unchanged = 0;
    let skipped = 0;
    const assignedBySlug: Record<string, number> = {};

    for (const row of rows) {
      const inferred = inferVehicleCategorySlug(
        row.title,
        row.description,
        row.category?.slug,
      );
      if (!inferred) {
        skipped += 1;
        continue;
      }
      const targetId = idBySlug.get(inferred);
      if (!targetId) {
        skipped += 1;
        continue;
      }
      if (row.categoryId === targetId) {
        unchanged += 1;
        continue;
      }
      await this.prisma.auction.update({
        where: { id: row.id },
        data: { categoryId: targetId },
      });
      updated += 1;
      assignedBySlug[inferred] = (assignedBySlug[inferred] ?? 0) + 1;
    }

    return {
      scanned: rows.length,
      updated,
      unchanged,
      skipped,
      assignedBySlug,
    };
  }

  private toSummary(auction: {
    id: string;
    title: string;
    slug: string;
    auctionType: unknown;
    verificationStatus: VerificationStatus;
    confidenceScore: Prisma.Decimal | null;
    state: BrazilianState | null;
    city: string | null;
    appraisalValue: Prisma.Decimal | null;
    minimumBid: Prisma.Decimal | null;
    publicationDate: Date | null;
    startDate: Date | null;
    endDate: Date | null;
    lastCheckedAt: Date | null;
    category: { id: string; name: string; slug: string } | null;
    organizer: { id: string; name: string } | null;
  }) {
    return {
      id: auction.id,
      title: auction.title,
      slug: auction.slug,
      auctionType: auction.auctionType,
      verificationStatus: auction.verificationStatus,
      confidenceScore:
        auction.confidenceScore != null
          ? Number(auction.confidenceScore)
          : null,
      state: auction.state,
      city: auction.city,
      appraisalValue: auction.appraisalValue?.toString() ?? null,
      minimumBid: auction.minimumBid?.toString() ?? null,
      publicationDate: auction.publicationDate?.toISOString() ?? null,
      startDate: auction.startDate?.toISOString() ?? null,
      endDate: auction.endDate?.toISOString() ?? null,
      lastCheckedAt: auction.lastCheckedAt?.toISOString() ?? null,
      category: auction.category,
      organizer: auction.organizer,
    };
  }
}
