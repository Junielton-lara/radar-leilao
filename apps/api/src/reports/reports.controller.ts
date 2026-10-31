import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsOptional, IsString } from 'class-validator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { ReportsService } from './reports.service';

class DayQuery {
  @IsOptional()
  @IsString()
  day?: string;
}

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN, UserRole.ANALYST, UserRole.USER)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('daily')
  daily(@Query() query: DayQuery) {
    const day = query.day ? new Date(query.day) : new Date();
    return this.reportsService.dailyExecutiveSummary(day);
  }
}
