import { Global, Module, forwardRef } from '@nestjs/common';
import { AuctionsModule } from '../auctions/auctions.module';
import { AiEngineModule } from '../ai-engine/ai-engine.module';
import { DiscoveryModule } from '../discovery/discovery.module';
import { DocumentsModule } from '../documents/documents.module';
import { GeolocationModule } from '../geolocation/geolocation.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TavilyModule } from '../tavily/tavily.module';
import { VerificationModule } from '../verification/verification.module';
import { JobsController } from './jobs.controller';
import { JobsScheduler } from './jobs.scheduler';
import { JobsService } from './jobs.service';

@Global()
@Module({
  imports: [
    TavilyModule,
    forwardRef(() => DiscoveryModule),
    forwardRef(() => DocumentsModule),
    forwardRef(() => AiEngineModule),
    forwardRef(() => VerificationModule),
    forwardRef(() => GeolocationModule),
    forwardRef(() => NotificationsModule),
    forwardRef(() => AuctionsModule),
  ],
  controllers: [JobsController],
  providers: [JobsService, JobsScheduler],
  exports: [JobsService],
})
export class JobsModule {}
