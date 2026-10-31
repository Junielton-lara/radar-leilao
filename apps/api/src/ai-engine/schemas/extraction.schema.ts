import { z } from 'zod';

/** Only fields explicitly present in source text — null when unknown (never invent). */
export const AuctionExtractionSchema = z.object({
  isAuction: z.boolean(),
  title: z.string().nullable(),
  organizerName: z.string().nullable(),
  auctioneerName: z.string().nullable(),
  procedureRef: z.string().nullable(),
  state: z.string().nullable(),
  city: z.string().nullable(),
  address: z.string().nullable(),
  auctionType: z
    .enum(['JUDICIAL', 'EXTRAJUDICIAL', 'PUBLICO', 'PRIVADO'])
    .nullable(),
  appraisalValue: z.number().nullable(),
  minimumBid: z.number().nullable(),
  publicationDate: z.string().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  categoryGuess: z.string().nullable(),
  riskFlags: z.array(z.string()),
  evidenceQuotes: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  notes: z.string().nullable(),
});

export type AuctionExtraction = z.infer<typeof AuctionExtractionSchema>;

export const IdentificationSchema = z.object({
  isAuction: z.boolean(),
  confidence: z.number().min(0).max(1),
  reasons: z.array(z.string()),
});

export type IdentificationResult = z.infer<typeof IdentificationSchema>;
