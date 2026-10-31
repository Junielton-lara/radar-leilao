import { z } from 'zod';

/** Structured extraction output — null means unknown, never invent. */
export const auctionExtractionSchema = z.object({
  title: z.string().nullable(),
  auctionType: z.string().nullable(),
  category: z.string().nullable(),
  organizer: z.string().nullable(),
  auctioneer: z.string().nullable(),
  auctioneerRegistration: z.string().nullable(),
  state: z.string().nullable(),
  city: z.string().nullable(),
  address: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  publicationDate: z.string().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  appraisalValue: z.number().nullable(),
  minimumBid: z.number().nullable(),
  commissionPercentage: z.number().nullable(),
  lots: z
    .array(
      z.object({
        lotNumber: z.string().nullable(),
        title: z.string().nullable(),
        description: z.string().nullable(),
        appraisalValue: z.number().nullable(),
        minimumBid: z.number().nullable(),
      }),
    )
    .default([]),
  documents: z
    .array(
      z.object({
        documentType: z.string().nullable(),
        title: z.string().nullable(),
        url: z.string().nullable(),
      }),
    )
    .default([]),
  sourceUrls: z.array(z.string()).default([]),
  missingInformation: z.array(z.string()).default([]),
  riskIndicators: z.array(z.string()).default([]),
  isAuction: z.boolean(),
  confidence: z.number().min(0).max(1).nullable(),
  evidenceNotes: z.array(z.string()).default([]),
});

export type AuctionExtraction = z.infer<typeof auctionExtractionSchema>;

export const verificationSuggestionSchema = z.object({
  suggestedStatus: z.enum([
    'VERIFICADO',
    'EM_ANALISE',
    'NAO_CONFIRMADO',
    'ALTO_RISCO',
    'SUSPENSO',
    'CANCELADO',
    'ENCERRADO',
  ]),
  reasons: z.array(z.string()),
  evidenceIds: z.array(z.string()).default([]),
  blockers: z.array(z.string()).default([]),
});

export type VerificationSuggestion = z.infer<
  typeof verificationSuggestionSchema
>;
