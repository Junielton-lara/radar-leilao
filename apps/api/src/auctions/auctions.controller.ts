import { Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuctionsService } from './auctions.service';
import { BboxQueryDto } from './dto/bbox-query.dto';
import { AuctionListQueryDto } from './dto/list-query.dto';

@ApiTags('auctions')
@ApiBearerAuth()
@Controller('auctions')
export class AuctionsController {
  constructor(private readonly auctionsService: AuctionsService) {}

  @Get()
  list(@Query() query: AuctionListQueryDto) {
    return this.auctionsService.list(query);
  }

  @Get('geo/bbox')
  bbox(@Query() query: BboxQueryDto) {
    return this.auctionsService.findInBbox(query);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('geo/backfill-states')
  backfillStates() {
    return this.auctionsService.backfillApproximateCoordinates(2000);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('vehicle-categories/reclassify')
  reclassifyVehicleCategories() {
    return this.auctionsService.reclassifyVehicleCategories(5000);
  }

  @Get('featured')
  featured() {
    return this.auctionsService.featured();
  }

  @Get('ending-soon')
  endingSoon() {
    return this.auctionsService.endingSoon();
  }

  @Get(':id')
  detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.auctionsService.findById(id);
  }
}
