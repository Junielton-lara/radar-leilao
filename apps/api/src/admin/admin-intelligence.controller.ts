import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { IntelligenceService } from '../intelligence/intelligence.service';

class ImportBriefingDto {
  title!: string;
  cutOffAt?: string;
  narrativeMarkdown!: string;
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/intelligence')
export class AdminIntelligenceController {
  constructor(private readonly intelligence: IntelligenceService) {}

  @Get('prompt')
  async prompt() {
    const text = await this.intelligence.getSystemPrompt();
    return { prompt: text, meta: this.intelligence.meta() };
  }

  @Post('snapshot')
  snapshot() {
    return this.intelligence.createSnapshot({ source: 'system' });
  }

  @Post('import')
  import(@Body() dto: ImportBriefingDto) {
    return this.intelligence.importBriefing(dto);
  }
}
