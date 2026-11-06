import {
  AuctionType,
  BrazilianState,
  Prisma,
  VerificationStatus,
} from '@prisma/client';
import type { AuctionExtraction } from '@lancex/shared';
import { inferVehicleCategorySlug } from '@lancex/shared';

const AUCTION_TYPES = new Set(Object.values(AuctionType));
const STATES = new Set(Object.values(BrazilianState));

export function parseFlexibleDate(
  value: string | null | undefined,
): Date | null {
  if (!value?.trim()) return null;
  const raw = value.trim();

  // Prefer BR day/month before Date.parse (US MM/DD ambiguity).
  const br = raw.match(
    /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::\d{2})?)?/,
  );
  if (br) {
    const day = Number(br[1]);
    const month = Number(br[2]) - 1;
    let year = Number(br[3]);
    if (year < 100) year += 2000;
    const hour = br[4] ? Number(br[4]) : 12;
    const minute = br[5] ? Number(br[5]) : 0;
    const d = new Date(year, month, day, hour, minute);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const iso = Date.parse(raw);
    if (!Number.isNaN(iso)) return new Date(iso);
  }
  return null;
}

export function mapAuctionType(
  value: string | null | undefined,
): AuctionType | undefined {
  if (!value) return undefined;
  const normalized = value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toUpperCase()
    .replace(/\s+/g, '_');
  if (AUCTION_TYPES.has(normalized as AuctionType)) {
    return normalized as AuctionType;
  }
  if (/JUDIC/.test(normalized)) return AuctionType.JUDICIAL;
  if (/EXTRA/.test(normalized)) return AuctionType.EXTRAJUDICIAL;
  if (/PUBLIC|GOVERNO|PNCP|RECEITA|DETRAN|PRF/.test(normalized)) {
    return AuctionType.PUBLICO;
  }
  if (/PRIVAD|PARTICULAR|LEILOEIR/.test(normalized)) {
    return AuctionType.PRIVADO;
  }
  return undefined;
}

export function mapState(
  value: string | null | undefined,
): BrazilianState | undefined {
  if (!value) return undefined;
  const uf = value.trim().toUpperCase().slice(0, 2);
  if (STATES.has(uf as BrazilianState)) return uf as BrazilianState;
  return undefined;
}

export function buildAuctionUpdateFromExtraction(
  extraction: AuctionExtraction,
  current: {
    title: string;
    description: string | null;
    categorySlug?: string | null;
  },
): Prisma.AuctionUpdateInput {
  const data: Prisma.AuctionUpdateInput = {
    lastCheckedAt: new Date(),
  };

  const title = extraction.title?.trim();
  if (title && title.length >= 12) {
    const generic =
      /edital padr[aã]o|portal nacional|pncp|sem t[ií]tulo/i.test(
        current.title,
      );
    if (generic || title.length > current.title.length) {
      data.title = title.slice(0, 280);
    }
  }

  const publicationDate = parseFlexibleDate(extraction.publicationDate);
  const startDate = parseFlexibleDate(extraction.startDate);
  const endDate = parseFlexibleDate(extraction.endDate);
  if (publicationDate) data.publicationDate = publicationDate;
  if (startDate) data.startDate = startDate;
  if (endDate) data.endDate = endDate;

  if (extraction.minimumBid != null && extraction.minimumBid >= 0) {
    data.minimumBid = extraction.minimumBid;
  } else if (extraction.lots?.length) {
    const mins = extraction.lots
      .map((l) => l.minimumBid)
      .filter((n): n is number => n != null && n >= 0);
    if (mins.length) data.minimumBid = Math.min(...mins);
  }

  if (extraction.appraisalValue != null && extraction.appraisalValue >= 0) {
    data.appraisalValue = extraction.appraisalValue;
  }
  if (
    extraction.commissionPercentage != null &&
    extraction.commissionPercentage >= 0
  ) {
    data.commissionPercentage = extraction.commissionPercentage;
  }

  const auctionType = mapAuctionType(extraction.auctionType);
  if (auctionType) data.auctionType = auctionType;

  const state = mapState(extraction.state);
  if (state) data.state = state;
  if (extraction.city?.trim()) data.city = extraction.city.trim().slice(0, 120);
  if (extraction.address?.trim()) {
    data.address = extraction.address.trim().slice(0, 400);
  }
  if (extraction.latitude != null && extraction.longitude != null) {
    data.latitude = extraction.latitude;
    data.longitude = extraction.longitude;
  }

  if (extraction.confidence != null) {
    data.confidenceScore = extraction.confidence;
  }

  const notes = [
    ...(extraction.evidenceNotes ?? []),
    ...(extraction.missingInformation?.length
      ? [`Pendências: ${extraction.missingInformation.join('; ')}`]
      : []),
    ...(extraction.riskIndicators?.length
      ? [`Riscos: ${extraction.riskIndicators.join('; ')}`]
      : []),
  ]
    .filter(Boolean)
    .join('\n');
  if (notes && (!current.description || current.description.length < 80)) {
    data.description = notes.slice(0, 4000);
  }

  // AI alone never sets VERIFICADO — bump to EM_ANALISE when structured fields appear
  const hasStructure =
    Boolean(endDate || startDate || publicationDate) ||
    extraction.minimumBid != null ||
    (extraction.lots?.length ?? 0) > 0;
  if (hasStructure && extraction.isAuction) {
    data.verificationStatus = VerificationStatus.EM_ANALISE;
  }

  return data;
}

export function resolveExtractionCategorySlug(
  extraction: AuctionExtraction,
  current: { title: string; description: string | null; categorySlug?: string | null },
): string | null {
  return (
    inferVehicleCategorySlug(
      extraction.title ?? current.title,
      extraction.evidenceNotes?.join(' ') || current.description,
      extraction.category ?? current.categorySlug,
    ) ?? null
  );
}

export function lotCreatesFromExtraction(
  extraction: AuctionExtraction,
): Prisma.AuctionLotCreateWithoutAuctionInput[] {
  return (extraction.lots ?? [])
    .filter((lot) => lot.title?.trim() || lot.lotNumber?.trim())
    .slice(0, 80)
    .map((lot) => ({
      lotNumber: lot.lotNumber?.trim() || null,
      title: (lot.title?.trim() || `Lote ${lot.lotNumber ?? '?'}`).slice(0, 280),
      description: lot.description?.trim()?.slice(0, 2000) || null,
      appraisalValue: lot.appraisalValue ?? null,
      minimumBid: lot.minimumBid ?? null,
      status: 'extracted',
    }));
}
