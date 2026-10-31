import { Module } from '@nestjs/common';
import { AiEngineModule } from '../ai-engine/ai-engine.module';
import { JobsModule } from '../jobs/jobs.module';
import { TavilyModule } from '../tavily/tavily.module';
import { IntelligenceModule } from '../intelligence/intelligence.module';
import { AdminController } from './admin.controller';
import { AdminIntelligenceController } from './admin-intelligence.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [JobsModule, TavilyModule, AiEngineModule, IntelligenceModule],
  controllers: [AdminController, AdminIntelligenceController],
  providers: [AdminService],
})
export class AdminModule {}
