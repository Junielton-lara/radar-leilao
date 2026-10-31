import { Module } from '@nestjs/common';
import { AiEngineModule } from '../ai-engine/ai-engine.module';
import { TavilyModule } from '../tavily/tavily.module';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  imports: [TavilyModule, AiEngineModule],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
