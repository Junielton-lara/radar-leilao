import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { normalizeCanonicalUrl } from '../common/utils/url-safety.util';
import { PrismaService } from '../prisma/prisma.service';
import { NormalizedAuctionCandidate } from './adapters/source-adapter.interface';

export type DedupeMatch = {
  auctionId: string;
  matchType: 'canonical_url' | 'organizer_procedure';
  score: number;
};

/** Similarity helpers + DB lookups. Never deletes auctions; links duplicates. */
@Injectable()
export class DedupeService {
  constructor(private readonly prisma: PrismaService) {}

  static normalizeText(s: string): string {
    return s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  static tokenSetRatio(a: string, b: string): number {
    const ta = new Set(DedupeService.normalizeText(a).split(/\s+/).filter(Boolean));
    const tb = new Set(DedupeService.normalizeText(b).split(/\s+/).filter(Boolean));
    if (!ta.size || !tb.size) return 0;
    let inter = 0;
    for (const t of ta) if (tb.has(t)) inter += 1;
    return (2 * inter) / (ta.size + tb.size);
  }

  static organizerProcedureScore(
    a: { organizerName?: string | null; procedureRef?: string | null; title: string },
    b: { organizerName?: string | null; procedureRef?: string | null; title: string },
  ): number {
    if (a.procedureRef && b.procedureRef) {
      const pa = DedupeService.normalizeText(a.procedureRef);
      const pb = DedupeService.normalizeText(b.procedureRef);
      if (pa && pa === pb) {
        const orgScore =
          a.organizerName && b.organizerName
            ? DedupeService.tokenSetRatio(a.organizerName, b.organizerName)
            : 0.5;
        return Math.min(1, 0.7 + 0.3 * orgScore);
      }
    }
    if (a.organizerName && b.organizerName) {
      const org = DedupeService.tokenSetRatio(a.organizerName, b.organizerName);
      const title = DedupeService.tokenSetRatio(a.title, b.title);
      return org * 0.6 + title * 0.4;
    }
    return DedupeService.tokenSetRatio(a.title, b.title);
  }

  async findMatches(candidate: NormalizedAuctionCandidate): Promise<DedupeMatch[]> {
    const matches: DedupeMatch[] = [];
    const canonical = normalizeCanonicalUrl(candidate.canonicalUrl);

    const byUrl = await this.prisma.auction.findFirst({
      where: {
        OR: [{ canonicalUrl: canonical }, { originalUrl: candidate.originalUrl }],
      },
      select: { id: true },
    });
    if (byUrl) {
      matches.push({ auctionId: byUrl.id, matchType: 'canonical_url', score: 1 });
      return matches;
    }

    if (candidate.organizerName || candidate.procedureRef) {
      const recent = await this.prisma.auction.findMany({
        where: {
          ...(candidate.state ? { state: candidate.state } : {}),
          organizer: candidate.organizerName
            ? { name: { contains: candidate.organizerName.slice(0, 40), mode: 'insensitive' } }
            : undefined,
        },
        take: 25,
        include: { organizer: true },
        orderBy: { createdAt: 'desc' },
      });

      for (const row of recent) {
        const score = DedupeService.organizerProcedureScore(
          {
            organizerName: candidate.organizerName,
            procedureRef: candidate.procedureRef,
            title: candidate.title,
          },
          {
            organizerName: row.organizer?.name,
            procedureRef: row.externalId,
            title: row.title,
          },
        );
        if (score >= 0.85) {
          matches.push({
            auctionId: row.id,
            matchType: 'organizer_procedure',
            score: Math.round(score * 100) / 100,
          });
        }
      }
    }

    return matches;
  }

  async linkDuplicate(
    primaryAuctionId: string,
    duplicateAuctionId: string,
    match: Omit<DedupeMatch, 'auctionId'>,
  ) {
    if (primaryAuctionId === duplicateAuctionId) return null;
    return this.prisma.auctionDuplicateLink.upsert({
      where: {
        primaryAuctionId_duplicateAuctionId: {
          primaryAuctionId,
          duplicateAuctionId,
        },
      },
      create: {
        primaryAuctionId,
        duplicateAuctionId,
        matchType: match.matchType,
        score: match.score,
        evidenceJson: { match } as Prisma.InputJsonValue,
      },
      update: {
        matchType: match.matchType,
        score: match.score,
      },
    });
  }
}
