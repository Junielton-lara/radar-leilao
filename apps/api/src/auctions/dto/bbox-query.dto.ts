import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class BboxQueryDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  minLng!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  minLat!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  maxLng!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  maxLat!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(22)
  zoom?: number;

  @ApiPropertyOptional({ description: 'Comma-separated category slugs (veiculos, motocicletas, …)' })
  @IsOptional()
  @IsString()
  categorySlugs?: string;

  @ApiPropertyOptional({ description: 'Comma-separated category UUIDs' })
  @IsOptional()
  @IsString()
  categoryIds?: string;

  @ApiPropertyOptional({ description: 'Comma-separated UF codes' })
  @IsOptional()
  @IsString()
  states?: string;

  @ApiPropertyOptional({ description: 'Comma-separated verification statuses' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ default: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5000)
  limit?: number = 200;
}
