import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class UpsertIntegrationDto {
  @ApiProperty({ description: 'Provider key: tavily | ai' })
  @IsString()
  @MinLength(2)
  provider!: string;

  @ApiPropertyOptional({ description: 'API key — stored encrypted; never returned in full' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  apiKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  dailyLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  monthlyLimit?: number;

  @ApiPropertyOptional({ description: 'AI base URL (OpenAI-compatible)' })
  @IsOptional()
  @IsString()
  baseUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  extraConfig?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Nota operacional (visível no admin)' })
  @IsOptional()
  @IsString()
  note?: string;
}

/** Body for PUT /settings/integrations/:provider (provider comes from path). */
export class UpsertIntegrationByProviderDto implements Omit<
  UpsertIntegrationDto,
  'provider'
> {
  @ApiPropertyOptional({ description: 'API key — stored encrypted; never returned in full' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  apiKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  dailyLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  monthlyLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  baseUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  extraConfig?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
