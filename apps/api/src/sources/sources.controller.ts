import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { JobsService } from '../jobs/jobs.service';
import { CreateSourceDto } from './dto/create-source.dto';
import { UpdateSourceDto } from './dto/update-source.dto';
import { SourcesService } from './sources.service';

@ApiTags('sources')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN, UserRole.ANALYST)
@Controller('sources')
export class SourcesController {
  constructor(
    private readonly sourcesService: SourcesService,
    private readonly jobsService: JobsService,
  ) {}

  @Get()
  list() {
    return this.sourcesService.list();
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.sourcesService.findById(id);
  }

  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateSourceDto) {
    return this.sourcesService.create(dto);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSourceDto) {
    return this.sourcesService.update(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.sourcesService.remove(id);
  }

  @Roles(UserRole.ADMIN, UserRole.ANALYST)
  @Post(':id/discover')
  async triggerDiscover(@Param('id', ParseUUIDPipe) id: string) {
    const source = await this.sourcesService.findById(id);
    const job = await this.jobsService.enqueue('discovery-queue', {
      type: 'source-discover',
      sourceId: source.id,
    });
    return {
      sourceId: source.id,
      enqueued: job.enqueued,
      mode: job.mode,
      jobId: job.jobId,
      result: job.result ?? null,
    };
  }
}
