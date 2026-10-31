import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { TavilyService } from './tavily.service';

@ApiTags('tavily')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN, UserRole.ANALYST)
@Controller('tavily')
export class TavilyController {
  constructor(private readonly tavilyService: TavilyService) {}

  @Get('status')
  status() {
    return this.tavilyService.getStatus();
  }
}
