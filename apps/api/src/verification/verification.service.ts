import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, VerificationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  applyVerificationRules,
  type EvidenceFlags,
} from './verification.rules';

@Injectable()
export class VerificationService {
  constructor(private readonly prisma: PrismaService) {}

  async evaluate(auctionId: string) {
    const auction = await this.prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        evidences: true,
        documents: true,
        organizer: true,
        auctioneer: true,
      },
    });
    if (!auction) throw new NotFoundException('Oportunidade não encontrada');

    const evidenceTypes = new Set(auction.evidences.map((e) => e.evidenceType));
    const riskFlags = auction.evidences
      .filter((e) => e.evidenceType.startsWith('risk_'))
      .map((e) => e.evidenceType.replace(/^risk_/, ''));

    const flags: EvidenceFlags = {
      hasOfficialSourceUrl: Boolean(auction.originalUrl),
      hasDocument: auction.documents.length > 0 || evidenceTypes.has('edital'),
      hasOrganizer: Boolean(auction.organizerId),
      hasAuctioneer: Boolean(
        auction.auctioneer?.registrationNumber && auction.auctioneer?.evidenceUrl,
      ),
      hasProcedureRef: evidenceTypes.has('procedure_ref'),
      hasDates: Boolean(auction.publicationDate || auction.startDate || auction.endDate),
      hasExplicitCancelOrSuspendSignal:
        evidenceTypes.has('cancellation') || evidenceTypes.has('suspension'),
      hasEndedSignal: Boolean(auction.endDate && auction.endDate < new Date()),
      riskFlags,
    };

    const result = applyVerificationRules(flags);
    if (result.status !== auction.verificationStatus) {
      await this.prisma.auction.update({
        where: { id: auctionId },
        data: { verificationStatus: result.status },
      });
      await this.prisma.auctionHistory.create({
        data: {
          auctionId,
          eventType: 'status_change',
          fromStatus: auction.verificationStatus,
          toStatus: result.status,
          reason: result.reasons.join('; '),
          actor: 'verification-rules',
          evidenceJson: {
            requiredEvidence: result.requiredEvidence,
            confidence: result.confidence,
            flags,
          } as Prisma.InputJsonValue,
        },
      });
    }

    return {
      auctionId,
      previous: auction.verificationStatus,
      ...result,
    };
  }

  async manualOverride(
    auctionId: string,
    status: VerificationStatus,
    reason: string,
    actorUserId: string,
  ) {
    const auction = await this.prisma.auction.findUnique({
      where: { id: auctionId },
    });
    if (!auction) throw new NotFoundException('Oportunidade não encontrada');

    await this.prisma.auction.update({
      where: { id: auctionId },
      data: { verificationStatus: status },
    });
    await this.prisma.auctionHistory.create({
      data: {
        auctionId,
        eventType: 'manual_review',
        fromStatus: auction.verificationStatus,
        toStatus: status,
        reason,
        actor: `user:${actorUserId}`,
      },
    });
    await this.prisma.auditLog.create({
      data: {
        userId: actorUserId,
        action: 'verification.manual_override',
        entityType: 'auction',
        entityId: auctionId,
        metaJson: { status, reason },
      },
    });
    return { ok: true, status };
  }

  history(auctionId: string) {
    return this.prisma.auctionHistory.findMany({
      where: { auctionId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
