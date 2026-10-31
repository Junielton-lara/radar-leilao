import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  UpsertIntegrationByProviderDto,
  UpsertIntegrationDto,
} from './dto/upsert-integration.dto';
import { SettingsService } from './settings.service';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Public()
  @Get('product')
  product() {
    return this.settingsService.product();
  }

  @ApiBearerAuth()
  @Get('integrations')
  integrations() {
    return this.settingsService.integrationsStatus();
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('integrations/:provider')
  getIntegration(@Param('provider') provider: string) {
    return this.settingsService.getIntegration(provider);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put('integrations')
  upsertIntegration(@Body() dto: UpsertIntegrationDto) {
    return this.settingsService.upsertIntegration(dto);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put('integrations/:provider')
  upsertIntegrationByProvider(
    @Param('provider') provider: string,
    @Body() dto: UpsertIntegrationByProviderDto,
  ) {
    return this.settingsService.upsertIntegration({
      ...dto,
      provider,
    });
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('integrations/:provider/test')
  testIntegration(@Param('provider') provider: string) {
    return this.settingsService.testIntegration(provider);
  }
}
