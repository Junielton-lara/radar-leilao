import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BrazilianState, UserRole } from '@prisma/client';
import { IsArray, IsEnum, IsOptional } from 'class-validator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { JobsService } from '../jobs/jobs.service';
import { DiscoveryService } from './discovery.service';

class StartDiscoveryDto {
  @IsOptional()
  @IsArray()
  @IsEnum(BrazilianState, { each: true })
  states?: BrazilianState[];

  @IsOptional()
  sourceId?: string;
}

@ApiTags('discovery')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN, UserRole.ANALYST)
@Controller('discovery')
export class DiscoveryController {
  constructor(
    private readonly discovery: DiscoveryService,
    private readonly jobs: JobsService,
  ) {}

  @Get('runs')
  async listRuns() {
    const rows = await this.discovery.listRuns();
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      status: r.status,
      startedAt: (r.startedAt ?? r.createdAt).toISOString(),
      finishedAt: r.finishedAt?.toISOString() ?? null,
      foundCount: r._count.items,
      opportunitiesFound: r.opportunitiesFound,
      successCount: r.successCount,
      failureCount: r.failureCount,
    }));
  }

  @Get('runs/:id')
  getRun(@Param('id', ParseUUIDPipe) id: string) {
    return this.discovery.getRun(id);
  }

  @Post('runs')
  async start(@Body() dto: StartDiscoveryDto) {
    const job = await this.jobs.enqueue('discovery-queue', {
      type: dto.sourceId ? 'source-discover' : 'daily',
      sourceId: dto.sourceId,
      states: dto.states,
    });
    return job;
  }

  @Post('runs/sync')
  sync(@Body() dto: StartDiscoveryDto) {
    if (dto.sourceId) return this.discovery.runForSource(dto.sourceId, dto.states);
    return this.discovery.runDailyRound(dto.states);
  }
}
