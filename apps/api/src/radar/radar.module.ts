import { Module } from '@nestjs/common';
import { IntelligenceModule } from '../intelligence/intelligence.module';
import { RadarController } from './radar.controller';
import { RadarService } from './radar.service';

@Module({
  imports: [IntelligenceModule],
  controllers: [RadarController],
  providers: [RadarService],
})
export class RadarModule {}
