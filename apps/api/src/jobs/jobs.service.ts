import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  forwardRef,
} from '@nestjs/common';
import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { AiEngineService } from '../ai-engine/ai-engine.service';
import { DiscoveryService } from '../discovery/discovery.service';
import { DocumentsService } from '../documents/documents.service';
import { GeolocationService } from '../geolocation/geolocation.service';
import { NotificationsService } from '../notifications/notifications.service';
import { VerificationService } from '../verification/verification.service';
import {
  DEFAULT_JOB_OPTIONS,
  QUEUE_CONCURRENCY,
  QUEUE_NAMES,
  QueueName,
} from './jobs.constants';

export type EnqueueResult = {
  enqueued: boolean;
  mode: 'redis' | 'inline';
  jobId?: string;
  queue: string;
  result?: unknown;
};

function redisConnectionOpts() {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  try {
    const u = new URL(url);
    return {
      host: u.hostname || 'localhost',
      port: Number(u.port || 6379),
      password: u.password ? decodeURIComponent(u.password) : undefined,
      maxRetriesPerRequest: null as null,
    };
  } catch {
    return {
      host: 'localhost',
      port: 6379,
      maxRetriesPerRequest: null as null,
    };
  }
}

@Injectable()
export class JobsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobsService.name);
  private redisAvailable = false;
  private readonly queues = new Map<string, Queue>();
  private readonly workers: Worker[] = [];

  constructor(
    @Inject(forwardRef(() => DiscoveryService))
    private readonly discoveryService: DiscoveryService,
    @Inject(forwardRef(() => DocumentsService))
    private readonly documentsService: DocumentsService,
    @Inject(forwardRef(() => AiEngineService))
    private readonly aiEngineService: AiEngineService,
    @Inject(forwardRef(() => VerificationService))
    private readonly verificationService: VerificationService,
    private readonly geolocationService: GeolocationService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  async onModuleInit() {
    if (process.env.JOBS_ENABLED === 'false') {
      this.redisAvailable = false;
      this.logger.warn('JOBS_ENABLED=false — filas desativadas (modo inline sob demanda)');
      return;
    }
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    let probe: IORedis | null = null;
    try {
      probe = new IORedis(url, {
        maxRetriesPerRequest: null,
        connectTimeout: 1500,
        lazyConnect: true,
        retryStrategy: () => null,
      });
      await Promise.race([
        (async () => {
          await probe!.connect();
          await probe!.ping();
        })(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Redis probe timeout')), 2000),
        ),
      ]);
      await probe.quit();
      probe = null;
      this.redisAvailable = true;
      this.setupQueuesAndWorkers();
      this.logger.log('Redis OK — filas BullMQ ativas');
    } catch (e) {
      this.redisAvailable = false;
      this.logger.warn(
        `Redis indisponível (${e instanceof Error ? e.message : e}) — jobs em modo inline/fallback`,
      );
      if (probe) {
        try {
          await probe.quit();
        } catch {
          probe.disconnect();
        }
      }
    }
  }

  async onModuleDestroy() {
    await Promise.all(this.workers.map((w) => w.close()));
    await Promise.all([...this.queues.values()].map((q) => q.close()));
  }

  isRedisAvailable() {
    return this.redisAvailable;
  }

  async enqueue(
    queue: QueueName,
    data: Record<string, unknown>,
    opts?: { name?: string },
  ): Promise<EnqueueResult> {
    if (this.redisAvailable && this.queues.has(queue)) {
      const job = await this.queues.get(queue)!.add(
        opts?.name ?? String(data.type ?? 'job'),
        data,
        DEFAULT_JOB_OPTIONS,
      );
      return {
        enqueued: true,
        mode: 'redis',
        jobId: job.id,
        queue,
      };
    }
    const result = await this.dispatch(queue, data);
    return {
      enqueued: false,
      mode: 'inline',
      queue,
      result,
    };
  }

  async getStats() {
    if (!this.redisAvailable) {
      return {
        redisAvailable: false,
        message: 'Redis down — filas em fallback inline',
        queues: Object.fromEntries(
          QUEUE_NAMES.map((n) => [
            n,
            { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 },
          ]),
        ),
      };
    }
    const queues: Record<string, unknown> = {};
    for (const name of QUEUE_NAMES) {
      const q = this.queues.get(name);
      if (!q) continue;
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        q.getWaitingCount(),
        q.getActiveCount(),
        q.getCompletedCount(),
        q.getFailedCount(),
        q.getDelayedCount(),
      ]);
      queues[name] = { waiting, active, completed, failed, delayed };
    }
    return { redisAvailable: true, queues };
  }

  private setupQueuesAndWorkers() {
    const connection = redisConnectionOpts();
    for (const name of QUEUE_NAMES) {
      const queue = new Queue(name, { connection });
      this.queues.set(name, queue);
      const worker = new Worker(
        name,
        async (job: Job) =>
          this.dispatch(name, job.data as Record<string, unknown>),
        {
          connection,
          concurrency: QUEUE_CONCURRENCY[name],
        },
      );
      worker.on('failed', (job, err) => {
        this.logger.error(`Job ${name}/${job?.id} failed: ${err.message}`);
      });
      this.workers.push(worker);
    }
  }

  private async dispatch(
    queue: QueueName | string,
    data: Record<string, unknown>,
  ) {
    const type = String(data.type ?? '');
    switch (queue) {
      case 'discovery-queue':
        if (type === 'source-discover') {
          return this.discoveryService.run({
            sourceId: String(data.sourceId),
          });
        }
        return this.discoveryService.run({
          sourceId: data.sourceId ? String(data.sourceId) : undefined,
          states: data.states as never,
          categories: data.categories as string[] | undefined,
          name: data.name ? String(data.name) : undefined,
        });
      case 'document-processing-queue':
        return this.documentsService.processQueued({
          documentId: String(data.documentId),
        });
      case 'ai-analysis-queue': {
        const auctionId = String(data.auctionId);
        const analysis = await this.aiEngineService.runPipeline(auctionId);
        try {
          await this.verificationService.evaluate(auctionId);
        } catch (err) {
          this.logger.warn(
            `verification after AI ${auctionId}: ${String(err)}`,
          );
        }
        return analysis;
      }
      case 'verification-queue':
        return this.verificationService.evaluate(String(data.auctionId));
      case 'geocoding-queue':
        return this.geolocationService.geocode({
          auctionId: String(data.auctionId),
          address: data.address ? String(data.address) : undefined,
          city: data.city ? String(data.city) : undefined,
          state: data.state ? String(data.state) : undefined,
        });
      case 'notification-queue':
        return this.notificationsService.processAlertJob(data);
      case 'extraction-queue':
      case 'monitoring-queue':
        this.logger.debug(`No-op handler for ${queue}/${type}`);
        return { ok: true, skipped: true, queue, type };
      default:
        return { ok: false, message: `Unknown queue ${queue}` };
    }
  }
}
