import { Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AiEngineService } from './ai-engine.service';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('ai')
export class AiEngineController {
  constructor(private readonly ai: AiEngineService) {}

  @Get('status')
  status() {
    return this.ai.getStatus();
  }

  /** Enriquece leilões sem data/lance — grava no Auction para o mapa. */
  @Roles(UserRole.ADMIN)
  @Post('auctions/enrich-sparse')
  enrichSparse() {
    return this.ai.enrichSparseAuctions(25);
  }

  @Roles(UserRole.ADMIN, UserRole.ANALYST)
  @Post('auctions/:id/analyze')
  analyze(@Param('id', ParseUUIDPipe) id: string) {
    return this.ai.analyzeAuction(id);
  }
}
