import { Module } from '@nestjs/common';
import { AiEngineModule } from '../ai-engine/ai-engine.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [AiEngineModule],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
