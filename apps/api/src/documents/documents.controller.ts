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
import { UserRole } from '@prisma/client';
import { IsString, IsUrl, MinLength } from 'class-validator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { DocumentsService } from './documents.service';

class RegisterDocumentDto {
  @IsString()
  @MinLength(2)
  documentType!: string;

  @IsString()
  @MinLength(2)
  title!: string;

  @IsUrl()
  originalUrl!: string;
}

@ApiTags('documents')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('auctions/:auctionId/documents')
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Get()
  list(@Param('auctionId', ParseUUIDPipe) auctionId: string) {
    return this.documents.listByAuction(auctionId);
  }

  @Roles(UserRole.ADMIN, UserRole.ANALYST)
  @Post()
  register(
    @Param('auctionId', ParseUUIDPipe) auctionId: string,
    @Body() dto: RegisterDocumentDto,
  ) {
    return this.documents.registerRemote({ auctionId, ...dto });
  }
}
