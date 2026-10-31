import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TavilyService } from '../tavily/tavily.service';
import { JobsService } from './jobs.service';

/**
 * Cron schedulers. When integrations are disabled, jobs no-op after status checks.
 * When Redis is down, enqueue runs inline (discovery still refuses if Tavily off).
 */
@Injectable()
export class JobsScheduler {
  private readonly logger = new Logger(JobsScheduler.name);

  constructor(
    private readonly jobs: JobsService,
    private readonly tavily: TavilyService,
  ) {}

  /** 8 ciclos/dia — horário de Brasília (UTC−3 → UTC). */
  @Cron('0 10,12,14,16,18,20,22,0 * * *')
  async scheduledDiscoveryBrasilia() {
    const status = await this.tavily.getStatus();
    if (!status.configured || status.disabledByLimit) {
      this.logger.debug(`Discovery BRT cron skipped: ${status.message}`);
      return;
    }
    await this.jobs.enqueue('discovery-queue', {
      type: 'discovery-run',
      name: `cron-brt-${new Date().toISOString()}`,
    });
  }

  /** Legado: mantém coleta horária extra se JOBS_LEGACY_HOURLY=true */
  @Cron(CronExpression.EVERY_HOUR)
  async scheduledDiscovery() {
    if (process.env.JOBS_LEGACY_HOURLY !== 'true') return;
    const status = await this.tavily.getStatus();
    if (!status.configured || status.disabledByLimit) {
      this.logger.debug(`Discovery cron skipped: ${status.message}`);
      return;
    }
    await this.jobs.enqueue('discovery-queue', {
      type: 'discovery-run',
      name: `cron-hourly-${new Date().toISOString()}`,
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async scheduledMonitoring() {
    await this.jobs.enqueue('monitoring-queue', {
      type: 'daily-monitor',
      at: new Date().toISOString(),
    });
  }
}
