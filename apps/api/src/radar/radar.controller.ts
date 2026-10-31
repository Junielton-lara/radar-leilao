import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IntelligenceService } from '../intelligence/intelligence.service';
import { RadarService } from './radar.service';

@ApiTags('radar')
@ApiBearerAuth()
@Controller('radar')
export class RadarController {
  constructor(
    private readonly radarService: RadarService,
    private readonly intelligence: IntelligenceService,
  ) {}

  @Get('indicators')
  indicators() {
    return this.radarService.indicators();
  }

  @Get('coverage')
  coverage() {
    return this.radarService.coverage();
  }

  @Get('intelligence/latest')
  intelligenceLatest() {
    return this.intelligence.latest();
  }

  @Get('intelligence/meta')
  intelligenceMeta() {
    return this.intelligence.meta();
  }
}
