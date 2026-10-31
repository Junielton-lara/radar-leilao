import { z } from 'zod';
import {
  AuctionType,
  BrazilianState,
  UserRole,
  VerificationStatus,
} from './enums';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const bboxQuerySchema = z.object({
  minLng: z.coerce.number().min(-180).max(180),
  minLat: z.coerce.number().min(-90).max(90),
  maxLng: z.coerce.number().min(-180).max(180),
  maxLat: z.coerce.number().min(-90).max(90),
  zoom: z.coerce.number().min(1).max(22).optional(),
  categoryIds: z.string().optional(),
  states: z.string().optional(),
  status: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional().default(200),
});
export type BboxQuery = z.infer<typeof bboxQuerySchema>;

export const auctionListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  q: z.string().max(200).optional(),
  state: z.nativeEnum(BrazilianState).optional(),
  categoryId: z.string().uuid().optional(),
  status: z.nativeEnum(VerificationStatus).optional(),
  auctionType: z.nativeEnum(AuctionType).optional(),
  sort: z
    .enum([
      'recent',
      'min_bid_asc',
      'appraisal_desc',
      'ending_soon',
      'confidence_desc',
    ])
    .optional()
    .default('recent'),
});
export type AuctionListQuery = z.infer<typeof auctionListQuerySchema>;

export const userRoleSchema = z.nativeEnum(UserRole);
