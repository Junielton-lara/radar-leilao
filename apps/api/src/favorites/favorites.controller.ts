import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { FavoritesService } from './favorites.service';

@ApiTags('favorites')
@ApiBearerAuth()
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.favorites.list(user.id);
  }

  @Post(':auctionId')
  add(
    @CurrentUser() user: { id: string },
    @Param('auctionId', ParseUUIDPipe) auctionId: string,
  ) {
    return this.favorites.add(user.id, auctionId);
  }

  @Delete(':auctionId')
  remove(
    @CurrentUser() user: { id: string },
    @Param('auctionId', ParseUUIDPipe) auctionId: string,
  ) {
    return this.favorites.remove(user.id, auctionId);
  }
}
