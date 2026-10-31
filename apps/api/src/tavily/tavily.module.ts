import { Module } from '@nestjs/common';
import { TavilyController } from './tavily.controller';
import { TavilyService } from './tavily.service';

@Module({
  controllers: [TavilyController],
  providers: [TavilyService],
  exports: [TavilyService],
})
export class TavilyModule {}
