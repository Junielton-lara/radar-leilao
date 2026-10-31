import { ApiPropertyOptional } from '@nestjs/swagger';
import { BrazilianState } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class RunDiscoveryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  sourceId?: string;

  @ApiPropertyOptional({ enum: BrazilianState, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(BrazilianState, { each: true })
  states?: BrazilianState[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;
}
