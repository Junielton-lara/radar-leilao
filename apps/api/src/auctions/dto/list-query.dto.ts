import { ApiPropertyOptional } from '@nestjs/swagger';
import { AuctionType, BrazilianState, VerificationStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class AuctionListQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: BrazilianState })
  @IsOptional()
  @IsEnum(BrazilianState)
  state?: BrazilianState;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ enum: VerificationStatus })
  @IsOptional()
  @IsEnum(VerificationStatus)
  status?: VerificationStatus;

  @ApiPropertyOptional({ enum: AuctionType })
  @IsOptional()
  @IsEnum(AuctionType)
  auctionType?: AuctionType;

  @ApiPropertyOptional({
    enum: [
      'recent',
      'min_bid_asc',
      'appraisal_desc',
      'ending_soon',
      'confidence_desc',
    ],
  })
  @IsOptional()
  @IsString()
  sort?:
    | 'recent'
    | 'min_bid_asc'
    | 'appraisal_desc'
    | 'ending_soon'
    | 'confidence_desc' = 'recent';
}
