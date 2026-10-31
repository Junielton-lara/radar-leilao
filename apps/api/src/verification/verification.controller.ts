import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole, VerificationStatus } from '@prisma/client';
import { IsEnum, IsString, MinLength } from 'class-validator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { VerificationService } from './verification.service';

class ManualStatusDto {
  @IsEnum(VerificationStatus)
  status!: VerificationStatus;

  @IsString()
  @MinLength(5)
  reason!: string;
}

@ApiTags('verification')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller()
export class VerificationController {
  constructor(private readonly verification: VerificationService) {}

  @Roles(UserRole.ADMIN, UserRole.ANALYST)
  @Post('verification/auctions/:id/evaluate')
  evaluate(@Param('id', ParseUUIDPipe) id: string) {
    return this.verification.evaluate(id);
  }

  @Get('auctions/:id/history')
  history(@Param('id', ParseUUIDPipe) id: string) {
    return this.verification.history(id);
  }

  @Roles(UserRole.ADMIN, UserRole.ANALYST)
  @Patch('auctions/:id/verification')
  override(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ManualStatusDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.verification.manualOverride(
      id,
      dto.status,
      dto.reason,
      user.id,
    );
  }
}
