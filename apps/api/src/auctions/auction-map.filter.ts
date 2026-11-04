import { Prisma, VerificationStatus } from '@prisma/client';
import {
  MAP_ONGOING_RECHECK_DAYS,
  MAP_RECENT_WITHOUT_END_DAYS,
} from '@lancex/shared';

function daysAgo(days: number, now: Date): Date {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  return d;
}

/** Oportunidades exibíveis no mapa — sem encerrados nem editais vencidos. */
export function buildMapAuctionWhere(now = new Date()): Prisma.AuctionWhereInput {
  const staleCutoff = daysAgo(MAP_RECENT_WITHOUT_END_DAYS, now);
  const ongoingCutoff = daysAgo(MAP_ONGOING_RECHECK_DAYS, now);

  return {
    verificationStatus: {
      notIn: [VerificationStatus.ENCERRADO, VerificationStatus.CANCELADO],
    },
    NOT: {
      AND: [{ endDate: { not: null } }, { endDate: { lte: now } }],
    },
    OR: [
      { endDate: { gt: now } },
      { endDate: null, startDate: { gt: now } },
      {
        endDate: null,
        startDate: null,
        lastCheckedAt: { gte: staleCutoff },
      },
      {
        endDate: null,
        startDate: { lte: now },
        lastCheckedAt: { gte: ongoingCutoff },
      },
    ],
  };
}
