export const QUEUE_NAMES = [
  'discovery-queue',
  'extraction-queue',
  'document-processing-queue',
  'ai-analysis-queue',
  'verification-queue',
  'geocoding-queue',
  'monitoring-queue',
  'notification-queue',
] as const;

export type QueueName = (typeof QUEUE_NAMES)[number];

export const DEFAULT_JOB_OPTIONS = {
  attempts: 5,
  backoff: { type: 'exponential' as const, delay: 2000 },
  removeOnComplete: 100,
  removeOnFail: 200,
};

export const QUEUE_CONCURRENCY: Record<QueueName, number> = {
  'discovery-queue': 1,
  'extraction-queue': 2,
  'document-processing-queue': 2,
  'ai-analysis-queue': 1,
  'verification-queue': 2,
  'geocoding-queue': 2,
  'monitoring-queue': 1,
  'notification-queue': 2,
};
